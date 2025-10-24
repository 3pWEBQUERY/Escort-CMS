'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiGrid, FiMapPin, FiUser, FiFileText, FiSliders, FiSettings, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { useState } from 'react';

type NavChild = { name: string; href: string };
type NavItem = { name: string; href?: string; icon: any; children?: NavChild[] };

const primaryNav: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: FiGrid },
  { name: 'Blog', href: '/admin/content', icon: FiFileText },
  { name: 'Theme', href: '/admin/theme', icon: FiSliders },
  { name: 'Medien', href: '/admin/media', icon: FiFileText },
];

const manageNav: NavItem[] = [
  { name: 'Clubs', href: '/admin/clubs', icon: FiMapPin },
  { 
    name: 'Girls', 
    icon: FiUser, 
    children: [
      { name: 'Girl verwalten', href: '/admin/girls' },
      { name: 'Girl erstellen', href: '/admin/girls/create' },
      { name: 'Felder', href: '/admin/girls/fields' },
      { name: 'Anwesenheit', href: '/admin/girls/attendance' }
    ]
  },
];

const systemNav: NavItem[] = [
  { name: 'Einstellungen', href: '/admin/settings', icon: FiSettings },
];

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<{[key: string]: boolean}>({});

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  return (
    <>
      {/* Sidebar backdrop (mobile only) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`z-50 w-64 bg-[var(--admin-sidebar-bg)] text-white transition-transform duration-300 ease-in-out transform border-r border-white/10 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 absolute inset-y-0 left-0 lg:static lg:top-16' : '-translate-x-full absolute inset-y-0 left-0 lg:static lg:top-16'
        }`}
      >
        <div className="px-3 py-2 border-b border-white/10 text-[10px] uppercase tracking-wider text-white/70">
          Navigation
        </div>
        <nav className="mt-2 px-2">
          <div className="space-y-1">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href!}
                  className={`${
                    pathname === item.href
                      ? 'bg-[var(--admin-sidebar-active)] text-white border-l-2 border-white/60'
                      : 'text-gray-200 hover:bg-[var(--admin-sidebar-hover)] hover:text-white'
                  } group flex items-center px-2 py-2 text-sm font-medium tracking-tight rounded-none transition-colors duration-200`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Verwalten Section */}
        <div className="px-3 py-2 border-b border-white/10 text-[10px] uppercase tracking-wider text-white/70 mt-2">
          Verwalten
        </div>
        <nav className="mt-2 px-2">
          <div className="space-y-1">
            {manageNav.map((item) => {
              if (item.children && item.children.length) {
                const isExpanded = expandedMenus[item.name];
                const Icon = item.icon;
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`${
                        'text-gray-200 hover:bg-[var(--admin-sidebar-hover)] hover:text-white'
                      } group flex items-center justify-between w-full px-2 py-2 text-sm font-medium tracking-tight rounded-none transition-colors duration-200`}
                    >
                      <div className="flex items-center">
                        <Icon className="mr-2 h-4 w-4 opacity-90" />
                        {item.name}
                      </div>
                      {isExpanded ? (
                        <FiChevronDown className="h-4 w-4" />
                      ) : (
                        <FiChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="bg-[hsl(345.3,82.7%,40.8%)]/95 mt-1 rounded-none border-t border-white/10">
                        <div className="space-y-1 py-1">
                          {item.children.map((child: NavChild) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`${
                                pathname === child.href
                                  ? 'bg-[var(--admin-sidebar-active)] text-white border-l-2 border-white/60'
                                  : 'text-gray-100 hover:bg-[var(--admin-sidebar-hover)] hover:text-white'
                              } group flex items-center px-4 py-2 text-sm font-medium rounded-none transition-colors duration-200`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              } else {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href!}
                    className={`${
                      pathname === item.href
                        ? 'bg-[var(--admin-sidebar-active)] text-white border-l-2 border-white/60'
                        : 'text-gray-200 hover:bg-[var(--admin-sidebar-hover)] hover:text-white'
                    } group flex items-center px-2 py-2 text-sm font-medium tracking-tight rounded-none transition-colors duration-200`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                );
              }
            })}
          </div>
        </nav>

        {/* System Section */}
        <div className="px-3 py-2 border-b border-white/10 text-[10px] uppercase tracking-wider text-white/70 mt-2">
          System
        </div>
        <nav className="mt-2 px-2">
          <div className="space-y-1">
            {systemNav.map((item: NavItem) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href!}
                  className={`${
                    pathname === item.href
                      ? 'bg-[var(--admin-sidebar-active)] text-white border-l-2 border-white/60'
                      : 'text-gray-200 hover:bg-[var(--admin-sidebar-hover)] hover:text-white'
                  } group flex items-center px-2 py-2 text-sm font-medium tracking-tight rounded-none transition-colors duration-200`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}