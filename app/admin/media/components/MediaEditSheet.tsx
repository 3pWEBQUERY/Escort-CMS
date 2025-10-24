'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/app/admin/components/ToastProvider';

export type MediaItem = {
  name: string;
  url: string;
  title: string | null;
  alt: string | null;
  description: string | null;
};

export default function MediaEditSheet({
  open,
  onClose,
  item,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  item: MediaItem | null;
  onSaved: (updated: MediaItem) => void;
}) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [alt, setAlt] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title ?? '');
      setAlt(item.alt ?? '');
      setDescription(item.description ?? '');
    }
  }, [item]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;

  const handleSave = async () => {
    if (!item) return;
    try {
      setSaving(true);
      const res = await fetch('/api/media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.name, title, alt, description }),
      });
      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      const updated = await res.json();
      onSaved({
        name: updated.name,
        url: updated.url,
        title: updated.title ?? null,
        alt: updated.alt ?? null,
        description: updated.description ?? null,
      });
      showToast({ variant: 'success', title: 'Gespeichert', message: 'Metadaten aktualisiert.' });
      onClose();
    } catch (e: any) {
      showToast({ variant: 'error', title: 'Fehler', message: e?.message || 'Speichern fehlgeschlagen' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white/95 backdrop-blur border-l border-gray-200 shadow-xl flex flex-col">
        <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight text-gray-900">Mediendatei bearbeiten</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Schließen">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto">
          {item && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.name} className="h-12 w-12 rounded-md border object-cover" />
              <div className="text-sm text-gray-700 truncate">{item.name}</div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Alt-Text</label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Beschreibung</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
            />
          </div>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2 bg-white/80 backdrop-blur">
          <button onClick={onClose} className="px-3 py-2 rounded-md border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50">Abbrechen</button>
          <button onClick={handleSave} disabled={saving} className="px-3 py-2 rounded-md text-white text-sm bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]">{saving ? 'Speichern…' : 'Speichern'}</button>
        </div>
      </div>
    </div>
  );
}
