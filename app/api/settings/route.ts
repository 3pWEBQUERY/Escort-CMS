import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DEFAULTS = {
  siteName: 'ESCORT-CMS',
  siteDescription: 'Content Management System für Escort-Agenturen',
  adminEmail: 'admin@example.com',
  timeZone: 'Europe/Berlin',
  dateFormat: 'dd.MM.yyyy',
  timeFormat: 'HH:mm',
  logoPath: null as string | null,
  faviconPath: null as string | null,
  allowRegistration: true,
  defaultRole: 'author',
  requireEmailVerification: true,
  enableTwoFactorAuth: false,
  passwordMinLength: 8,
  sessionTimeout: 30,
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
  if (!settings) {
    const created = await prisma.settings.create({ data: { id: 'singleton', ...DEFAULTS } });
    return NextResponse.json(created);
  }
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Optional: only ADMIN can update
  const role = (session.user as any)?.role;
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const data = {
    siteName: String(body.siteName ?? DEFAULTS.siteName),
    siteDescription: String(body.siteDescription ?? DEFAULTS.siteDescription),
    adminEmail: String(body.adminEmail ?? DEFAULTS.adminEmail),
    timeZone: String(body.timeZone ?? DEFAULTS.timeZone),
    dateFormat: String(body.dateFormat ?? DEFAULTS.dateFormat),
    timeFormat: String(body.timeFormat ?? DEFAULTS.timeFormat),
    logoPath: body.logoPath === null ? null : (body.logoPath ? String(body.logoPath) : DEFAULTS.logoPath),
    faviconPath: body.faviconPath === null ? null : (body.faviconPath ? String(body.faviconPath) : DEFAULTS.faviconPath),
    allowRegistration: Boolean(body.allowRegistration ?? DEFAULTS.allowRegistration),
    defaultRole: String(body.defaultRole ?? DEFAULTS.defaultRole),
    requireEmailVerification: Boolean(body.requireEmailVerification ?? DEFAULTS.requireEmailVerification),
    enableTwoFactorAuth: Boolean(body.enableTwoFactorAuth ?? DEFAULTS.enableTwoFactorAuth),
    passwordMinLength: Number(body.passwordMinLength ?? DEFAULTS.passwordMinLength),
    sessionTimeout: Number(body.sessionTimeout ?? DEFAULTS.sessionTimeout),
  };

  const updated = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: data,
    create: { id: 'singleton', ...data },
  });

  return NextResponse.json(updated);
}
