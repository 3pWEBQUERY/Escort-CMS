"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/app/admin/components/ToastProvider";
import MediaPicker from "@/app/admin/media/components/MediaPicker";

import InputField from "../create/components/fields/InputField";
import TextareaField from "../create/components/fields/TextareaField";
import NumberField from "../create/components/fields/NumberField";
import SelectField from "../create/components/fields/SelectField";
import SelectSearchField from "../create/components/fields/SelectSearchField";
import MultiselectField from "../create/components/fields/MultiselectField";
import GalleryField from "../create/components/fields/GalleryField";

export type GirlFieldType =
  | "SELECT"
  | "SELECT_SEARCH"
  | "MULTISELECT"
  | "INPUT"
  | "TEXTAREA"
  | "NUMBER"
  | "SECTION"
  | "GALLERY";

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

type GirlRecord = { id: string; values: { fieldSlug: string; value: any }[] };

export default function GirlEditPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [fields, setFields] = useState<GirlField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [values, setValues] = useState<Record<string, any>>({});
  const [pickerCfg, setPickerCfg] = useState<{ open: boolean; slug: string | null; multiple: boolean; maxItems: number | null }>({ open: false, slug: null, multiple: true, maxItems: null });

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [fRes, gRes] = await Promise.all([
        fetch("/api/girls/fields", { cache: "no-store" }),
        fetch(`/api/girls/${id}`, { cache: "no-store" }),
      ]);
      if (!fRes.ok) throw new Error("Felder konnten nicht geladen werden");
      if (!gRes.ok) throw new Error("Eintrag konnte nicht geladen werden");
      const fData = await fRes.json();
      const gData: GirlRecord = await gRes.json();
      setFields(fData.items || []);
      const rec: Record<string, any> = {};
      (gData.values || []).forEach((v: any) => { rec[v.fieldSlug] = v.value; });
      setValues(rec);
    } catch (e: any) {
      setError(e.message || "Unbekannter Fehler");
      showToast({ variant: "error", title: "Fehler", message: e.message || "Konnte Daten nicht laden" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sections = useMemo(() => fields.filter(f => f.type === "SECTION").sort((a,b)=>a.order-b.order), [fields]);
  const topLevel = useMemo(() => fields.filter(f => (f.parentId == null) && f.type !== "SECTION").sort((a,b)=>a.order-b.order), [fields]);
  const childrenByParent = useMemo(() => {
    const map: Record<string, GirlField[]> = {};
    fields.filter(f => f.parentId && f.type !== "SECTION").forEach(f => {
      if (!map[f.parentId!]) map[f.parentId!] = [];
      map[f.parentId!].push(f);
    });
    Object.keys(map).forEach(id => map[id].sort((a,b)=>a.order-b.order));
    return map;
  }, [fields]);

  const setValue = (slug: string, val: any) => setValues(prev => ({ ...prev, [slug]: val }));

  const validate = () => {
    const missing: string[] = [];
    fields.forEach(f => {
      if (f.type !== "SECTION" && f.required) {
        const v = values[f.slug];
        const empty = v == null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);
        if (empty) missing.push(f.name);
      }
    });
    if (missing.length) {
      showToast({ variant: "error", title: "Pflichtfelder fehlen", message: missing.join(", ") });
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      const res = await fetch(`/api/girls/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values }) });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      showToast({ variant: "success", title: "Gespeichert", message: "Eintrag aktualisiert." });
      router.push("/admin/girls");
    } catch (e: any) {
      showToast({ variant: "error", title: "Fehler", message: e.message || "Speichern fehlgeschlagen" });
    }
  };

  const openPicker = (slug: string, maxItems: number | null) => {
    setPickerCfg({ open: true, slug, multiple: true, maxItems });
  };

  return (
    <div className="p-4 md:p-0">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">Girl bearbeiten</h1>
        <p className="text-sm text-gray-600">Passe die Felder an und speichere den Eintrag.</p>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        {loading && <div className="text-sm text-gray-600">Lade…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && topLevel.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topLevel.map((f) => {
              const span = Math.min(Math.max(Number(f.colSpan || 1), 1), 3);
              const cls = span === 3 ? "md:col-span-3" : span === 2 ? "md:col-span-2" : "";
              return (
                <div key={f.id} className={cls}>
                  <FieldRenderer field={f} value={values[f.slug]} setValue={(v)=>setValue(f.slug, v)} onOpenPicker={openPicker} />
                </div>
              );
            })}
          </div>
        )}

        {sections.map((s) => {
          const cols = Number(s.containerColumns || 1);
          const gridCls = cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3";
          const children = childrenByParent[s.id] || [];
          return (
            <div key={s.id} className="border border-gray-200 rounded-lg bg-white">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-900 flex items-center gap-2">
                <span className="text-gray-400">#</span>
                {s.name}
              </div>
              <div className={`p-4 grid gap-4 ${gridCls}`}>
                {children.map((f) => {
                  const span = Math.min(Math.max(Number(f.colSpan || 1), 1), 3);
                  const spanCls = cols === 1 ? "" : cols === 2 ? (span === 2 ? "md:col-span-2" : "") : span === 3 ? "md:col-span-3" : span === 2 ? "md:col-span-2" : "";
                  return (
                    <div key={f.id} className={spanCls}>
                      <FieldRenderer field={f} value={values[f.slug]} setValue={(v)=>setValue(f.slug, v)} onOpenPicker={openPicker} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="flex justify-end">
          <button onClick={onSubmit} className="px-4 py-2 rounded-md text-white bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)]">Speichern</button>
        </div>
      </div>

      <MediaPicker
        open={pickerCfg.open}
        onClose={() => setPickerCfg(prev => ({ ...prev, open: false }))}
        multiple
        maxItems={pickerCfg.maxItems ?? null}
        onSelect={(picked) => {
          const items = Array.isArray(picked) ? picked : [picked];
          if (pickerCfg.slug) setValue(pickerCfg.slug, items);
        }}
      />
    </div>
  );
}

function FieldRenderer({ field, value, setValue, onOpenPicker }: { field: GirlField; value: any; setValue: (v:any)=>void; onOpenPicker: (slug: string, maxItems: number | null)=>void }) {
  const common = { label: field.name, required: field.required, helpText: field.helpText || null, placeholder: field.placeholder || undefined } as const;
  if (field.type === "INPUT") return <InputField {...common} value={value ?? ""} onChange={setValue} />;
  if (field.type === "TEXTAREA") return <TextareaField {...common} value={value ?? ""} onChange={setValue} />;
  if (field.type === "NUMBER") return <NumberField {...common} value={value ?? ""} onChange={setValue} />;
  if (field.type === "SELECT") return <SelectField {...common} value={value ?? ""} onChange={setValue} options={Array.isArray(field.options) ? field.options : []} />;
  if (field.type === "SELECT_SEARCH") return <SelectSearchField {...common} value={value ?? ""} onChange={setValue} options={Array.isArray(field.options) ? field.options : []} />;
  if (field.type === "MULTISELECT") return <MultiselectField {...common} value={Array.isArray(value) ? value : []} onChange={setValue} options={Array.isArray(field.options) ? field.options : []} />;
  if (field.type === "GALLERY") return <GalleryField {...common} value={Array.isArray(value) ? value : []} onChange={setValue} onOpenPicker={() => onOpenPicker(field.slug, typeof field.options === 'object' ? (field.options?.maxItems ?? null) : null)} />;
  return <div className="text-sm text-gray-500">Nicht unterstützter Typ: {field.type}</div>;
}
