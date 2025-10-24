import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';

const MEDIA_DIR = path.resolve(process.cwd(), 'public', 'medien');

async function ensureDir() {
  try {
    await fs.mkdir(MEDIA_DIR, { recursive: true });
  } catch {}
}

export async function GET(req: Request) {
  await ensureDir();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.max(1, Math.min(200, parseInt(searchParams.get('pageSize') || '25', 10)));
  const sort = (searchParams.get('sort') || 'name_asc').toLowerCase();
  const q = (searchParams.get('q') || '').toLowerCase();
  const type = (searchParams.get('type') || 'all').toLowerCase();

  const files = await fs.readdir(MEDIA_DIR).catch(() => [] as string[]);
  const baseAll = files.filter((f) => !f.startsWith('.'));
  const isImageExt = (name: string) => /\.(png|jpg|jpeg|gif|webp|avif|svg)$/i.test(name);
  const isVideoExt = (name: string) => /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(name);
  const base =
    type === 'image' ? baseAll.filter(isImageExt)
    : type === 'video' ? baseAll.filter(isVideoExt)
    : baseAll;
  let names = base;

  if (q) {
    const fromFilename = new Set(base.filter((n) => n.toLowerCase().includes(q)));
    const dbMatches = await prisma.media.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { name: true },
    });
    const dbSet = new Set(dbMatches.map((m) => m.name));
    names = base.filter((n) => fromFilename.has(n) || dbSet.has(n));
  }
  if (sort === 'name_desc') {
    names = [...names].sort((a, b) => b.localeCompare(a));
  } else if (sort === 'date_desc' || sort === 'date_asc') {
    const stats = await Promise.all(
      names.map(async (name) => {
        try {
          const s = await fs.stat(path.join(MEDIA_DIR, name));
          return { name, mtimeMs: s.mtimeMs };
        } catch {
          return { name, mtimeMs: 0 };
        }
      })
    );
    stats.sort((a, b) => (sort === 'date_desc' ? b.mtimeMs - a.mtimeMs : a.mtimeMs - b.mtimeMs));
    names = stats.map((s) => s.name);
  } else {
    // default name_asc
    names = [...names].sort((a, b) => a.localeCompare(b));
  }
  const total = names.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageNames = names.slice(startIdx, startIdx + pageSize);

  // Fetch metadata for current page files only
  const metas = pageNames.length
    ? await prisma.media.findMany({ where: { name: { in: pageNames } } })
    : [];
  type Meta = { name: string; title: string | null; alt: string | null; description: string | null };
  const metaMap = new Map<string, Meta>(metas.map((m: any) => [m.name, {
    name: m.name,
    title: (m as any).title ?? null,
    alt: (m as any).alt ?? null,
    description: (m as any).description ?? null,
  }]));

  const items = pageNames.map((name) => {
    const url = `/medien/${name}`;
    const meta = metaMap.get(name);
    return {
      name,
      url,
      title: meta?.title ?? null,
      alt: meta?.alt ?? null,
      description: meta?.description ?? null,
    };
  });

  return NextResponse.json({ items, total, page: currentPage, pageSize, totalPages });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any)?.role;
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureDir();
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  // Sanitize filename
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const target = path.join(MEDIA_DIR, safeName);
  await fs.writeFile(target, buffer);
  // Upsert DB record for metadata management
  const url = `/medien/${safeName}`;
  await prisma.media.upsert({
    where: { name: safeName },
    update: { url },
    create: { name: safeName, url },
  });

  return NextResponse.json({ name: safeName, url });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any)?.role;
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const name = String(body.name || '');
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });
  const title = body.title != null ? String(body.title) : null;
  const alt = body.alt != null ? String(body.alt) : null;
  const description = body.description != null ? String(body.description) : null;

  const url = `/medien/${name}`;
  const rec = await prisma.media.upsert({
    where: { name },
    update: { title, alt, description, url },
    create: { name, url, title, alt, description },
  });
  return NextResponse.json(rec);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any)?.role;
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });
  const target = path.join(MEDIA_DIR, name);
  try {
    await fs.unlink(target);
  } catch {}
  await prisma.media.deleteMany({ where: { name } });
  return NextResponse.json({ ok: true });
}
