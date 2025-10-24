'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/app/admin/components/ToastProvider';
import ClubSheet, { type ClubForm } from './components/ClubSheet';
import CustomSelect from '@/app/admin/components/CustomSelect';

export default function ClubsPage() {
  const { showToast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [girls, setGirls] = useState<any[]>([]);
  const [girlsLoading, setGirlsLoading] = useState(false);
  const [girlsError, setGirlsError] = useState('');
  const [draggingGirlId, setDraggingGirlId] = useState<string | null>(null);
  const [dragOverClubId, setDragOverClubId] = useState<string | 'none' | null>(null);
  const [filterClubId, setFilterClubId] = useState<string>('all');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [batchTarget, setBatchTarget] = useState<string>('none');
  const [clubGirlsSheetFor, setClubGirlsSheetFor] = useState<any | null>(null);
  const [editClubId, setEditClubId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/clubs', { cache: 'no-store' });
      if (!res.ok) throw new Error('Konnte Clubs nicht laden');
      const data = await res.json();
      setItems(data.items || []);
    } catch (e: any) {
      setError(e.message || 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  const assignMany = async (girlIds: string[], clubId: string | null) => {
    if (!girlIds.length) return;
    const prev = girls;
    setGirls((gs) => gs.map((g) => (girlIds.includes(g.id) ? { ...g, clubId } : g)));
    try {
      await Promise.all(
        girlIds.map((gid) =>
          fetch(`/api/girls/${gid}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clubId }),
          })
        )
      );
      showToast({ variant: 'success', title: 'Gespeichert', message: 'Mehrere Zuweisungen aktualisiert.' });
      setSelected({});
    } catch (e: any) {
      setGirls(prev);
      showToast({ variant: 'error', title: 'Fehler', message: e?.message || 'Konnte nicht speichern' });
    }
  };

  const clubNameById: Record<string, string> = Object.fromEntries(items.map((c) => [c.id, c.name]));
  const filteredGirls = girls.filter((g) => {
    if (filterClubId === 'all') return true;
    if (filterClubId === 'none') return !g.clubId;
    return g.clubId === filterClubId;
  });

  useEffect(() => {
    load();
    const loadGirls = async () => {
      try {
        setGirlsLoading(true);
        setGirlsError('');
        const res = await fetch('/api/girls', { cache: 'no-store' });
        if (!res.ok) throw new Error('Konnte Girls nicht laden');
        const data = await res.json();
        setGirls(data.items || []);
      } catch (e: any) {
        setGirlsError(e?.message || 'Unbekannter Fehler');
      } finally {
        setGirlsLoading(false);
      }
    };
    loadGirls();
  }, []);

  const handleCreated = (data: ClubForm) => {
    setIsSheetOpen(false);
    showToast({ variant: 'success', title: 'Erstellt', message: 'Club wurde erstellt.' });
    load();
  };

  const assignGirlToClub = async (girlId: string, clubId: string | null) => {
    if (!girlId) return;
    // optimistic update
    const prev = girls;
    setGirls((gs) => gs.map((g) => (g.id === girlId ? { ...g, clubId } : g)));
    try {
      const res = await fetch(`/api/girls/${girlId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId }),
      });
      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      showToast({ variant: 'success', title: 'Gespeichert', message: 'Zuweisung aktualisiert.' });
    } catch (e: any) {
      setGirls(prev);
      showToast({ variant: 'error', title: 'Fehler', message: e?.message || 'Konnte nicht speichern' });
    }
  };

  return (
    <div className="p-4 md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">Clubs Verwaltung</h1>
          <p className="text-sm text-gray-600">Verwalten Sie die Clubs Ihres ESCORT-CMS</p>
        </div>
        <button 
          className="bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)] text-white px-4 py-2 rounded-md border border-white/10 shadow-sm transition-colors duration-200 self-end"
          onClick={() => setIsSheetOpen(true)}
        >
          Neuer Club
        </button>
      </div>
      
      <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-4">Ihre Clubs</h2>
        {loading && <p className="text-sm text-gray-600">Lade Clubs…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {/* Ohne Club Dropzone */}
        <div
          className={`border ${dragOverClubId === 'none' ? 'ring-2 ring-[var(--admin-sidebar-bg)]' : 'border-gray-200'} rounded-xl overflow-hidden shadow-sm transition-all duration-300 p-4 mb-6 bg-gray-50`}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDragEnter={() => setDragOverClubId('none')}
          onDragLeave={() => setDragOverClubId((prev) => (prev === 'none' ? null : prev))}
          onDrop={(e) => {
            e.preventDefault();
            const gid = e.dataTransfer.getData('text/plain') || draggingGirlId;
            setDragOverClubId(null);
            setDraggingGirlId(null);
            if (gid) assignGirlToClub(gid, null);
          }}
        >
          <div className="text-sm font-medium text-gray-800">Ohne Club</div>
          <div className="text-xs text-gray-500">Ziehen Sie ein Girl hierhin, um die Zuweisung zu entfernen.</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((club) => (
            <div
              key={club.id}
              className={`border ${dragOverClubId === club.id ? 'ring-2 ring-[var(--admin-sidebar-bg)]' : 'border-gray-200'} rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDragEnter={() => setDragOverClubId(club.id)}
              onDragLeave={() => setDragOverClubId((prev) => (prev === club.id ? null : prev))}
              onDrop={(e) => {
                e.preventDefault();
                const gid = e.dataTransfer.getData('text/plain') || draggingGirlId;
                setDragOverClubId(null);
                setDraggingGirlId(null);
                if (gid) assignGirlToClub(gid, club.id);
              }}
            >
              <div className="bg-gray-100 h-40 flex items-center justify-center">
                {club.logoPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={club.logoPath} alt={club.name} className="h-full object-contain" />
                ) : (
                  <span className="text-gray-400 text-sm">Kein Logo</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-semibold text-gray-900 tracking-tight">{club.name}</h3>
                </div>
                <p className="text-gray-700 text-sm mb-2">{club.street} {club.houseNumber}</p>
                <p className="text-gray-700 text-sm mb-4">{club.zipAndCity}</p>
                <div className="flex space-x-2">
                  <button 
                    className="p-2 rounded-md bg-[var(--admin-sidebar-bg)] text-white hover:bg-[var(--admin-sidebar-hover)] transition-colors duration-200 shadow-sm"
                    title="Bearbeiten"
                    onClick={() => setEditClubId(club.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button 
                    className="p-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 shadow-sm"
                    title="Löschen"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    className="p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 shadow-sm"
                    title="Zugeordnete Girls"
                    onClick={() => setClubGirlsSheetFor(club)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path fillRule="evenodd" d="M4 14a4 4 0 014-4h4a4 4 0 014 4v2H4v-2z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(!loading && !error && items.length === 0) && (
            <div className="col-span-3 text-sm text-gray-500">Noch keine Clubs vorhanden.</div>
          )}
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-4">Girls</h2>
        {girlsLoading && <p className="text-sm text-gray-600">Lade Girls…</p>}
        {girlsError && <p className="text-sm text-red-600">{girlsError}</p>}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Filter:</label>
            <div className="min-w-[180px]">
              <CustomSelect
                value={filterClubId}
                onChange={(v) => setFilterClubId(String(v))}
                options={[
                  { value: 'all', label: 'Alle' },
                  { value: 'none', label: 'Ohne Club' },
                  ...items.map((c: any) => ({ value: c.id, label: c.name })),
                ]}
                rootId="filter-club"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="min-w-[180px]">
              <CustomSelect
                value={batchTarget}
                onChange={(v) => setBatchTarget(String(v))}
                options={[
                  { value: 'none', label: 'Ohne Club' },
                  ...items.map((c: any) => ({ value: c.id, label: c.name })),
                ]}
                rootId="batch-target"
              />
            </div>
            <button
              className="bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)] text-white px-3 py-1.5 rounded-md text-sm disabled:opacity-50"
              disabled={!Object.values(selected).some(Boolean)}
              onClick={() => {
                const val = batchTarget || 'none';
                const clubId = val === 'none' ? null : val;
                const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
                assignMany(ids, clubId);
              }}
            >
              Zuweisen
            </button>
            <button
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-md text-sm"
              onClick={() => setSelected({})}
            >
              Auswahl leeren
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredGirls.map((g) => (
            <div
              key={g.id}
              className={`border ${draggingGirlId === g.id ? 'opacity-70' : 'border-gray-200'} rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
              draggable
              onDragStart={(e) => {
                setDraggingGirlId(g.id);
                e.dataTransfer.setData('text/plain', g.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => {
                setDraggingGirlId(null);
                setDragOverClubId(null);
              }}
              title={g.clubId ? `Zugewiesen: ${clubNameById[g.clubId] || g.clubId}` : 'Ohne Club'}
            >
              <div className="bg-gray-100 h-48 flex items-center justify-center overflow-hidden">
                {(() => {
                  const galleryVal = (g.values || []).find((v: any) => Array.isArray(v.value) && v.value.length && typeof v.value[0] === 'object' && 'url' in v.value[0]);
                  let url: string | null = null;
                  if (galleryVal) {
                    const arr = galleryVal.value as any[];
                    const cover = arr.find((it) => it && typeof it === 'object' && it.cover && it.url);
                    url = (cover?.url as string) || (arr[0]?.url ?? null);
                  }
                  return url ? (
                    <img src={url} alt="thumb" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm">Kein Bild</span>
                  );
                })()}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-semibold text-gray-900 tracking-tight truncate">
                    {(() => {
                      const getValue = (slugs: string[], fallback: any = '') => {
                        for (const s of slugs) {
                          const v = (g.values || []).find((x: any) => x.fieldSlug === s);
                          if (v) return v.value;
                        }
                        return fallback;
                      };
                      return String(getValue(['name','vorname','titel'], g.id));
                    })()}
                  </h3>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${g.clubId ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {g.clubId ? (clubNameById[g.clubId] || 'Zugewiesen') : 'Ohne Club'}
                  </span>
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(selected[g.id])}
                      onChange={(e) => setSelected((s) => ({ ...s, [g.id]: e.target.checked }))}
                    />
                    Auswählen
                  </label>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={`/admin/girls/${g.id}`}
                    className="p-2 rounded-md bg-[var(--admin-sidebar-bg)] text-white hover:bg-[var(--admin-sidebar-hover)] transition-colors duration-200 shadow-sm"
                    title="Bearbeiten"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
          {(!girlsLoading && !girlsError && girls.length === 0) && (
            <div className="col-span-4 text-sm text-gray-500">Noch keine Girls vorhanden.</div>
          )}
        </div>
      </div>

      <ClubSheet open={isSheetOpen} onClose={() => setIsSheetOpen(false)} onCreated={handleCreated} />
      <ClubSheet
        open={Boolean(editClubId)}
        onClose={() => setEditClubId(null)}
        onCreated={() => {}}
        mode="edit"
        clubId={editClubId || undefined}
        onUpdated={() => {
          setEditClubId(null);
          load();
        }}
      />
      {clubGirlsSheetFor && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setClubGirlsSheetFor(null)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-xl border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Zugeordnete Girls</h3>
                <p className="text-sm text-gray-600">{clubGirlsSheetFor?.name}</p>
              </div>
              <div className="flex items-center gap-3">
                {clubGirlsSheetFor?.logoPath ? (
                  <img src={clubGirlsSheetFor.logoPath} alt={clubGirlsSheetFor?.name} className="h-10 w-10 object-contain rounded bg-gray-50 border border-gray-200" />
                ) : (
                  <div className="h-10 w-10 flex items-center justify-center text-xs text-gray-400 bg-gray-100 rounded border border-gray-200">Kein Logo</div>
                )}
                <button className="p-2 rounded-md hover:bg-gray-100" onClick={() => setClubGirlsSheetFor(null)} aria-label="Schließen">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto">
              {girls.filter((g) => g.clubId === clubGirlsSheetFor.id).length === 0 ? (
                <div className="text-sm text-gray-600">Keine Girls zugeordnet.</div>
              ) : (
                <ul className="space-y-3">
                  {girls.filter((g) => g.clubId === clubGirlsSheetFor.id).map((g) => (
                    <li key={g.id} className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                        {(() => {
                          const galleryVal = (g.values || []).find((v: any) => Array.isArray(v.value) && v.value.length && typeof v.value[0] === 'object' && 'url' in v.value[0]);
                          let url: string | null = null;
                          if (galleryVal) {
                            const arr = galleryVal.value as any[];
                            const cover = arr.find((it) => it && typeof it === 'object' && it.cover && it.url);
                            url = (cover?.url as string) || (arr[0]?.url ?? null);
                          }
                          return url ? (
                            <img src={url} alt="thumb" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-gray-400 text-xs">Kein Bild</span>
                          );
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {(() => {
                            const getValue = (slugs: string[], fallback: any = '') => {
                              for (const s of slugs) {
                                const v = (g.values || []).find((x: any) => x.fieldSlug === s);
                                if (v) return v.value;
                              }
                              return fallback;
                            };
                            return String(getValue(['name','vorname','titel'], g.id));
                          })()}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{g.id}</div>
                      </div>
                      <a href={`/admin/girls/${g.id}`} className="text-[var(--admin-sidebar-bg)] text-sm hover:underline">Öffnen</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}