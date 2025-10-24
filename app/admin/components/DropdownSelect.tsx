'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type Option = { label: string; value: string };

export default function DropdownSelect({
  value,
  onChange,
  options,
  placeholder = 'Bitte auswählen',
}: {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => setMounted(true), []);

  // Compute and update menu position
  const updatePosition = () => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        anchorRef.current &&
        !anchorRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        ref={anchorRef}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
      >
        <span className={selected ? '' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className="ml-2 h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
        </svg>
      </button>
      {mounted && open && createPortal(
        <div
          ref={menuRef}
          className="z-[100] rounded-md bg-white/95 backdrop-blur border border-gray-200 shadow-lg"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
        >
          <ul className="max-h-60 overflow-auto py-1 text-sm text-gray-900">
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${value === opt.value ? 'bg-gray-50' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}
