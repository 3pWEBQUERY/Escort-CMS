'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/app/admin/components/ToastProvider';
import MediaEditSheet, { type MediaItem } from './components/MediaEditSheet';
import MediaUploadSheet from './components/MediaUploadSheet';
import { useRouter, useSearchParams } from 'next/navigation';

export default function MediaPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState<MediaItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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
    // initialize page from query string if present
    const p = parseInt(searchParams.get('page') || '1', 10);
    const initPage = isNaN(p) || p < 1 ? 1 : p;
    setPage(initPage);
    load(initPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(page);
    // sync URL query
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('page', String(page));
    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onDelete = async (item: MediaItem) => {
    try {
      const url = new URL('/api/media', window.location.origin);
      url.searchParams.set('name', item.name);
      const res = await fetch(url.toString(), { method: 'DELETE' });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
      await load(page);
      showToast({ variant: 'success', title: 'Gelöscht', message: `${item.name} wurde gelöscht.` });
    } catch (e: any) {
      showToast({ variant: 'error', title: 'Fehler', message: e.message || 'Löschen fehlgeschlagen' });
    }
  };

  const openEdit = (item: MediaItem) => {
    setCurrent(item);
    setEditOpen(true);
  };

  const onSaved = (updated: MediaItem) => {
    setItems((prev) => prev.map((x) => (x.name === updated.name ? updated : x)));
  };

  const currentPage = Math.min(page, totalPages);
  const endIdx = Math.min(total, currentPage * pageSize);

  return (
    <div className="p-4 md:p-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">Medien</h1>
          <p className="text-sm text-gray-600">Verwalten Sie Ihre Mediendateien</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUploadOpen(true)}
            className="bg-white text-gray-800 px-4 py-2 rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200"
          >
            Hochladen
          </button>
          <button
            onClick={() => load(page)}
            className="bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)] text-white px-4 py-2 rounded-md border border-white/10 shadow-sm transition-colors duration-200"
          >
            Aktualisieren
          </button>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-6">
        {loading && <div className="text-sm text-gray-600">Lade Medien…</div>}
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        {!loading && items.length === 0 && (
          <div className="text-sm text-gray-600">Keine Medien vorhanden.</div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item.name} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all bg-white">
              <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.alt || item.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-3">
                <div className="text-sm font-medium text-gray-900 truncate" title={item.title || item.name}>
                  {item.title || item.name}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => openEdit(item)}
                    className="px-2 py-1 rounded-md text-white text-xs bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="px-2 py-1 rounded-md text-white text-xs bg-red-600 hover:bg-red-700"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-col items-center">
            <div className="text-xs text-gray-600 mb-2">
              Zeige {Math.min(total, endIdx)} von {total} Dateien (Seite {currentPage} / {totalPages})
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-md border border-white/10 text-white text-sm disabled:opacity-50 bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]"
              >
                Zurück
              </button>
              <div className="text-sm text-gray-700 w-24 text-center">{currentPage} / {totalPages}</div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-md border border-white/10 text-white text-sm disabled:opacity-50 bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]"
              >
                Weiter
              </button>
            </div>
          </div>
        )}
      </div>

      <MediaEditSheet open={editOpen} onClose={() => setEditOpen(false)} item={current} onSaved={onSaved} />
      <MediaUploadSheet
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={(files) => {
          // Reload current page to refresh totals and list
          load(page);
        }}
      />
    </div>
  );
}
