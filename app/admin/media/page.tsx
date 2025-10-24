'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/app/admin/components/ToastProvider';
import MediaEditSheet, { type MediaItem } from './components/MediaEditSheet';
import MediaUploadSheet from './components/MediaUploadSheet';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomSelect from '@/app/admin/components/CustomSelect';

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
  const [sort, setSort] = useState<'name_asc' | 'name_desc' | 'date_desc' | 'date_asc'>('name_asc');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');

  const load = async (p = page, s = sort) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('pageSize', String(pageSize));
      params.set('sort', String(s));
      if (search) params.set('q', search);
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
      const res = await fetch(`/api/media?${params.toString()}`, { cache: 'no-store' });
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
    // initialize from URL or localStorage
    const p = parseInt(searchParams.get('page') || '1', 10);
    const urlPage = isNaN(p) || p < 1 ? 1 : p;
    const urlSort = (searchParams.get('sort') || '') as any;
    const qUrl = searchParams.get('q');
    const tUrl = searchParams.get('type') as 'all' | 'image' | 'video' | null;

    let initPage = urlPage;
    let initSort: 'name_asc' | 'name_desc' | 'date_desc' | 'date_asc' = 'name_asc';
    let initQ = '';
    let initType: 'all' | 'image' | 'video' = 'all';

    const validSorts = new Set(['name_asc','name_desc','date_desc','date_asc']);
    const validTypes = new Set(['all','image','video']);

    if (urlSort && validSorts.has(urlSort)) initSort = urlSort;
    if (typeof qUrl === 'string') initQ = qUrl;
    if (tUrl && validTypes.has(tUrl)) initType = tUrl;

    // If URL lacks values, hydrate from localStorage
    if ((!urlSort && !qUrl && !tUrl) && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('media_filters');
        if (raw) {
          const parsed = JSON.parse(raw) as { sort?: string; q?: string; type?: 'all'|'image'|'video' };
          if (parsed.sort && validSorts.has(parsed.sort)) initSort = parsed.sort as any;
          if (typeof parsed.q === 'string') initQ = parsed.q;
          if (parsed.type && validTypes.has(parsed.type)) initType = parsed.type;
        }
      } catch {}
    }

    setPage(initPage);
    setSort(initSort);
    setSearch(initQ);
    setSearchInput(initQ);
    setTypeFilter(initType);
    load(initPage, initSort as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce search input -> search
  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    load(page, sort);
    // sync URL query
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('page', String(page));
    params.set('sort', String(sort));
    if (search) params.set('q', search); else params.delete('q');
    if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter); else params.delete('type');
    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, search, typeFilter]);

  // persist filters to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('media_filters', JSON.stringify({ sort, q: search, type: typeFilter }));
      }
    } catch {}
  }, [sort, search, typeFilter]);

  // server-side filtering handles search and type

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setUploadOpen(true)}
            className="bg-white text-gray-800 px-4 py-2 rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200"
          >
            Hochladen
          </button>
          <button
            onClick={() => load(page, sort)}
            className="bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)] text-white px-4 py-2 rounded-md border border-white/10 shadow-sm transition-colors duration-200"
          >
            Aktualisieren
          </button>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Suche nach Titel oder Dateiname…"
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 text-sm focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
              />
            </div>
            <div className="w-40">
              <CustomSelect
                rootId="media-type"
                value={typeFilter}
                onChange={(v) => { setPage(1); setTypeFilter(v); }}
                options={[
                  { value: 'all', label: 'Alle Typen' },
                  { value: 'image', label: 'Bilder' },
                  { value: 'video', label: 'Video' },
                ]}
                buttonClassName="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-left text-gray-900 text-sm flex items-center justify-between"
                listClassName="z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto text-sm"
              />
            </div>
          </div>
          <div className="w-48">
            <CustomSelect
              rootId="media-sort"
              value={sort}
              onChange={(v) => { setPage(1); setSort(v); }}
              options={[
                { value: 'name_asc', label: 'Name (A→Z)' },
                { value: 'name_desc', label: 'Name (Z→A)' },
                { value: 'date_desc', label: 'Datum (Neu → Alt)' },
                { value: 'date_asc', label: 'Datum (Alt → Neu)' },
              ]}
              buttonClassName="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-left text-gray-900 text-sm flex items-center justify-between"
              listClassName="z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto text-sm"
            />
          </div>
        </div>
        {(search || typeFilter !== 'all') && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            {search && (
              <button
                onClick={() => { setPage(1); setSearch(''); setSearchInput(''); }}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 border border-gray-200"
                aria-label="Suchfilter entfernen"
              >
                <span>Suche: “{search}”</span>
                <span className="text-gray-500">✕</span>
              </button>
            )}
            {typeFilter !== 'all' && (
              <button
                onClick={() => { setPage(1); setTypeFilter('all'); }}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 border border-gray-200"
                aria-label="Typfilter entfernen"
              >
                <span>Typ: {typeFilter === 'image' ? 'Bilder' : 'Video'}</span>
                <span className="text-gray-500">✕</span>
              </button>
            )}
            <button
              onClick={() => { setPage(1); setSearch(''); setSearchInput(''); setTypeFilter('all'); }}
              className="ml-auto inline-flex items-center gap-1 rounded-md bg-white hover:bg-gray-50 text-gray-800 px-2 py-1 border border-gray-200"
            >
              Alle Filter löschen
            </button>
          </div>
        )}
        {loading && <div className="text-sm text-gray-600">Lade Medien…</div>}
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        {!loading && items.length === 0 && (
          <div className="text-sm text-gray-600">
            {(search || typeFilter !== 'all') ? 'Keine Treffer für die aktuellen Filter.' : 'Keine Medien vorhanden.'}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item.name} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all bg-white">
              <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                {/\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(item.name) ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video
                    src={item.url}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    playsInline
                    autoPlay
                    aria-label={item.title || item.name}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.alt || item.name} className="h-full w-full object-cover" />
                )}
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
