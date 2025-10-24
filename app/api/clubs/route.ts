import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any)?.role;
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const club = await prisma.club.create({
      data: {
        name: String(body.name),
        street: String(body.street),
        houseNumber: String(body.houseNumber),
        zipAndCity: String(body.zipAndCity),
        logoPath: body.logoPath ? String(body.logoPath) : null,
        watermarkPath: body.watermarkPath ? String(body.watermarkPath) : null,
        clubPhone: body.clubPhone ? String(body.clubPhone) : null,
        clubMobile: body.clubMobile ? String(body.clubMobile) : null,
        clubMobileWhatsApp: Boolean(body.clubMobileWhatsApp),
        clubEmail: body.clubEmail ? String(body.clubEmail) : null,
        jobPhone: body.jobPhone ? String(body.jobPhone) : null,
        jobMobile: body.jobMobile ? String(body.jobMobile) : null,
        jobMobileWhatsApp: Boolean(body.jobMobileWhatsApp),
        jobEmail: body.jobEmail ? String(body.jobEmail) : null,
        jobContactPerson: body.jobContactPerson ? String(body.jobContactPerson) : null,
        openingHours: body.openingHours ?? {},
      },
    });
    return NextResponse.json(club);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bad Request' }, { status: 400 });
  }
}

export async function GET() {
  try {
    const clubs = await prisma.club.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ items: clubs });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
