'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/admin/components/ToastProvider';

export default function GirlsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [girls, setGirls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/girls', { cache: 'no-store' });
      if (!res.ok) throw new Error('Konnte Einträge nicht laden');
      const data = await res.json();
      setGirls(data.items || []);
    } catch (e: any) {
      setError(e?.message || 'Unbekannter Fehler');
      showToast({ variant: 'error', title: 'Fehler', message: e?.message || 'Konnte Einträge nicht laden' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getThumb = (g: any): string | null => {
    // Prefer cover image from any gallery-like value
    const galleryVal = (g.values || []).find((v: any) => Array.isArray(v.value) && v.value.length && typeof v.value[0] === 'object' && 'url' in v.value[0]);
    if (!galleryVal) return null;
    const arr = galleryVal.value as any[];
    const cover = arr.find((it) => it && typeof it === 'object' && it.cover && it.url);
    return (cover?.url as string) || (arr[0]?.url ?? null);
  };

  const getValue = (g: any, slugs: string[], fallback: any = null) => {
    for (const s of slugs) {
      const v = (g.values || []).find((x: any) => x.fieldSlug === s);
      if (v) return v.value;
    }
    return fallback;
  };
  const getName = (g: any) => getValue(g, ['name', 'vorname', 'titel'], '');
  const getAge = (g: any) => {
    const v = getValue(g, ['age', 'alter'], null);
    const n = typeof v === 'number' ? v : Number(v);
    return isNaN(n) ? '' : n;
  };
  const getClicks = (g: any) => {
    const v = getValue(g, ['clicks', 'klicks'], 0);
    const n = typeof v === 'number' ? v : Number(v);
    return isNaN(n) ? 0 : n;
  };
  const isActive = (g: any) => Boolean(getValue(g, ['active', 'aktiv'], false));

  const toggleActive = async (g: any) => {
    try {
      const next = !isActive(g);
      const res = await fetch(`/api/girls/${g.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ values: { active: next } }) });
      if (!res.ok) throw new Error('Aktualisieren fehlgeschlagen');
      setGirls((prev) => prev.map((it) => (it.id === g.id ? { ...it, values: updateValuesArray(it.values, 'active', next) } : it)));
    } catch (e: any) {
      showToast({ variant: 'error', title: 'Fehler', message: e?.message || 'Aktualisieren fehlgeschlagen' });
    }
  };

  const updateValuesArray = (arr: any[], slug: string, value: any) => {
    const idx = (arr || []).findIndex((x) => x.fieldSlug === slug);
    if (idx >= 0) {
      const copy = [...arr];
      copy[idx] = { ...copy[idx], value };
      return copy;
    }
    return [...(arr || []), { fieldSlug: slug, value }];
  };

  const deleteGirl = async (g: any) => {
    if (!confirm('Eintrag wirklich löschen?')) return;
    try {
      const res = await fetch(`/api/girls/${g.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
      setGirls((prev) => prev.filter((it) => it.id !== g.id));
      showToast({ variant: 'success', title: 'Gelöscht', message: 'Eintrag wurde gelöscht.' });
    } catch (e: any) {
      showToast({ variant: 'error', title: 'Fehler', message: e?.message || 'Löschen fehlgeschlagen' });
    }
  };

  return (
    <div className="p-4 md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">Girls Verwaltung</h1>
          <p className="text-sm text-gray-600">Verwalten Sie die Girls Ihres ESCORT-CMS</p>
        </div>
        <button onClick={() => router.push('/admin/girls/create')} className="bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)] text-white px-4 py-2 rounded-md border border-white/10 shadow-sm transition-colors duration-200 self-end">
          Neue Girl
        </button>
      </div>
      
      <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-4">Girls Liste</h2>
        {loading && <div className="text-sm text-gray-600">Lade…</div>}
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Bild
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Alter</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Klicks</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Aktionen</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Aktiv</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Erstellt</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {!loading && girls.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-6 text-sm text-gray-600">Keine Einträge vorhanden.</td>
                </tr>
              )}
              {girls.map((girl: any) => (
                <tr key={girl.id} className="odd:bg-white even:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                    {girl.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap align-top">
                    <div className="flex-shrink-0 h-10 w-10 overflow-hidden rounded-md ring-1 ring-gray-200 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {getThumb(girl) ? (
                        <img src={getThumb(girl)!} alt="thumb" className="w-10 h-10 object-cover" />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-[10px] text-gray-400">img</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap align-top">
                    <div className="text-sm font-medium text-gray-900">{String(getName(girl) || '')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                    {getAge(girl)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                    {getClicks(girl)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium align-top">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => router.push(`/admin/girls/${girl.id}`)}
                        className="p-2 rounded-md bg-[var(--admin-sidebar-bg)] text-white hover:bg-[var(--admin-sidebar-hover)] transition-colors duration-200 shadow-sm"
                        title="Bearbeiten"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => deleteGirl(girl)}
                        className="p-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 shadow-sm"
                        title="Löschen"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium align-top">
                    <button 
                      onClick={() => toggleActive(girl)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-1 ring-inset ${
                        isActive(girl) ? 'bg-green-600 ring-green-500/40' : 'bg-red-600 ring-red-500/40'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isActive(girl) ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">{new Date(girl.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}