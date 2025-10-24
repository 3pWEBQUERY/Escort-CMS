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

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;
  const { id } = await context.params;
  try {
    const body = await req.json();
    const values: Record<string, any> = body?.values || {};
    const entries = Object.entries(values);
    if (entries.length === 0) return NextResponse.json({ ok: true });

    await prisma.$transaction(async (tx) => {
      for (const [slug, value] of entries) {
        const existing = await tx.girlFieldValue.findFirst({ where: { girlId: id, fieldSlug: slug } });
        if (existing) {
          await tx.girlFieldValue.update({ where: { id: existing.id }, data: { value } });
        } else {
          await tx.girlFieldValue.create({ data: { girlId: id, fieldSlug: slug, value } });
        }
      }
    });
    return NextResponse.json({ ok: true });
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
    await prisma.$transaction(async (tx) => {
      await tx.girlFieldValue.deleteMany({ where: { girlId: id } });
      await tx.girl.delete({ where: { id } });
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bad Request' }, { status: 400 });
  }
}
