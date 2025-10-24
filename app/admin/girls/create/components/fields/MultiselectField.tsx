"use client";

import React from "react";

export default function MultiselectField({ label, required, helpText, value, onChange, options }: { label: string; required?: boolean; helpText?: string | null; value: string[]; onChange: (v:string[])=>void; options: string[] | { label: string; value: string }[]; }) {
  const flat = (options as any[]).map((o) => typeof o === 'string' ? { label: o, value: o } : o);
  const toggle = (val: string) => {
    const set = new Set(value);
    if (set.has(val)) set.delete(val); else set.add(val);
    onChange(Array.from(set));
  };
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required ? " *" : ""}</label>
      <div className="flex flex-wrap gap-2">
        {flat.map((o) => (
          <button key={o.value} type="button" onClick={()=>toggle(o.value)} className={`px-2 py-1 rounded-md border text-xs ${value.includes(o.value) ? 'bg-[var(--admin-sidebar-bg)] text-white border-white/10' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'}`}>
            {o.label}
          </button>
        ))}
      </div>
      {helpText && <div className="mt-1 text-xs text-gray-500">{helpText}</div>}
    </div>
  );
}
