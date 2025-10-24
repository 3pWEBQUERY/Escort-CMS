'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/app/admin/components/ToastProvider';

type GirlFieldType = 'SELECT' | 'SELECT_SEARCH' | 'MULTISELECT' | 'INPUT' | 'TEXTAREA' | 'NUMBER' | 'SECTION' | 'GALLERY';

type GirlField = {
  id: string;
  name: string;
  slug: string;
  type: GirlFieldType;
  required: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  options?: any | null;
  order: number;
  parentId?: string | null;
  containerColumns?: number | null;
  colSpan?: number | null;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export default function GirlsFieldsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<GirlField[]>([]);

  // New field form
  const [form, setForm] = useState<Partial<GirlField>>({
    name: '',
    slug: '',
    type: 'INPUT',
    required: false,
    placeholder: '',
    helpText: '',
    options: null,
    parentId: null,
    containerColumns: 1,
  });
  const isSelectType = useMemo(
    () => form.type === 'SELECT' || form.type === 'SELECT_SEARCH' || form.type === 'MULTISELECT',
    [form.type]
  );

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/girls/fields', { cache: 'no-store' });
      if (!res.ok) throw new Error('Konnte Felder nicht laden');
      const data = await res.json();
      setItems(data.items || []);
    } catch (e: any) {
      setError(e.message || 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      if (!form.name?.trim()) throw new Error('Name fehlt');
      const payload: any = { ...form };
      payload.slug = form.slug?.trim() || slugify(form.name!);
      if (isSelectType) {
        // options as one per line or JSON
        if (typeof form.options === 'string') {
          const lines = (form.options as string)
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);
          payload.options = lines;
        }
      } else if (form.type === 'GALLERY') {
        const max = Number((form as any).maxItems || 0);
        payload.options = { maxItems: isNaN(max) || max <= 0 ? null : max };
      } else {
        payload.options = null;
      }
      const res = await fetch('/api/girls/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erstellen fehlgeschlagen');
      showToast({ variant: 'success', title: 'Gespeichert', message: 'Feld erstellt.' });
      setForm({ name: '', slug: '', type: 'INPUT', required: false, placeholder: '', helpText: '', options: '' });
      await load();
    } catch (e: any) {
      showToast({ variant: 'error', title: 'Fehler', message: e?.message || 'Erstellen fehlgeschlagen' });
    }
  };

  // Drag & Drop reorder (HTML5)
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const onDragStart = (index: number) => setDragIndex(index);
  const onDragOver = (e: React.DragEvent, overIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === overIndex) return;
    setItems((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(dragIndex, 1);
      copy.splice(overIndex, 0, removed);
      setDragIndex(overIndex);
      return copy.map((it, idx) => ({ ...it, order: idx }));
    });
  };
  const onDrop = async () => {
    setDragIndex(null);
    await saveOrder();
  };

  const saveOrder = async () => {
    try {
      const payload = { items: items.map((it) => ({ id: it.id, order: it.order, parentId: it.parentId ?? null })) };
      const res = await fetch('/api/girls/fields', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Sortierung speichern fehlgeschlagen');
      showToast({ variant: 'success', title: 'Gespeichert', message: 'Reihenfolge aktualisiert.' });
    } catch (e: any) {
      showToast({ variant: 'error', title: 'Fehler', message: e?.message || 'Sortierung speichern fehlgeschlagen' });
      await load();
    }
  };

  // Grouping: drag into SECTION
  const [dragId, setDragId] = useState<string | null>(null);
  const onDragStartId = (id: string) => {
    setDragId(id);
    const idx = items.findIndex((x) => x.id === id);
    if (idx !== -1) onDragStart(idx);
  };
  const onDragEnterSection = (sectionId: string) => {
    if (!dragId) return;
    setItems((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex((x) => x.id === dragId);
      if (idx === -1) return prev;
      const dragged = { ...copy[idx] } as GirlField;
      // Do not allow dropping a SECTION into another SECTION
      if (dragged.type === 'SECTION') return prev;
      copy.splice(idx, 1);
      // compute end index of section children to insert at end of that group
      const sectionChildren = copy.filter((x) => x.parentId === sectionId);
      dragged.parentId = sectionId;
      // push to end (we'll normalize order on render/save)
      copy.push(dragged);
      // reassign orders by current visual list order
      return copy.map((it, i2) => ({ ...it, order: i2 }));
    });
  };

  const moveChild = async (id: string, dir: 'up' | 'down') => {
    setItems((prev) => {
      const copy = [...prev];
      const i = copy.findIndex((x) => x.id === id);
      if (i === -1) return prev;
      const parentId = copy[i].parentId ?? null;
      const siblings = copy
        .filter((x) => x.parentId === parentId && x.type !== 'SECTION')
        .sort((a, b) => a.order - b.order);
      const si = siblings.findIndex((x) => x.id === id);
      const ti = dir === 'up' ? si - 1 : si + 1;
      if (si < 0 || ti < 0 || ti >= siblings.length) return prev;
      const aId = siblings[si].id;
      const bId = siblings[ti].id;
      const ai = copy.findIndex((x) => x.id === aId);
      const bi = copy.findIndex((x) => x.id === bId);
      const ao = copy[ai].order;
      const bo = copy[bi].order;
      copy[ai] = { ...copy[ai], order: bo };
      copy[bi] = { ...copy[bi], order: ao };
      return copy;
    });
    await saveOrder();
  };

  const onDelete = async (id: string) => {
    if (!confirm('Feld wirklich löschen?')) return;
    try {
      const res = await fetch(`/api/girls/fields/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
      showToast({ variant: 'success', title: 'Gelöscht', message: 'Feld gelöscht.' });
      await load();
    } catch (e: any) {
      showToast({ variant: 'error', title: 'Fehler', message: e?.message || 'Löschen fehlgeschlagen' });
    }
  };

  const onUpdate = async (id: string, patch: Partial<GirlField>) => {
    try {
      const res = await fetch(`/api/girls/fields/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      showToast({ variant: 'success', title: 'Gespeichert', message: 'Feld aktualisiert.' });
      await load();
    } catch (e: any) {
      showToast({ variant: 'error', title: 'Fehler', message: e?.message || 'Speichern fehlgeschlagen' });
    }
  };

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<GirlField>>({});
  const isEditSelectType = useMemo(
    () => editForm.type === 'SELECT' || editForm.type === 'SELECT_SEARCH' || editForm.type === 'MULTISELECT',
    [editForm.type]
  );
  const startEdit = (it: GirlField) => {
    setEditingId(it.id);
    setEditForm({
      id: it.id,
      name: it.name,
      slug: it.slug,
      type: it.type,
      required: it.required,
      placeholder: it.placeholder ?? '',
      helpText: it.helpText ?? '',
      options: Array.isArray(it.options) ? (it.options as any[]).join('\n') : (it.options as any as string) || '',
    });
  };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };
  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const patch: any = { ...editForm };
      if (isEditSelectType) {
        if (typeof patch.options === 'string') {
          const lines = (patch.options as string).split('\n').map((l: string) => l.trim()).filter(Boolean);
          patch.options = lines;
        }
      } else if (editForm.type === 'GALLERY') {
        const max = Number((editForm as any).maxItems || (typeof editForm.options === 'object' && (editForm.options as any)?.maxItems) || 0);
        patch.options = { maxItems: isNaN(max) || max <= 0 ? null : max };
      } else {
        patch.options = null;
      }
      const res = await fetch(`/api/girls/fields/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      showToast({ variant: 'success', title: 'Gespeichert', message: 'Feld aktualisiert.' });
      setEditingId(null);
      setEditForm({});
      await load();
    } catch (e: any) {
      showToast({ variant: 'error', title: 'Fehler', message: e?.message || 'Speichern fehlgeschlagen' });
    }
  };

  return (
    <div className="p-4 md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">Girls Felder</h1>
          <p className="text-sm text-gray-600">Definiere individuelle Felder für Girls.</p>
        </div>
      </div>

      {/* Create Field */}
      <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-4">Neues Feld</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name as string}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              onBlur={() => setForm((f) => ({ ...f, slug: f.slug?.trim() || slugify(f.name || '') }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={form.slug as string}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
            <select
              value={form.type as GirlFieldType}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as GirlFieldType }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm"
            >
              <option value="INPUT">Eingabefeld</option>
              <option value="TEXTAREA">Großes Textfeld</option>
              <option value="NUMBER">Zahlenfeld</option>
              <option value="SELECT">Select</option>
              <option value="SELECT_SEARCH">Select mit Suche</option>
              <option value="MULTISELECT">Select mehrfach</option>
              <option value="SECTION">Feldtitel / Container</option>
              <option value="GALLERY">Gallery (Bilder)</option>
            </select>
          </div>
          {form.type === 'SECTION' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spalten im Container</label>
              <select
                value={Number(form.containerColumns || 1)}
                onChange={(e) => setForm((f) => ({ ...f, containerColumns: Number(e.target.value) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
          )}
          {form.type !== 'SECTION' && (
            <div className="flex items-center gap-2">
              <input
                id="required"
                type="checkbox"
                checked={!!form.required}
                onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-[var(--admin-sidebar-bg)] focus:ring-[var(--admin-sidebar-bg)]"
              />
              <label htmlFor="required" className="text-sm text-gray-700">Pflichtfeld</label>
            </div>
          )}
          {form.type !== 'SECTION' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
              <input
                type="text"
                value={form.placeholder as string}
                onChange={(e) => setForm((f) => ({ ...f, placeholder: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm"
              />
            </div>
          )}
          {form.type !== 'SECTION' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hilfetext</label>
              <input
                type="text"
                value={form.helpText as string}
                onChange={(e) => setForm((f) => ({ ...f, helpText: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm"
              />
            </div>
          )}
          {form.type !== 'SECTION' && isSelectType && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Optionen (eine pro Zeile)</label>
              <textarea
                rows={4}
                value={(form.options as any as string) || ''}
                onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm"
              />
            </div>
          )}
          {form.type === 'GALLERY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max. Bilder (optional)</label>
              <input
                type="number"
                min={1}
                value={(form as any).maxItems || ''}
                onChange={(e) => setForm((f) => ({ ...f, maxItems: Number(e.target.value) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm"
              />
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded-md text-white bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)] border border-white/10"
            onClick={handleCreate}
          >
            Feld erstellen
          </button>
        </div>
      </div>

      {/* List & reorder */}
      <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-4">Felder</h2>
        {loading && <p className="text-sm text-gray-600">Lade…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-3">
          {items.filter((x) => (x.parentId == null) && x.type !== 'SECTION').map((it) => (
            <div
              key={it.id}
              draggable
              onDragStart={() => onDragStartId(it.id)}
              onDragOver={(e) => onDragOver(e, items.findIndex((x) => x.id === it.id))}
              onDrop={onDrop}
              className="flex items-start justify-between gap-3 p-3 rounded-md border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="cursor-grab select-none text-gray-400" title="Ziehen">⋮⋮</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{it.name} <span className="text-gray-400 font-normal">({it.slug})</span></div>
                    <div className="text-xs text-gray-500">{it.type} {it.required ? '· Pflichtfeld' : ''}</div>
                  </div>
                </div>
                {editingId === it.id ? (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Name</label>
                      <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900" value={editForm.name as string} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Slug</label>
                      <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900" value={editForm.slug as string} onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Typ</label>
                      <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900" value={editForm.type as GirlFieldType} onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as GirlFieldType }))}>
                        <option value="INPUT">Eingabefeld</option>
                        <option value="TEXTAREA">Großes Textfeld</option>
                        <option value="NUMBER">Zahlenfeld</option>
                        <option value="SELECT">Select</option>
                        <option value="SELECT_SEARCH">Select mit Suche</option>
                        <option value="MULTISELECT">Select mehrfach</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input id={`req-${it.id}`} type="checkbox" checked={!!editForm.required} onChange={(e) => setEditForm((f) => ({ ...f, required: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-[var(--admin-sidebar-bg)] focus:ring-[var(--admin-sidebar-bg)]" />
                      <label htmlFor={`req-${it.id}`} className="text-xs text-gray-700">Pflichtfeld</label>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Placeholder</label>
                      <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900" value={editForm.placeholder as string} onChange={(e) => setEditForm((f) => ({ ...f, placeholder: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Hilfetext</label>
                      <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900" value={editForm.helpText as string} onChange={(e) => setEditForm((f) => ({ ...f, helpText: e.target.value }))} />
                    </div>
                    {isEditSelectType && (
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-700 mb-1">Optionen (eine pro Zeile)</label>
                        <textarea rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900" value={(editForm.options as any as string) || ''} onChange={(e) => setEditForm((f) => ({ ...f, options: e.target.value }))} />
                      </div>
                    )}
                    {/** Breite (nur für Kinder innerhalb eines Containers) */}
                    {editingId === it.id && it.parentId && (
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">Breite (Spalten)</label>
                        <select
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900"
                          value={(editForm as any).colSpan ?? 1}
                          onChange={(e) => setEditForm((f) => ({ ...f, colSpan: Number(e.target.value) as any }))}
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                        </select>
                      </div>
                    )}
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <button type="button" className="px-3 py-1.5 rounded-md text-xs bg-white text-gray-800 border border-gray-200 hover:bg-gray-50" onClick={cancelEdit}>Abbrechen</button>
                      <button type="button" className="px-3 py-1.5 rounded-md text-xs text-white bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]" onClick={saveEdit}>Speichern</button>
                    </div>
                  </div>
                ) : (
                  it.options && Array.isArray(it.options) && (
                    <div className="mt-2 text-xs text-gray-500">Optionen: {(it.options as any[]).join(', ')}</div>
                  )
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${it.required ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white text-gray-800 border hover:bg-gray-50'}`}
                  onClick={() => onUpdate(it.id, { required: !it.required })}
                  title="Pflichtfeld umschalten"
                >
                  {it.required ? 'Pflicht' : 'Optional'}
                </button>
                <button
                  className="px-3 py-1.5 rounded-md text-gray-700 border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200"
                  onClick={() => startEdit(it)}
                  title="Bearbeiten"
                  aria-label="Bearbeiten"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                </button>
                <button
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                  onClick={() => onDelete(it.id)}
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
          {/* Render SECTION containers with their children */}
          {items
            .filter((f) => f.type === 'SECTION')
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <div
                key={`section-${section.id}`}
                draggable
                onDragStart={() => onDragStartId(section.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!dragId) return;
                  const dragged = items.find((x) => x.id === dragId);
                  // Only reorder sections when dragging a SECTION
                  if (dragged?.type === 'SECTION') {
                    const idx = items.findIndex((x) => x.id === section.id);
                    onDragOver(e, idx);
                  }
                }}
                onDragEnter={() => onDragEnterSection(section.id)}
                onDrop={onDrop}
                className="col-span-3 border border-gray-200 rounded-lg bg-white overflow-hidden"
              >
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-900 flex items-center gap-3">
                  <span className="cursor-grab select-none text-gray-400" title="Ziehen">⋮⋮</span>
                  {section.name}
                  <span className="ml-auto text-xs text-gray-600">Spalten:</span>
                  <select
                    className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-800"
                    value={Number(section.containerColumns || 1)}
                    onChange={async (e) => {
                      await onUpdate(section.id, { containerColumns: Number(e.target.value) } as any);
                    }}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </div>
                <div className={`p-3 grid gap-3 ${Number(section.containerColumns || 1) === 1 ? 'grid-cols-1' : Number(section.containerColumns || 1) === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                  {items
                    .filter((f) => f.parentId === section.id && f.type !== 'SECTION')
                    .sort((a, b) => a.order - b.order)
                    .map((it, idx) => (
                      <div
                        key={`child-${it.id}`}
                        draggable
                        onDragStart={() => onDragStartId(it.id)}
                        onDragOver={(e) => onDragOver(e, items.findIndex((x) => x.id === it.id))}
                        onDrop={onDrop}
                        className={`flex items-start justify-between gap-3 p-3 rounded-md border border-gray-200 bg-white shadow-sm ${(() => {
                          const cols = Number(section.containerColumns || 1);
                          const span = Math.min(Math.max(Number((it as any).colSpan || 1), 1), 3);
                          if (cols === 1) return '';
                          if (cols === 2) return span === 2 ? 'md:col-span-2' : 'md:col-span-1';
                          // cols === 3
                          if (span === 3) return 'md:col-span-3';
                          if (span === 2) return 'md:col-span-2';
                          return 'md:col-span-1';
                        })()}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="cursor-grab select-none text-gray-400" title="Ziehen">⋮⋮</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{it.name} <span className="text-gray-400 font-normal">({it.slug})</span></div>
                              <div className="text-xs text-gray-500">{it.type} {it.required ? '· Pflichtfeld' : ''}</div>
                            </div>
                          </div>
                          {editingId === it.id ? (
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-700 mb-1">Name</label>
                                <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900" value={editForm.name as string} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-700 mb-1">Slug</label>
                                <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900" value={editForm.slug as string} onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))} />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-700 mb-1">Typ</label>
                                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900" value={editForm.type as GirlFieldType} onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as GirlFieldType }))}>
                                  <option value="INPUT">Eingabefeld</option>
                                  <option value="TEXTAREA">Großes Textfeld</option>
                                  <option value="NUMBER">Zahlenfeld</option>
                                  <option value="SELECT">Select</option>
                                  <option value="SELECT_SEARCH">Select mit Suche</option>
                                  <option value="MULTISELECT">Select mehrfach</option>
                                  <option value="SECTION">Feldtitel / Container</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <input id={`req-${it.id}`} type="checkbox" checked={!!editForm.required} onChange={(e) => setEditForm((f) => ({ ...f, required: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-[var(--admin-sidebar-bg)] focus:ring-[var(--admin-sidebar-bg)]" />
                                <label htmlFor={`req-${it.id}`} className="text-xs text-gray-700">Pflichtfeld</label>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-700 mb-1">Placeholder</label>
                                <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900" value={editForm.placeholder as string} onChange={(e) => setEditForm((f) => ({ ...f, placeholder: e.target.value }))} />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-700 mb-1">Hilfetext</label>
                                <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900" value={editForm.helpText as string} onChange={(e) => setEditForm((f) => ({ ...f, helpText: e.target.value }))} />
                              </div>
                              {isEditSelectType && (
                                <div className="md:col-span-2">
                                  <label className="block text-xs text-gray-700 mb-1">Optionen (eine pro Zeile)</label>
                                  <textarea rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900" value={(editForm.options as any as string) || ''} onChange={(e) => setEditForm((f) => ({ ...f, options: e.target.value }))} />
                                </div>
                              )}
                              {editForm.type === 'GALLERY' && (
                                <div>
                                  <label className="block text-xs text-gray-700 mb-1">Max. Bilder (optional)</label>
                                  <input
                                    type="number"
                                    min={1}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900"
                                    value={(editForm as any).maxItems ?? (typeof editForm.options === 'object' ? (editForm.options as any)?.maxItems ?? '' : '')}
                                    onChange={(e) => setEditForm((f) => ({ ...f, maxItems: Number(e.target.value) }))}
                                  />
                                </div>
                              )}
                              {/** Breite (nur für Kinder innerhalb eines Containers) */}
                              {editingId === it.id && it.parentId && (
                                <div>
                                  <label className="block text-xs text-gray-700 mb-1">Breite (Spalten)</label>
                                  <select
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900"
                                    value={(editForm as any).colSpan ?? 1}
                                    onChange={(e) => setEditForm((f) => ({ ...f, colSpan: Number(e.target.value) as any }))}
                                  >
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                  </select>
                                </div>
                              )}
                              <div className="md:col-span-2 flex justify-end gap-2">
                                <button type="button" className="px-3 py-1.5 rounded-md text-xs bg-white text-gray-800 border border-gray-200 hover:bg-gray-50" onClick={cancelEdit}>Abbrechen</button>
                                <button type="button" className="px-3 py-1.5 rounded-md text-xs text-white bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]" onClick={saveEdit}>Speichern</button>
                              </div>
                            </div>
                          ) : (
                            it.options && Array.isArray(it.options) && (
                              <div className="mt-2 text-xs text-gray-500">Optionen: {(it.options as any[]).join(', ')}</div>
                            )
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="px-2 py-1 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            onClick={() => moveChild(it.id, 'up')}
                            disabled={idx === 0}
                            title="Nach oben"
                          >
                            ▲
                          </button>
                          <button
                            className="px-2 py-1 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            onClick={() => moveChild(it.id, 'down')}
                            disabled={idx === items.filter((f) => f.parentId === section.id && f.type !== 'SECTION').length - 1}
                            title="Nach unten"
                          >
                            ▼
                          </button>
                          <button
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${it.required ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white text-gray-800 border hover:bg-gray-50'}`}
                            onClick={() => onUpdate(it.id, { required: !it.required })}
                            title="Pflichtfeld umschalten"
                          >
                            {it.required ? 'Pflicht' : 'Optional'}
                          </button>
                          <button
                            className="px-3 py-1.5 rounded-md text-gray-700 border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200"
                            onClick={() => startEdit(it)}
                            title="Bearbeiten"
                            aria-label="Bearbeiten"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                          </button>
                          <button
                            className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                            onClick={() => onDelete(it.id)}
                          >
                            Löschen
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          {!loading && items.length === 0 && (
            <div className="text-sm text-gray-500">Noch keine Felder vorhanden.</div>
          )}
        </div>
      </div>
    </div>
  );
}
