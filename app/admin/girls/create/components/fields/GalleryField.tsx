"use client";

import React from "react";

type Item = { name: string; url: string; title?: string | null; alt?: string | null; cover?: boolean };

export default function GalleryField({ label, required, helpText, value, onChange, onOpenPicker }: { label: string; required?: boolean; helpText?: string | null; value: Item[]; onChange: (v:Item[])=>void; onOpenPicker: () => void; }) {
  const remove = (name: string) => onChange(value.filter(v => v.name !== name));
  const setCover = (name: string) => {
    const next = value.map(v => ({ ...v, cover: v.name === name }));
    onChange(next);
  };
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required ? " *" : ""}</label>
      <div className="flex items-center gap-2 mb-2">
        <button type="button" onClick={onOpenPicker} className="px-3 py-1.5 rounded-md text-white bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]">Bilder auswählen</button>
      </div>
      {value.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((it) => (
            <div key={it.name} className="border border-gray-200 rounded-md overflow-hidden bg-white relative">
              <div className="aspect-square bg-gray-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt={it.alt || it.name} className="h-full w-full object-cover" />
              </div>
              <div className="absolute top-2 left-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCover(it.name)}
                  className={`text-xs px-2 py-1 rounded ${it.cover ? 'bg-green-600 text-white' : 'bg-white/90 text-gray-800 border border-gray-300 hover:bg-white'}`}
                  title="Als Anzeigebild setzen"
                >
                  {it.cover ? 'Anzeigebild' : 'Als Anzeigebild'}
                </button>
              </div>
              <button type="button" onClick={()=>remove(it.name)} className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700">Entfernen</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-500">Keine Bilder ausgewählt.</div>
      )}
      {helpText && <div className="mt-2 text-xs text-gray-500">{helpText}</div>}
    </div>
  );
}
