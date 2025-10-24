'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useToast } from '@/app/admin/components/ToastProvider';

export default function MediaUploadSheet({
  open,
  onClose,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: (files: { name: string; url: string }[]) => void;
}) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: { name: string; url: string }[] = [];
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/media', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Upload fehlgeschlagen');
        const data = await res.json();
        uploaded.push({ name: data.name, url: data.url });
      }
      onUploaded(uploaded);
      showToast({ variant: 'success', title: 'Upload', message: `${uploaded.length} Datei(en) hochgeladen.` });
      onClose();
    } catch (e: any) {
      showToast({ variant: 'error', title: 'Fehler', message: e?.message || 'Upload fehlgeschlagen' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [onUploaded, onClose, showToast]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white/95 backdrop-blur border-l border-gray-200 shadow-xl flex flex-col">
        <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight text-gray-900">Bilder hochladen</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Schließen">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition bg-white ${dragOver ? 'border-[var(--admin-sidebar-bg)] bg-[var(--admin-sidebar-bg)]/5' : 'border-gray-300'}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          >
            <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
            <p className="mt-2 text-sm text-gray-600">Dateien hierher ziehen oder</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-3 py-1.5 rounded-md text-white bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]"
            >
              Dateien auswählen
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
          </div>
          <p className="text-xs text-gray-500">Unterstützte Formate: PNG, JPG, GIF, SVG. Mehrfach-Upload möglich.</p>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2 bg-white/80 backdrop-blur">
          <button onClick={onClose} className="px-3 py-2 rounded-md border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50">Abbrechen</button>
          <button disabled className="px-3 py-2 rounded-md text-white text-sm bg-gray-400" aria-disabled="true">{uploading ? 'Lädt…' : 'Bereit'}</button>
        </div>
      </div>
    </div>
  );
}
