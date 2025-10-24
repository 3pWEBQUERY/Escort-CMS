import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const club = await prisma.club.findUnique({ where: { id } });
    if (!club) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(club);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any)?.role;
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const { id } = await params;
    const existing = await prisma.club.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    const updated = await prisma.club.update({
      where: { id },
      data: {
        name: body.name !== undefined ? String(body.name) : existing.name,
        street: body.street !== undefined ? String(body.street) : existing.street,
        houseNumber: body.houseNumber !== undefined ? String(body.houseNumber) : existing.houseNumber,
        zipAndCity: body.zipAndCity !== undefined ? String(body.zipAndCity) : existing.zipAndCity,
        logoPath: body.logoPath !== undefined ? (body.logoPath ? String(body.logoPath) : null) : existing.logoPath,
        watermarkPath: body.watermarkPath !== undefined ? (body.watermarkPath ? String(body.watermarkPath) : null) : existing.watermarkPath,
        clubPhone: body.clubPhone !== undefined ? (body.clubPhone ? String(body.clubPhone) : null) : existing.clubPhone,
        clubMobile: body.clubMobile !== undefined ? (body.clubMobile ? String(body.clubMobile) : null) : existing.clubMobile,
        clubMobileWhatsApp: body.clubMobileWhatsApp !== undefined ? Boolean(body.clubMobileWhatsApp) : existing.clubMobileWhatsApp,
        clubEmail: body.clubEmail !== undefined ? (body.clubEmail ? String(body.clubEmail) : null) : existing.clubEmail,
        jobPhone: body.jobPhone !== undefined ? (body.jobPhone ? String(body.jobPhone) : null) : existing.jobPhone,
        jobMobile: body.jobMobile !== undefined ? (body.jobMobile ? String(body.jobMobile) : null) : existing.jobMobile,
        jobMobileWhatsApp: body.jobMobileWhatsApp !== undefined ? Boolean(body.jobMobileWhatsApp) : existing.jobMobileWhatsApp,
        jobEmail: body.jobEmail !== undefined ? (body.jobEmail ? String(body.jobEmail) : null) : existing.jobEmail,
        jobContactPerson: body.jobContactPerson !== undefined ? (body.jobContactPerson ? String(body.jobContactPerson) : null) : existing.jobContactPerson,
        openingHours: body.openingHours !== undefined ? body.openingHours : (existing as any).openingHours,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bad Request' }, { status: 400 });
  }
}
