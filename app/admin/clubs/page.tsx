'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/app/admin/components/ToastProvider';
import ClubSheet, { type ClubForm } from './components/ClubSheet';

export default function ClubsPage() {
  const { showToast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<any[]>([]);

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

  useEffect(() => {
    load();
  }, []);

  const handleCreated = (data: ClubForm) => {
    setIsSheetOpen(false);
    showToast({ variant: 'success', title: 'Erstellt', message: 'Club wurde erstellt.' });
    load();
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((club) => (
            <div key={club.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
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
                </div>
              </div>
            </div>
          ))}
          {(!loading && !error && items.length === 0) && (
            <div className="col-span-3 text-sm text-gray-500">Noch keine Clubs vorhanden.</div>
          )}
        </div>
      </div>
      
      <ClubSheet open={isSheetOpen} onClose={() => setIsSheetOpen(false)} onCreated={handleCreated} />
    </div>
  );
}