# ESCORT-CMS Admin Dashboard

Dies ist das Admin Dashboard für das ESCORT-CMS. Es bietet eine Übersicht über die wichtigsten Statistiken und Schnellzugriff auf häufig verwendete Funktionen.

## Struktur

- `page.tsx` - Die Hauptseite des Dashboards mit Statistiken und Schnellaktionen
- `layout.tsx` - Das grundlegende Layout mit Sidebar und Header
- `components/` - Enthält wiederverwendbare UI-Komponenten
  - `Sidebar.tsx` - Die Navigationsleiste auf der linken Seite
  - `Header.tsx` - Die obere Navigationsleiste
  - `StatCard.tsx` - Karten zur Anzeige von Statistiken
  - `QuickActionCard.tsx` - Karten für Schnellaktionen

## Farben

Das Dashboard verwendet eine konsistente Farbpalette:

- Primärfarbe (Sidebar): `hsl(341.5, 75.5%, 30.4%)`
- Header-Farbe: `hsl(240, 10%, 3.9%)`

Diese Farben sind als CSS-Variablen definiert in `app/globals.css`:

- `--admin-sidebar-bg`
- `--admin-header-bg`

## Funktionen

1. **Responsive Design** - Das Dashboard passt sich an verschiedene Bildschirmgrößen an
2. **Navigationsmenü** - Mit der Sidebar können alle Admin-Bereiche erreicht werden
3. **Statistik-Karten** - Zeigen wichtige Kennzahlen des Systems an
4. **Schnellaktionen** - Direkter Zugriff auf häufig verwendete Funktionen
5. **Aktivitäten-Liste** - Übersicht der letzten Aktivitäten im System