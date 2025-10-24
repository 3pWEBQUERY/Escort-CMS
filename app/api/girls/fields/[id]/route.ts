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

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;
  const { id } = await context.params;
  try {
    const body = await req.json();
    const updated = await prisma.girlField.update({
      where: { id },
      data: {
        name: body.name !== undefined ? String(body.name) : undefined,
        slug: body.slug !== undefined ? String(body.slug) : undefined,
        type: body.type !== undefined ? (String(body.type) as any) : undefined,
        required: body.required !== undefined ? Boolean(body.required) : undefined,
        placeholder: body.placeholder === undefined ? undefined : (body.placeholder ? String(body.placeholder) : null),
        helpText: body.helpText === undefined ? undefined : (body.helpText ? String(body.helpText) : null),
        options: body.options === undefined ? undefined : (body.options ?? null),
        containerColumns: body.containerColumns === undefined ? undefined : (body.containerColumns != null ? Number(body.containerColumns) : null),
        colSpan: body.colSpan === undefined ? undefined : (body.colSpan != null ? Number(body.colSpan) : null),
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bad Request' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;
  const { id } = await context.params;
  try {
    await prisma.girlField.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bad Request' }, { status: 400 });
  }
}
