"use client";

import React from "react";

export default function NumberField({ label, required, helpText, placeholder, value, onChange }: { label: string; required?: boolean; helpText?: string | null; placeholder?: string; value: string | number; onChange: (v:number)=>void; }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required ? " *" : ""}</label>
      <input type="number" value={value as any} onChange={(e)=>onChange(Number(e.target.value))} placeholder={placeholder} className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]" />
      {helpText && <div className="mt-1 text-xs text-gray-500">{helpText}</div>}
    </div>
  );
}
