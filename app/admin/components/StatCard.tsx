'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
}

export default function StatCard({ title, value, change }: StatCardProps) {
  const isPositive = change.startsWith('+');
  
  return (
    <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow transition-shadow">
      <div className="flex items-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900 font-mono tabular-nums">{value}</p>
        </div>
      </div>
      <div className="mt-3">
        <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ring-1 ${
          isPositive ? 'text-green-700 bg-green-50 ring-green-200' : 'text-red-700 bg-red-50 ring-red-200'
        }`}>
          {isPositive ? (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
          {change}
        </span>
        <span className="text-gray-500 text-xs ml-2">zur letzten Woche</span>
      </div>
    </div>
  );
}