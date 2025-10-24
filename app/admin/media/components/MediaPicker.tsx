'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/app/admin/components/ToastProvider';
import MediaUploadSheet from './MediaUploadSheet';

export type MediaPickItem = {
  name: string;
  url: string;
  title: string | null;
  alt: string | null;
  description: string | null;
};

export default function MediaPicker({
  open,
  onClose,
  multiple = false,
  maxItems,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  multiple?: boolean;
  maxItems?: number | null;
  onSelect: (items: MediaPickItem[] | MediaPickItem) => void;
}) {
  const { showToast } = useToast();
  const [items, setItems] = useState<MediaPickItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, MediaPickItem>>({});
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const selectedList = useMemo(() => Object.values(selected), [selected]);
  const selectionLimit = useMemo(() => (multiple ? (maxItems || Infinity) : 1), [multiple, maxItems]);

  const load = async (p = page) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/media?page=${p}&pageSize=${pageSize}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Konnte Medien nicht laden');
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e: any) {
      setError(e.message || 'Unbekannter Fehler');
      showToast({ variant: 'error', title: 'Fehler', message: e.message || 'Konnte Medien nicht laden' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSelected({});
      setPage(1);
      load(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // reload when page changes while open
  useEffect(() => {
    if (!open) return;
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  if (!open) return null;

  const toggleSelect = (item: MediaPickItem) => {
    setSelected((prev) => {
      const next = { ...prev };
      const exists = !!next[item.name];
      if (exists) {
        delete next[item.name];
        return next;
      }
      if (!multiple) {
        return { [item.name]: item };
      }
      const current = Object.keys(next).length;
      if (current >= selectionLimit) {
        showToast({ variant: 'error', title: 'Limit erreicht', message: `Maximal ${selectionLimit} Bild(er) wählbar.` });
        return next;
      }
      next[item.name] = item;
      return next;
    });
  };

  const confirm = () => {
    const picked = Object.values(selected);
    if (picked.length === 0) {
      showToast({ variant: 'error', title: 'Keine Auswahl', message: 'Bitte wähle mindestens ein Bild.' });
      return;
    }
    if (multiple) onSelect(picked);
    else onSelect(picked[0]);
    onClose();
  };

  const currentPage = Math.min(page, totalPages);
  const endIdx = Math.min(total, currentPage * pageSize);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-3xl bg-white/95 backdrop-blur border-l border-gray-200 shadow-xl flex flex-col">
        <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-gray-900">Bilder auswählen</h3>
            {multiple && (
              <p className="text-xs text-gray-600">Ausgewählt: {selectedList.length}{selectionLimit !== Infinity ? ` / ${selectionLimit}` : ''}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUploadOpen(true)}
              className="bg-white text-gray-800 px-3 py-1.5 rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200"
            >
              Hochladen
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Schließen">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          {loading && <div className="text-sm text-gray-600">Lade Medien…</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && items.length === 0 && <div className="text-sm text-gray-600">Keine Medien vorhanden.</div>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => {
              const isSel = !!selected[item.name];
              return (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => toggleSelect(item)}
                  className={`relative border rounded-lg overflow-hidden shadow-sm bg-white text-left focus:outline-none ${isSel ? 'ring-2 ring-[var(--admin-sidebar-bg)]' : 'border-gray-200'}`}
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.alt || item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-900 truncate" title={item.title || item.name}>
                      {item.title || item.name}
                    </div>
                  </div>
                  {isSel && (
                    <div className="absolute top-2 right-2 bg-[var(--admin-sidebar-bg)] text-white text-[10px] px-1.5 py-0.5 rounded">Gewählt</div>
                  )}
                </button>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="mt-3 flex flex-col items-center">
              <div className="text-xs text-gray-600 mb-2">
                Seite {Math.min(page, totalPages)} / {totalPages}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-md border border-white/10 text-white text-xs disabled:opacity-50 bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]"
                >
                  Zurück
                </button>
                <div className="text-xs text-gray-700 w-20 text-center">{Math.min(page, totalPages)} / {totalPages}</div>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-md border border-white/10 text-white text-xs disabled:opacity-50 bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]"
                >
                  Weiter
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2 bg-white/80 backdrop-blur">
          <button onClick={onClose} className="px-3 py-2 rounded-md border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50">Abbrechen</button>
          <button onClick={confirm} className="px-3 py-2 rounded-md text-white text-sm bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]">Übernehmen</button>
        </div>
      </div>

      <MediaUploadSheet
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => load(page)}
      />
    </div>
  );
}
