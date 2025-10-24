'use client';

import React, { useState } from 'react';
import DropdownSelect from '@/app/admin/components/DropdownSelect';
import { useToast } from '@/app/admin/components/ToastProvider';

export default function SettingsPage() {
  const { showToast } = useToast();
  // Allgemeine Einstellungen
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'ESCORT-CMS',
    siteDescription: 'Content Management System für Escort-Agenturen',
    adminEmail: 'admin@example.com',
    timeZone: 'Europe/Berlin',
    dateFormat: 'dd.MM.yyyy',
    timeFormat: 'HH:mm',
  });

  // Benutzer-Einstellungen
  const [userSettings, setUserSettings] = useState({
    allowRegistration: true,
    defaultRole: 'author',
    requireEmailVerification: true,
  });

  // Sicherheitseinstellungen
  const [securitySettings, setSecuritySettings] = useState({
    enableTwoFactorAuth: false,
    passwordMinLength: 8,
    sessionTimeout: 30, // Minuten
  });

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'allgemein' | 'aussehen' | 'sicherheit'>('allgemein');
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [faviconPath, setFaviconPath] = useState<string | null>(null);
  const [media, setMedia] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; visible: boolean; x: number; y: number }>({ url: '', visible: false, x: 0, y: 0 });

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setInitializing(true);
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (!res.ok) throw new Error('Fehler beim Laden der Einstellungen');
        const data = await res.json();
        if (!active) return;
        setGeneralSettings({
          siteName: data.siteName,
          siteDescription: data.siteDescription,
          adminEmail: data.adminEmail,
          timeZone: data.timeZone,
          dateFormat: data.dateFormat,
          timeFormat: data.timeFormat,
        });
        setUserSettings({
          allowRegistration: data.allowRegistration,
          defaultRole: data.defaultRole,
          requireEmailVerification: data.requireEmailVerification,
        });
        setSecuritySettings({
          enableTwoFactorAuth: data.enableTwoFactorAuth,
          passwordMinLength: data.passwordMinLength,
          sessionTimeout: data.sessionTimeout,
        });
        setLogoPath(data.logoPath ?? null);
        setFaviconPath(data.faviconPath ?? null);
      } catch (e: any) {
        setError(e.message || 'Unbekannter Fehler');
      } finally {
        if (active) setInitializing(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  // Load media list on demand when switching to Aussehen
  React.useEffect(() => {
    const loadMedia = async () => {
      if (activeTab !== 'aussehen') return;
      await fetchMediaList();
    };
    loadMedia();
  }, [activeTab]);

  const fetchMediaList = async () => {
    try {
      const res = await fetch('/api/media', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setMedia(data.items || []);
    } catch {}
  };

  const showPreview = (url: string, e: React.MouseEvent) => {
    setPreview({ url, visible: true, x: (e as any).clientX + 12, y: (e as any).clientY + 12 });
  };
  const movePreview = (e: React.MouseEvent) => {
    if (!preview.visible) return;
    setPreview((p) => ({ ...p, x: (e as any).clientX + 12, y: (e as any).clientY + 12 }));
  };
  const hidePreview = () => setPreview((p) => ({ ...p, visible: false }));

  const handleGeneralSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setGeneralSettings(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleUserSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setUserSettings(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleSecuritySettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setSecuritySettings(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      const payload = {
        ...generalSettings,
        ...userSettings,
        ...securitySettings,
        logoPath,
        faviconPath,
      };
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      await res.json();
      showToast({ variant: 'success', title: 'Gespeichert', message: 'Einstellungen wurden gespeichert!' });
    } catch (e: any) {
      setError(e.message || 'Unbekannter Fehler');
      showToast({ variant: 'error', title: 'Fehler', message: e.message || 'Speichern fehlgeschlagen' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-0">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">Systemeinstellungen</h1>
        <p className="text-sm text-gray-600 mt-1">Verwalten Sie die allgemeinen Einstellungen Ihres ESCORT-CMS</p>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-2">
          <div className="flex gap-2">
            <button
              className={`px-3 py-2 text-sm rounded-md border transition ${activeTab === 'allgemein' ? 'bg-[var(--admin-sidebar-bg)] text-white border-white/10' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('allgemein')}
              type="button"
            >
              Allgemein & Benutzer
            </button>
            <button
              className={`px-3 py-2 text-sm rounded-md border transition ${activeTab === 'aussehen' ? 'bg-[var(--admin-sidebar-bg)] text-white border-white/10' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('aussehen')}
              type="button"
            >
              Aussehen
            </button>
            <button
              className={`px-3 py-2 text-sm rounded-md border transition ${activeTab === 'sicherheit' ? 'bg-[var(--admin-sidebar-bg)] text-white border-white/10' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('sicherheit')}
              type="button"
            >
              Sicherheitseinstellungen
            </button>
          </div>
        </div>

        {initializing && (
          <div className="text-sm text-gray-600">Einstellungen werden geladen…</div>
        )}
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        {activeTab === 'allgemein' && (
          <>
            <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-4">Allgemeine Einstellungen</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Seitenname
                  </label>
                  <input
                    type="text"
                    name="siteName"
                    value={generalSettings.siteName}
                    onChange={handleGeneralSettingsChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm rounded-md text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Seitenbeschreibung
                  </label>
                  <input
                    type="text"
                    name="siteDescription"
                    value={generalSettings.siteDescription}
                    onChange={handleGeneralSettingsChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm rounded-md text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Administrator-E-Mail
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={generalSettings.adminEmail}
                    onChange={handleGeneralSettingsChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm rounded-md text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Zeitzone
                  </label>
                  <DropdownSelect
                    value={generalSettings.timeZone}
                    onChange={(val) =>
                      setGeneralSettings((prev) => ({ ...prev, timeZone: val }))
                    }
                    options={[
                      { label: 'Europe/Berlin', value: 'Europe/Berlin' },
                      { label: 'Europe/London', value: 'Europe/London' },
                      { label: 'America/New_York', value: 'America/New_York' },
                      { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
                    ]}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Datumsformat
                  </label>
                  <DropdownSelect
                    value={generalSettings.dateFormat}
                    onChange={(val) =>
                      setGeneralSettings((prev) => ({ ...prev, dateFormat: val }))
                    }
                    options={[
                      { label: 'dd.MM.yyyy', value: 'dd.MM.yyyy' },
                      { label: 'MM/dd/yyyy', value: 'MM/dd/yyyy' },
                      { label: 'yyyy-MM-dd', value: 'yyyy-MM-dd' },
                    ]}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Zeitformat
                  </label>
                  <DropdownSelect
                    value={generalSettings.timeFormat}
                    onChange={(val) =>
                      setGeneralSettings((prev) => ({ ...prev, timeFormat: val }))
                    }
                    options={[
                      { label: '24-Stunden (HH:mm)', value: 'HH:mm' },
                      { label: '12-Stunden (hh:mm A)', value: 'hh:mm A' },
                    ]}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-4">Benutzer-Einstellungen</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="allowRegistration"
                    checked={userSettings.allowRegistration}
                    onChange={handleUserSettingsChange}
                    className="h-4 w-4 text-[var(--admin-sidebar-bg)] focus:ring-[var(--admin-sidebar-bg)] border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Benutzerregistrierung erlauben
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Standardrolle für neue Benutzer
                  </label>
                  <DropdownSelect
                    value={userSettings.defaultRole}
                    onChange={(val) =>
                      setUserSettings((prev) => ({ ...prev, defaultRole: val }))
                    }
                    options={[
                      { value: 'subscriber', label: 'Abonnent' },
                      { value: 'author', label: 'Autor' },
                      { value: 'editor', label: 'Editor' },
                      { value: 'administrator', label: 'Administrator' },
                    ]}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="requireEmailVerification"
                    checked={userSettings.requireEmailVerification}
                    onChange={handleUserSettingsChange}
                    className="h-4 w-4 text-[var(--admin-sidebar-bg)] focus:ring-[var(--admin-sidebar-bg)] border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    E-Mail-Verifizierung erforderlich
                  </label>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'aussehen' && (
          <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-4">Aussehen</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Logo</label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 flex items-center justify-center rounded-md border border-gray-200 bg-white overflow-hidden">
                    {logoPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPath} alt="Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs text-gray-500">Kein Logo</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label className="inline-flex items-center px-3 py-2 rounded-md border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      Datei hochladen
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setUploading(true);
                            const fd = new FormData();
                            fd.append('file', file);
                            const res = await fetch('/api/media', { method: 'POST', body: fd });
                            if (!res.ok) throw new Error('Upload fehlgeschlagen');
                            const data = await res.json();
                            setLogoPath(data.url);
                            // refresh media list
                            await fetchMediaList();
                            showToast({ variant: 'success', title: 'Upload', message: 'Logo hochgeladen.' });
                          } catch (err) {
                            showToast({ variant: 'error', title: 'Fehler', message: 'Upload fehlgeschlagen' });
                          } finally {
                            setUploading(false);
                            if (e.target) e.target.value = '';
                          }
                        }}
                      />
                    </label>
                    {logoPath && (
                      <button
                        type="button"
                        onClick={() => setLogoPath(null)}
                        className="px-3 py-2 rounded-md border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Logo entfernen
                      </button>
                    )}
                  </div>
                </div>
                {uploading && <p className="mt-2 text-xs text-gray-500">Upload läuft…</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-900">Aus Medien auswählen</label>
                  <button
                    type="button"
                    onClick={async () => { await fetchMediaList(); showToast({ variant: 'success', title: 'Aktualisiert', message: 'Medienliste aktualisiert.' }); }}
                    className="px-3 py-1.5 rounded-md border border-white/10 text-white text-xs bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]"
                  >
                    Aktualisieren
                  </button>
                </div>
                <div className="grid grid-cols-8 gap-1 p-3 rounded-md border border-gray-200 bg-white/60">
                  {media.length === 0 && (
                    <p className="col-span-4 text-sm text-gray-500">Keine Medien gefunden.</p>
                  )}
                  {media.map((m) => (
                    <button
                      type="button"
                      key={m.url}
                      onClick={() => setLogoPath(m.url)}
                      onMouseEnter={(e) => showPreview(m.url, e)}
                      onMouseMove={movePreview}
                      onMouseLeave={hidePreview}
                      className={`relative h-12 w-12 rounded-md border overflow-hidden p-0.5 ${logoPath === m.url ? 'ring-2 ring-[var(--admin-sidebar-bg)]' : 'hover:border-gray-300'}`}
                      title={m.name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt={m.name} className="h-full w-full object-cover rounded" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Favicon</label>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 flex items-center justify-center rounded-md border border-gray-200 bg-white overflow-hidden">
                    {faviconPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={faviconPath} alt="Favicon" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs text-gray-500">Kein Favicon</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label className="inline-flex items-center px-3 py-2 rounded-md border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      Datei hochladen
                      <input
                        type="file"
                        accept="image/x-icon,image/png,image/svg+xml"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setUploading(true);
                            const fd = new FormData();
                            fd.append('file', file);
                            const res = await fetch('/api/media', { method: 'POST', body: fd });
                            if (!res.ok) throw new Error('Upload fehlgeschlagen');
                            const data = await res.json();
                            setFaviconPath(data.url);
                            await fetchMediaList();
                            showToast({ variant: 'success', title: 'Upload', message: 'Favicon hochgeladen.' });
                          } catch (err) {
                            showToast({ variant: 'error', title: 'Fehler', message: 'Upload fehlgeschlagen' });
                          } finally {
                            setUploading(false);
                            if (e.target) e.target.value = '';
                          }
                        }}
                      />
                    </label>
                    {faviconPath && (
                      <button
                        type="button"
                        onClick={() => setFaviconPath(null)}
                        className="px-3 py-2 rounded-md border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Favicon entfernen
                      </button>
                    )}
                  </div>
                </div>
                {uploading && <p className="mt-2 text-xs text-gray-500">Upload läuft…</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Aus Medien auswählen</label>
                <div className="grid grid-cols-8 gap-1 p-3 rounded-md border border-gray-200 bg-white/60">
                  {media.length === 0 && (
                    <p className="col-span-4 text-sm text-gray-500">Keine Medien gefunden.</p>
                  )}
                  {media.map((m) => (
                    <button
                      type="button"
                      key={m.url}
                      onClick={() => setFaviconPath(m.url)}
                      onMouseEnter={(e) => showPreview(m.url, e)}
                      onMouseMove={movePreview}
                      onMouseLeave={hidePreview}
                      className={`relative h-12 w-12 rounded-md border overflow-hidden p-0.5 ${faviconPath === m.url ? 'ring-2 ring-[var(--admin-sidebar-bg)]' : 'hover:border-gray-300'}`}
                      title={m.name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt={m.name} className="h-full w-full object-cover rounded" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sicherheit' && (
          <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-4">Sicherheitseinstellungen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="enableTwoFactorAuth"
                  checked={securitySettings.enableTwoFactorAuth}
                  onChange={handleSecuritySettingsChange}
                  className="h-4 w-4 text-[var(--admin-sidebar-bg)] focus:ring-[var(--admin-sidebar-bg)] border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Zwei-Faktor-Authentifizierung aktivieren
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Minimale Passwortlänge
                </label>
                <input
                  type="number"
                  name="passwordMinLength"
                  min="6"
                  max="50"
                  value={securitySettings.passwordMinLength}
                  onChange={handleSecuritySettingsChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm rounded-md text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Sitzungs-Timeout (Minuten)
                </label>
                <input
                  type="number"
                  name="sessionTimeout"
                  min="1"
                  max="1440"
                  value={securitySettings.sessionTimeout}
                  onChange={handleSecuritySettingsChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)] sm:text-sm rounded-md text-gray-900"
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            className="bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)] text-white px-4 py-2 rounded-md transition-colors duration-200"
            disabled={loading}
          >
            {loading ? 'Speichern…' : 'Änderungen speichern'}
          </button>
        </div>
      </div>
      {preview.visible && (
        <div
          className="fixed z-[1000] pointer-events-none rounded-md border border-gray-200 bg-white/95 backdrop-blur shadow-lg p-2"
          style={{ top: preview.y, left: preview.x }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.url} alt="Vorschau" className="h-64 w-64 object-contain" />
        </div>
      )}
    </div>
  );
}