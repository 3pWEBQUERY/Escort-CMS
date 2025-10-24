"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "@/app/admin/components/ToastProvider";

type Girl = { id: string; values: any[] };

export default function AttendancePage() {
  const { showToast } = useToast();
  const [girls, setGirls] = useState<Girl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(() => new Date());
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});

  const ymKey = useMemo(() => `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`, [current]);

  useEffect(() => {
    const loadGirls = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/girls", { cache: "no-store" });
        if (!res.ok) throw new Error("Konnte Girls nicht laden");
        const data = await res.json();
        setGirls(Array.isArray(data.items) ? data.items : []);
      } catch (e: any) {
        setError(e.message || "Unbekannter Fehler");
        showToast({ variant: "error", title: "Fehler", message: e.message || "Konnte Girls nicht laden" });
      } finally {
        setLoading(false);
      }
    };
    loadGirls();
  }, [showToast]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(`attendance_${ymKey}`);
        if (raw) setAssignments(JSON.parse(raw));
        else setAssignments({});
      }
    } catch {}
  }, [ymKey]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem(`attendance_${ymKey}`, JSON.stringify(assignments));
    } catch {}
  }, [assignments, ymKey]);

  const days = useMemo(() => {
    const y = current.getFullYear();
    const m = current.getMonth();
    const first = new Date(y, m, 1);
    const startDay = (first.getDay() + 6) % 7;
    const lastDate = new Date(y, m + 1, 0).getDate();
    const cells: { date: Date | null; key: string }[] = [];
    for (let i = 0; i < startDay; i++) cells.push({ date: null, key: `pad-${i}` });
    for (let d = 1; d <= lastDate; d++) cells.push({ date: new Date(y, m, d), key: `d-${d}` });
    const tail = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < tail; i++) cells.push({ date: null, key: `trail-${i}` });
    return cells;
  }, [current]);

  const nextMonth = () => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const prevMonth = () => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));

  const getName = (g: any) => {
    const getValue = (slugs: string[], fallback: any = null) => {
      for (const s of slugs) {
        const v = (g.values || []).find((x: any) => x.fieldSlug === s);
        if (v) return v.value;
      }
      return fallback;
    };
    return String(getValue(["name", "vorname", "titel"], ""));
  };
  const getThumb = (g: any): string | null => {
    const galleryVal = (g.values || []).find((v: any) => Array.isArray(v.value) && v.value.length && typeof v.value[0] === "object" && "url" in v.value[0]);
    if (!galleryVal) return null;
    const arr = galleryVal.value as any[];
    const cover = arr.find((it) => it && typeof it === "object" && it.cover && it.url);
    return (cover?.url as string) || (arr[0]?.url ?? null);
  };

  const onDragStart = (e: React.DragEvent, girlId: string) => {
    e.dataTransfer.setData("text/plain", girlId);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDayDrop = (dateStr: string, girlId: string) => {
    setAssignments((prev) => {
      const cur = prev[dateStr] || [];
      if (cur.includes(girlId)) return prev;
      return { ...prev, [dateStr]: [...cur, girlId] };
    });
  };
  const onRemove = (dateStr: string, girlId: string) => {
    setAssignments((prev) => {
      const cur = prev[dateStr] || [];
      return { ...prev, [dateStr]: cur.filter((id) => id !== girlId) };
    });
  };

  const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return (
    <div className="p-4 md:p-0">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">Anwesenheit</h1>
        <p className="text-sm text-gray-600">Kalender links, Girls rechts. Per Drag & Drop planen.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="px-3 py-1.5 rounded-md border border-white/10 bg-[var(--admin-sidebar-bg)] text-white hover:bg-[var(--admin-sidebar-hover)] shadow-sm">Zurück</button>
            <div className="text-sm font-medium text-gray-900">{current.toLocaleString(undefined, { month: "long", year: "numeric" })}</div>
            <button onClick={nextMonth} className="px-3 py-1.5 rounded-md border border-white/10 bg-[var(--admin-sidebar-bg)] text-white hover:bg-[var(--admin-sidebar-hover)] shadow-sm">Weiter</button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-xs text-gray-600 mb-2">
            {['Mo','Di','Mi','Do','Fr','Sa','So'].map((d) => (
              <div key={d} className="px-2 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map(({ date, key }) =>
              date ? (
                <div
                  key={key}
                  className="min-h-[100px] border border-gray-200 rounded-md bg-white p-2 flex flex-col gap-2"
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                  onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) onDayDrop(dayKey(date), id); }}
                >
                  <div className="text-[11px] text-gray-500">{date.getDate()}</div>
                  <div className="flex flex-col gap-2">
                    {(assignments[dayKey(date)] || []).map((gid) => {
                      const g = girls.find((x) => x.id === gid);
                      const name = g ? getName(g) : gid;
                      const thumb = g ? getThumb(g) : null;
                      return (
                        <div key={gid} className="flex items-center gap-2 px-2 py-1 rounded border border-gray-200 bg-gray-50">
                          <div className="h-6 w-6 overflow-hidden rounded bg-gray-100 ring-1 ring-gray-200 flex-shrink-0">
                            {thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={thumb} alt="thumb" className="h-6 w-6 object-cover" />
                            ) : (
                              <div className="h-6 w-6 text-[9px] text-gray-400 flex items-center justify-center">img</div>
                            )}
                          </div>
                          <div className="text-xs text-gray-800 truncate">{name}</div>
                          <button onClick={() => onRemove(dayKey(date), gid)} className="ml-auto text-[11px] text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div key={key} className="min-h-[100px]" />
              )
            )}
          </div>
        </div>
        <div className="lg:col-span-1 bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-sm font-semibold text-gray-900 mb-3">Girls</div>
          {loading && <div className="text-sm text-gray-600">Lade…</div>}
          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
          <div className="flex flex-col gap-2 max-h-[70vh] overflow-auto pr-1">
            {girls.map((g) => {
              const name = getName(g);
              const thumb = getThumb(g);
              return (
                <div
                  key={g.id}
                  className="flex items-center gap-2 px-2 py-1 rounded border border-gray-200 bg-white cursor-move"
                  draggable
                  onDragStart={(e) => onDragStart(e, g.id)}
                  title={name}
                >
                  <div className="h-8 w-8 overflow-hidden rounded bg-gray-100 ring-1 ring-gray-200 flex-shrink-0">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="thumb" className="h-8 w-8 object-cover" />
                    ) : (
                      <div className="h-8 w-8 text-[10px] text-gray-400 flex items-center justify-center">img</div>
                    )}
                  </div>
                  <div className="text-sm text-gray-800 truncate">{name || g.id}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
