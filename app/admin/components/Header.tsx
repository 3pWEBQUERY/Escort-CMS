'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function Header({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Schließe das Dropdown-Menü, wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[var(--admin-header-bg)]/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur text-white shadow-sm w-full h-16 border-b border-white/10">
      <div className="relative flex items-center justify-between h-full px-4">
        {/* subtle top gradient line */}
        <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="flex items-center">
          <button
            type="button"
            className="text-gray-300 hover:text-white focus:outline-none lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Menü öffnen</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="ml-4 flex items-center gap-2">
            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-[var(--admin-sidebar-bg)]/90 text-white ring-1 ring-white/10">
              Admin
            </span>
            <h1 className="text-lg font-semibold tracking-tight">ESCORT-CMS</h1>
          </div>
        </div>
        <div className="flex items-center">
          <div className="relative ml-3">
            <div className="flex items-center space-x-3">
              <button className="bg-white/10 hover:bg-white/15 p-1 rounded-full text-gray-300 hover:text-white focus:outline-none border border-white/10 transition">
                <span className="sr-only">Benachrichtigungen anzeigen</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="hidden md:block h-6 w-px bg-white/10" />
              <div className="relative" ref={dropdownRef}>
                <button 
                  className="flex items-center focus:outline-none"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center ring-1 ring-white/20">
                    <span className="text-white font-medium">A</span>
                  </div>
                  <span className="ml-2 text-sm font-medium hidden md:inline-block text-gray-200">Administrator</span>
                  <svg className="ml-1 h-4 w-4 hidden md:inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white/95 backdrop-blur ring-1 ring-black/10 z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">Mein Profil</a>
                      <Link href="/admin/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">Einstellungen</Link>
                      <button
                        onClick={() => signOut({ callbackUrl: '/signin' })}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        role="menuitem"
                        type="button"
                      >
                        Ausloggen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}