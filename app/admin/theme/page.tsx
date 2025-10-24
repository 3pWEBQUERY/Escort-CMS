'use client';

import React, { useState } from 'react';
import { useToast } from '@/app/admin/components/ToastProvider';

export default function ThemePage() {
  const { showToast } = useToast();
  const handleSave = () => {
    // Hier würde normalerweise die API aufgerufen werden
    try {
      console.log('Theme-Einstellungen gespeichert');
      showToast({ variant: 'success', title: 'Gespeichert', message: 'Theme-Einstellungen wurden gespeichert!' });
    } catch (e: any) {
      showToast({ variant: 'error', title: 'Fehler', message: e?.message || 'Speichern fehlgeschlagen' });
    }
  };

  // Theme-Vorlagen (ähnlich wie WordPress Themes)
  const themeTemplates = [
    {
      id: 1,
      name: "Standard Theme",
      description: "Das Standard-Theme mit blauen Akzenten",
      previewColor: "#3b82f6",
      settings: {
        primaryColor: '#3b82f6',
        secondaryColor: '#10b981',
        backgroundColor: '#f3f4f6',
        textColor: '#1f2937',
        borderRadius: '0.5rem',
        fontSize: '1rem',
      }
    },
    {
      id: 2,
      name: "Dunkles Theme",
      description: "Ein dunkles Theme für reduzierte Augenbelastung",
      previewColor: "#1f2937",
      settings: {
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        backgroundColor: '#111827',
        textColor: '#f9fafb',
        borderRadius: '0.5rem',
        fontSize: '1rem',
      }
    },
    {
      id: 3,
      name: "Grünes Theme",
      description: "Ein frisches Theme mit grünen Akzenten",
      previewColor: "#10b981",
      settings: {
        primaryColor: '#10b981',
        secondaryColor: '#06b6d4',
        backgroundColor: '#f0fdf4',
        textColor: '#052e16',
        borderRadius: '0.5rem',
        fontSize: '1rem',
      }
    }
  ];

  const applyThemeTemplate = (template: any) => {
    try {
      // In einer echten Anwendung würden wir hier die Theme-Einstellungen speichern
      console.log('Theme angewendet:', template.name);
      showToast({ variant: 'success', title: 'Theme angewendet', message: `"${template.name}" wurde übernommen.` });
    } catch (e: any) {
      showToast({ variant: 'error', title: 'Fehler', message: e?.message || 'Theme konnte nicht angewendet werden' });
    }
  };

  return (
    <div className="p-4 md:p-0">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">Theme Auswahl</h1>
        <p className="text-sm text-gray-600">Wählen Sie ein vorgefertigtes Theme für Ihr ESCORT-CMS</p>
      </div>
      
      {/* Theme-Vorlagen Grid (WordPress-Stil) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {themeTemplates.map((template) => (
          <div 
            key={template.id} 
            className="bg-white/90 backdrop-blur rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <div 
              className="h-32 flex items-center justify-center"
              style={{ backgroundColor: template.previewColor }}
            >
              <span className="text-white font-semibold text-lg tracking-tight drop-shadow-sm">{template.name}</span>
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm mb-4">{template.description}</p>
              <button
                onClick={() => applyThemeTemplate(template)}
                className="w-full bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)] text-white px-4 py-2 rounded-md border border-white/10 shadow-sm transition-colors duration-200"
              >
                Theme anwenden
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          className="bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)] text-white px-4 py-2 rounded-md border border-white/10 shadow-sm transition-colors duration-200"
        >
          Änderungen speichern
        </button>
      </div>
    </div>
  );
}
