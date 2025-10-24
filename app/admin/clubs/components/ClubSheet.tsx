'use client';

import React, { useState } from 'react';
import { useToast } from '@/app/admin/components/ToastProvider';

type DayHours = { open: string; close: string; closed: boolean };

export type ClubForm = {
  name: string;
  street: string;
  houseNumber: string;
  zipAndCity: string;
  logo: File | null;
  watermark: File | null;
  // Club-Informationen
  clubPhone: string;
  clubMobile: string;
  clubMobileWhatsApp: boolean;
  clubEmail: string;
  // Job-Informationen
  jobPhone: string;
  jobMobile: string;
  jobMobileWhatsApp: boolean;
  jobEmail: string;
  jobContactPerson: string;
  // Öffnungszeiten strukturiert pro Wochentag
  openingHours: Record<string, DayHours>;
};

export default function ClubSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (data: ClubForm) => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState<ClubForm>({
    name: '',
    street: '',
    houseNumber: '',
    zipAndCity: '',
    logo: null,
    watermark: null,
    clubPhone: '',
    clubMobile: '',
    clubMobileWhatsApp: false,
    clubEmail: '',
    jobPhone: '',
    jobMobile: '',
    jobMobileWhatsApp: false,
    jobEmail: '',
    jobContactPerson: '',
    openingHours: {
      Montag:   { open: '', close: '', closed: false },
      Dienstag: { open: '', close: '', closed: false },
      Mittwoch: { open: '', close: '', closed: false },
      Donnerstag: { open: '', close: '', closed: false },
      Freitag:  { open: '', close: '', closed: false },
      Samstag:  { open: '', close: '', closed: false },
      Sonntag:  { open: '', close: '', closed: false },
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const name = (target as any).name as keyof ClubForm;
    let nextValue: any = (target as any).value;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      nextValue = target.checked;
    }
    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof ClubForm) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, [fieldName]: file as any }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateHours();
    if (err) {
      setHoursError(err);
      return;
    }
    submitAsync();
    // Reset after submit
    // handled in submitAsync on success
  };

  const [submitting, setSubmitting] = useState(false);
  const submitAsync = async () => {
    try {
      setSubmitting(true);
      setHoursError('');
      // 1) Upload files if present
      let logoPath: string | null = null;
      let watermarkPath: string | null = null;
      if (form.logo) {
        const fd = new FormData();
        fd.append('file', form.logo);
        const res = await fetch('/api/media', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Logo Upload fehlgeschlagen');
        const data = await res.json();
        logoPath = data.url;
      }
      if (form.watermark) {
        const fd = new FormData();
        fd.append('file', form.watermark);
        const res = await fetch('/api/media', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Wasserzeichen Upload fehlgeschlagen');
        const data = await res.json();
        watermarkPath = data.url;
      }

      // 2) Persist club
      const payload = {
        name: form.name,
        street: form.street,
        houseNumber: form.houseNumber,
        zipAndCity: form.zipAndCity,
        logoPath,
        watermarkPath,
        clubPhone: form.clubPhone || null,
        clubMobile: form.clubMobile || null,
        clubMobileWhatsApp: !!form.clubMobileWhatsApp,
        clubEmail: form.clubEmail || null,
        jobPhone: form.jobPhone || null,
        jobMobile: form.jobMobile || null,
        jobMobileWhatsApp: !!form.jobMobileWhatsApp,
        jobEmail: form.jobEmail || null,
        jobContactPerson: form.jobContactPerson || null,
        openingHours: form.openingHours,
      };
      const resClub = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resClub.ok) throw new Error('Speichern fehlgeschlagen');
      const saved = await resClub.json();
      showToast({ variant: 'success', title: 'Gespeichert', message: `Club "${saved.name}" erstellt.` });
      onCreated(saved);
      // reset form
      setForm({
        name: '', street: '', houseNumber: '', zipAndCity: '', logo: null, watermark: null,
        clubPhone: '', clubMobile: '', clubMobileWhatsApp: false, clubEmail: '',
        jobPhone: '', jobMobile: '', jobMobileWhatsApp: false, jobEmail: '', jobContactPerson: '',
        openingHours: {
          Montag:   { open: '', close: '', closed: false },
          Dienstag: { open: '', close: '', closed: false },
          Mittwoch: { open: '', close: '', closed: false },
          Donnerstag: { open: '', close: '', closed: false },
          Freitag:  { open: '', close: '', closed: false },
          Samstag:  { open: '', close: '', closed: false },
          Sonntag:  { open: '', close: '', closed: false },
        },
      });
    } catch (e: any) {
      showToast({ variant: 'error', title: 'Fehler', message: e?.message || 'Speichern fehlgeschlagen' });
    } finally {
      setSubmitting(false);
    }
  };

  const updateDayHours = (day: string, field: keyof DayHours, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [field]: value as any,
        },
      },
    }));
  };

  const daysOrder = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];

  const applyShortcut = (type: 'wk_10_20' | 'all_12_22' | 'all_closed') => {
    setForm((prev) => {
      const next = { ...prev.openingHours } as Record<string, DayHours>;
      daysOrder.forEach((d) => {
        if (type === 'wk_10_20') {
          const isWeekend = d === 'Samstag' || d === 'Sonntag';
          next[d] = { open: isWeekend ? '' : '10:00', close: isWeekend ? '' : '20:00', closed: isWeekend };
        } else if (type === 'all_12_22') {
          next[d] = { open: '12:00', close: '22:00', closed: false };
        } else if (type === 'all_closed') {
          next[d] = { open: '', close: '', closed: true };
        }
      });
      return { ...prev, openingHours: next };
    });
  };

  const [hoursError, setHoursError] = useState<string>('');
  const validateHours = () => {
    for (const d of daysOrder) {
      const v = form.openingHours[d];
      if (!v.closed) {
        if ((v.open && !v.close) || (!v.open && v.close)) return `Bitte vollständige Zeiten für ${d} angeben.`;
        if (v.open && v.close && v.open >= v.close) return `Für ${d} muss "Von" vor "Bis" liegen.`;
      }
    }
    return '';
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-80% transform transition-transform duration-300 ease-in-out">
          <div className="h-full flex flex-col bg-white border-l border-gray-200 shadow-xl">
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-6 sm:px-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg leading-6 font-semibold tracking-tight text-gray-900">Neuen Club erstellen</h3>
                  <button
                    type="button"
                    className="ml-3 h-7 w-7 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)]"
                    onClick={onClose}
                    aria-label="Schließen"
                  >
                    <svg className="h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-6 relative flex-1 px-4 sm:px-6">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Club-Name</label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={form.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="street" className="block text-sm font-medium text-gray-700">Straße</label>
                        <input
                          type="text"
                          name="street"
                          id="street"
                          value={form.street}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700">Hausnummer</label>
                        <input
                          type="text"
                          name="houseNumber"
                          id="houseNumber"
                          value={form.houseNumber}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="zipAndCity" className="block text-sm font-medium text-gray-700">PLZ & Ort</label>
                      <input
                        type="text"
                        name="zipAndCity"
                        id="zipAndCity"
                        value={form.zipAndCity}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm"
                        required
                      />
                    </div>

                    {/* Info-Container nebeneinander */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Club-Informationen Container */}
                      <div className="rounded-lg p-4 bg-[var(--admin-sidebar-bg)]/95 text-white">
                        <h4 className="text-sm font-semibold tracking-wide mb-3">Club-Informationen</h4>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-white/90 mb-1">Telefon</label>
                            <input
                              type="tel"
                              name="clubPhone"
                              value={form.clubPhone}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-white/20 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/90 mb-1">Mobile</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="tel"
                                name="clubMobile"
                                value={form.clubMobile}
                                onChange={handleInputChange}
                                className="block w-full rounded-md border border-white/20 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
                              />
                              <label className="inline-flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  name="clubMobileWhatsApp"
                                  checked={form.clubMobileWhatsApp}
                                  onChange={handleInputChange}
                                  className="h-4 w-4 rounded border-white/30 text-[var(--admin-sidebar-bg)] focus:ring-[var(--admin-sidebar-bg)]"
                                />
                                WhatsApp
                              </label>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/90 mb-1">Kontakt-E-Mail</label>
                            <input
                              type="email"
                              name="clubEmail"
                              value={form.clubEmail}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-white/20 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Job-Informationen Container */}
                      <div className="rounded-lg p-4 bg-[var(--admin-sidebar-bg)]/95 text-white">
                        <h4 className="text-sm font-semibold tracking-wide mb-3">Job-Informationen</h4>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-white/90 mb-1">Telefon</label>
                            <input
                              type="tel"
                              name="jobPhone"
                              value={form.jobPhone}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-white/20 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/90 mb-1">Mobile</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="tel"
                                name="jobMobile"
                                value={form.jobMobile}
                                onChange={handleInputChange}
                                className="block w-full rounded-md border border-white/20 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
                              />
                              <label className="inline-flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  name="jobMobileWhatsApp"
                                  checked={form.jobMobileWhatsApp}
                                  onChange={handleInputChange}
                                  className="h-4 w-4 rounded border-white/30 text-[var(--admin-sidebar-bg)] focus:ring-[var(--admin-sidebar-bg)]"
                                />
                                WhatsApp
                              </label>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/90 mb-1">E-Mail</label>
                            <input
                              type="email"
                              name="jobEmail"
                              value={form.jobEmail}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-white/20 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/90 mb-1">Kontaktperson</label>
                            <input
                              type="text"
                              name="jobContactPerson"
                              value={form.jobContactPerson}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-white/20 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Öffnungszeiten */}
                    <div className="rounded-lg p-4 border border-gray-200 bg-white">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold tracking-wide text-gray-900">Öffnungszeiten</h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => applyShortcut('wk_10_20')}
                            className="px-3 py-1.5 rounded-md text-xs text-white bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]"
                          >
                            Mo–Fr 10–20
                          </button>
                          <button
                            type="button"
                            onClick={() => applyShortcut('all_12_22')}
                            className="px-3 py-1.5 rounded-md text-xs text-white bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]"
                          >
                            Alle 12–22
                          </button>
                          <button
                            type="button"
                            onClick={() => applyShortcut('all_closed')}
                            className="px-3 py-1.5 rounded-md text-xs text-white bg-red-600 hover:bg-red-700"
                          >
                            Alle geschlossen
                          </button>
                        </div>
                      </div>
                      {hoursError && (
                        <div className="mb-2 text-xs text-red-600">{hoursError}</div>
                      )}
                      <div className="grid grid-cols-1 gap-3">
                        {daysOrder.map((day) => {
                          const val = form.openingHours[day];
                          return (
                            <div key={day} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                              <div className="md:col-span-3 text-sm text-gray-900 font-medium">{day}</div>
                              <div className="md:col-span-3">
                                <label className="block text-xs text-gray-700 mb-1">Von</label>
                                <input
                                  type="time"
                                  value={val.open}
                                  onChange={(e) => updateDayHours(day, 'open', e.target.value)}
                                  disabled={val.closed}
                                  className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
                                />
                              </div>
                              <div className="md:col-span-3">
                                <label className="block text-xs text-gray-700 mb-1">Bis</label>
                                <input
                                  type="time"
                                  value={val.close}
                                  onChange={(e) => updateDayHours(day, 'close', e.target.value)}
                                  disabled={val.closed}
                                  className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
                                />
                              </div>
                              <div className="md:col-span-3 flex items-center">
                                <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={val.closed}
                                    onChange={(e) => updateDayHours(day, 'closed', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-[var(--admin-sidebar-bg)] focus:ring-[var(--admin-sidebar-bg)]"
                                  />
                                  Geschlossen
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dateien */}
                    <div>
                      <label htmlFor="logo" className="block text-sm font-medium text-gray-700">Logo</label>
                      <input
                        type="file"
                        name="logo"
                        id="logo"
                        onChange={(e) => handleFileChange(e, 'logo')}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[var(--admin-sidebar-bg)] file:text-white hover:file:bg-[var(--admin-sidebar-hover)]"
                      />
                    </div>

                    <div>
                      <label htmlFor="watermark" className="block text-sm font-medium text-gray-700">Wasserzeichen</label>
                      <input
                        type="file"
                        name="watermark"
                        id="watermark"
                        onChange={(e) => handleFileChange(e, 'watermark')}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[var(--admin-sidebar-bg)] file:text-white hover:file:bg-[var(--admin-sidebar-hover)]"
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="flex-shrink-0 px-4 py-4 flex justify-end border-t border-gray-200 bg-white/80 backdrop-blur">
              <button
                type="button"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--admin-sidebar-bg)]"
                onClick={onClose}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`ml-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${submitting ? 'bg-gray-400' : 'bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--admin-sidebar-bg)]`}
                onClick={handleSubmit}
              >
                {submitting ? 'Speichern…' : 'Erstellen'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
