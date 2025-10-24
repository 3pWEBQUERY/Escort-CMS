import type { Metadata } from "next";
import "./globals.css";
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
    const title = settings?.siteName || 'ESCORT-CMS';
    const description = settings?.siteDescription || 'Content Management System für Escort-Agenturen';
    const icon = settings?.faviconPath || '/favicon.ico';
    return {
      title,
      description,
      icons: {
        icon,
      },
    };
  } catch {
    return {
      title: 'ESCORT-CMS',
      description: 'Content Management System für Escort-Agenturen',
      icons: { icon: '/favicon.ico' },
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
