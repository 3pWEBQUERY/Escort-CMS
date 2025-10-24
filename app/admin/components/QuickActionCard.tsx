'use client';

import React from 'react';
import Link from 'next/link';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
}

export default function QuickActionCard({ title, description, icon, href }: QuickActionCardProps) {
  return (
    <Link href={href} className="block">
      <div className="group bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow transition-all duration-300 hover:-translate-y-0.5">
        <div className="flex items-center mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--admin-sidebar-bg)] text-white text-xl ring-2 ring-white/50">
            {icon}
          </div>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1 tracking-tight">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
        <div className="mt-4 flex items-center text-sm font-medium text-[var(--admin-sidebar-bg)]">
          <span>Ansehen</span>
          <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}