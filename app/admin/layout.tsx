'use client';

import React, { useState } from 'react';
import Sidebar from '@/app/admin/components/Sidebar';
import Header from '@/app/admin/components/Header';
import ToastProvider from '@/app/admin/components/ToastProvider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen bg-gray-100">
        {/* Header */}
        <div className="w-full">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </div>
        
        <div className="flex flex-1 overflow-hidden relative">
          {/* Technical background grid */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(transparent_1px,rgba(0,0,0,0.03)_1px)] [background-size:16px_16px]" />
          {/* Sidebar */}
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-100">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}