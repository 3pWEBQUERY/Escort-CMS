"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectOption = { value: any; label: string };

type Props = {
  value: any;
  onChange: (v: any) => void;
  options: SelectOption[];
  placeholder?: string;
  rootId?: string; // used to scope outside click
  buttonClassName?: string;
  listClassName?: string;
};

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Bitte wählen",
  rootId = "custom-select",
  buttonClassName,
  listClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => String(o.value) === String(value))?.label || placeholder;
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.(`[data-select-root="${rootId}"]`)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [rootId]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({ top: r.bottom, left: r.left, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <div className="relative" data-select-root={rootId}>
      <button
        type="button"
        className={
          buttonClassName ||
          "mt-1 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-left text-gray-900 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm flex items-center justify-between"
        }
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{current}</span>
        <svg className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
        </svg>
      </button>
      {open && typeof window !== "undefined" &&
        createPortal(
          <ul
            className={
              listClassName ||
              "z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
            }
            role="listbox"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, marginTop: 4 }}
          >
            {options.map((opt) => (
              <li
                key={String(opt.value)}
                role="option"
                aria-selected={String(opt.value) === String(value)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                  String(opt.value) === String(value) ? "bg-blue-50 text-gray-900" : "text-gray-800"
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  );
}
