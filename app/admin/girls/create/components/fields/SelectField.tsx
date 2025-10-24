"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";

export default function SelectField({ label, required, helpText, value, onChange, options }: { label: string; required?: boolean; helpText?: string | null; value: string; onChange: (v:string)=>void; options: string[] | { label: string; value: string }[]; }) {
  const flat = useMemo(() => (options as any[]).map((o) => typeof o === 'string' ? { label: o, value: o } : o), [options]);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => flat.find(o => o.value === value) || null, [flat, value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (panelRef.current && panelRef.current.contains(t)) return;
      if (btnRef.current && btnRef.current.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const pick = (val: string) => { onChange(val); setOpen(false); };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required ? " *" : ""}</label>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? "" : "text-gray-400"}>{selected ? selected.label : "Bitte wählen…"}</span>
        <svg className={`h-4 w-4 ml-2 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"/></svg>
      </button>
      {open && (
        <div ref={panelRef} className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="max-h-56 overflow-auto py-1">
            <button type="button" onClick={() => pick("")} className={`w-full text-left px-3 py-2 text-sm ${value === '' ? 'bg-[var(--admin-sidebar-bg)]/10 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}>Bitte wählen…</button>
            {flat.map((o) => (
              <button key={o.value} type="button" onClick={() => pick(o.value)} className={`w-full text-left px-3 py-2 text-sm ${value === o.value ? 'bg-[var(--admin-sidebar-bg)]/10 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {helpText && <div className="mt-1 text-xs text-gray-500">{helpText}</div>}
    </div>
  );
}
