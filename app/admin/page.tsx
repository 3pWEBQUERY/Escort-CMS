'use client';

import React from 'react';
import StatCard from '@/app/admin/components/StatCard';
import QuickActionCard from '@/app/admin/components/QuickActionCard';

export default function AdminDashboard() {
  // Beispiel-Daten für Statistiken
  const stats = [
    { title: 'Gesamte Benutzer', value: '1,245', change: '+12%' },
    { title: 'Aktive Inhalte', value: '342', change: '+5%' },
    { title: 'Besuche diese Woche', value: '5,689', change: '+18%' },
    { title: 'Ausstehende Moderation', value: '24', change: '-3%' },
  ];

  // Beispiel-Daten für Schnellaktionen
  const quickActions = [
    { title: 'Neuer Benutzer', description: 'Neuen Benutzer erstellen', icon: '👤', href: '/admin/users/new' },
    { title: 'Inhalt hinzufügen', description: 'Neuen Inhalt veröffentlichen', icon: '📝', href: '/admin/content/new' },
    { title: 'Berichte', description: 'Systemberichte anzeigen', icon: '📊', href: '/admin/reports' },
    { title: 'Einstellungen', description: 'Systemeinstellungen anpassen', icon: '⚙️', href: '/admin/settings' },
  ];

  return (
    <div className="p-4 md:p-0">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">Willkommen im ESCORT-CMS Admin Dashboard</p>
      </div>

      {/* Statistik-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
          />
        ))}
      </div>

      {/* Schnellaktionen */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-4">Schnellaktionen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={index}
              title={action.title}
              description={action.description}
              icon={action.icon}
              href={action.href}
            />
          ))}
        </div>
      </div>

      {/* Zuletzt hinzugefügte Inhalte */}
      <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-4">Letzte Aktivitäten</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Inhalt
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Autor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Datum
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr className="odd:bg-white even:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap align-top">
                  <div className="text-sm font-medium text-gray-900">Neue Artikelserie</div>
                  <div className="text-xs text-gray-500">Marketing</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap align-top">
                  <div className="text-sm text-gray-900">Max Mustermann</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                  12. Okt 2025
                </td>
                <td className="px-6 py-4 whitespace-nowrap align-top">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-50 text-green-700 ring-1 ring-green-200">
                    Veröffentlicht
                  </span>
                </td>
              </tr>
              <tr className="odd:bg-white even:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap align-top">
                  <div className="text-sm font-medium text-gray-900">Produktaktualisierung</div>
                  <div className="text-xs text-gray-500">Technik</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap align-top">
                  <div className="text-sm text-gray-900">Erika Musterfrau</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                  10. Okt 2025
                </td>
                <td className="px-6 py-4 whitespace-nowrap align-top">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200">
                    Ausstehend
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}