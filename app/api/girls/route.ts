import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function requireAdmin(session: any) {
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any)?.role;
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

export async function GET() {
  // simple list with count
  const total = await prisma.girl.count();
  const items = await prisma.girl.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { values: true } });
  return NextResponse.json({ total, items });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;

  try {
    const body = await req.json();
    const values: Record<string, any> = body?.values || {};

    // Load field definitions to validate
    const fields = await prisma.girlField.findMany();
    const bySlug: Record<string, typeof fields[number]> = {};
    for (const f of fields) bySlug[f.slug] = f as any;

    // Validate required
    const missing: string[] = [];
    for (const f of fields) {
      if (f.type === 'SECTION') continue;
      if (f.required) {
        const v = values[f.slug];
        const empty = v == null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
        if (empty) missing.push(f.name);
      }
    }
    if (missing.length) {
      return NextResponse.json({ error: 'Required fields missing', fields: missing }, { status: 400 });
    }

    // Normalize values (basic)
    const normalized: { slug: string; value: any }[] = [];
    for (const [slug, v] of Object.entries(values)) {
      const def = bySlug[slug];
      if (!def || def.type === 'SECTION') continue;
      let val: any = v;
      switch (def.type) {
        case 'NUMBER':
          val = typeof v === 'number' ? v : Number(v);
          if (isNaN(val as number)) val = null;
          break;
        case 'MULTISELECT':
          val = Array.isArray(v) ? v : (v == null ? [] : [String(v)]);
          break;
        case 'SELECT':
        case 'SELECT_SEARCH':
        case 'INPUT':
        case 'TEXTAREA':
          val = v == null ? '' : String(v);
          break;
        case 'GALLERY':
          // expect array of {name,url,...}
          val = Array.isArray(v) ? v : [];
          break;
        default:
          // unknown types -> store raw
          val = v;
      }
      normalized.push({ slug, value: val });
    }

    const created = await prisma.$transaction(async (tx) => {
      const girl = await tx.girl.create({ data: {} });
      if (normalized.length) {
        await tx.girlFieldValue.createMany({
          data: normalized.map((n) => ({ girlId: girl.id, fieldSlug: n.slug, value: n.value as any })),
        });
      }
      return girl;
    });

    return NextResponse.json({ id: created.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bad Request' }, { status: 400 });
  }
}
