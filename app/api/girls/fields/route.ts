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
  const items = await prisma.girlField.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;

  try {
    const body = await req.json();
    const count = await prisma.girlField.count({ where: { parentId: body.parentId ?? null } });
    const created = await prisma.girlField.create({
      data: {
        name: String(body.name),
        slug: String(body.slug),
        type: String(body.type) as any,
        required: Boolean(body.required),
        placeholder: body.placeholder ? String(body.placeholder) : null,
        helpText: body.helpText ? String(body.helpText) : null,
        options: body.options ?? null,
        parentId: body.parentId ?? null,
        containerColumns: body.containerColumns != null ? Number(body.containerColumns) : null,
        colSpan: body.colSpan != null ? Number(body.colSpan) : null,
        order: typeof body.order === 'number' ? body.order : count,
      },
    });
    return NextResponse.json(created);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bad Request' }, { status: 400 });
  }
}

// Reorder in bulk: [{id, order, parentId}]
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;

  try {
    const body = await req.json();
    const updates: Array<{ id: string; order: number; parentId?: string | null }> = body.items || [];
    await prisma.$transaction(
      updates.map((u) =>
        prisma.girlField.update({ where: { id: u.id }, data: { order: u.order, parentId: u.parentId ?? null } })
      )
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bad Request' }, { status: 400 });
  }
}
