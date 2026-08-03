"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Plus, Eye, EyeOff, GripVertical } from "lucide-react";
import type { ProductHotspot } from "@/types/product";
import type { ModelViewerElement } from "@/types/model-viewer";
import { FieldRow } from "./form-blocks";

export interface HotspotDraft {
  id: string;
  title: string;
  description: string;
  position: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  isActive: boolean;
}

function fromProductHotspots(hotspots: ProductHotspot[]): HotspotDraft[] {
  return hotspots.map((h) => ({
    id: h.id,
    title: h.title,
    description: h.description,
    position: h.position,
    normal: h.normal ?? { x: 0, y: 1, z: 0 },
    isActive: h.isActive,
  }));
}

/**
 * Admin Hotspot Editor. Clicking directly on the rendered model uses
 * `<model-viewer>`'s real `positionAndNormalFromPoint(x, y)` method — a
 * genuine raycast against the loaded mesh, documented at
 * https://modelviewer.dev/docs/index.html#entrydocs-methods-positionAndNormalFromPoint
 * — to compute an accurate 3D position + surface normal from a 2D click,
 * rather than approximating position from click coordinates.
 */
export function HotspotEditor({
  modelUrl,
  initialHotspots,
  onSave,
}: {
  modelUrl: string;
  initialHotspots: ProductHotspot[];
  onSave?: (hotspots: HotspotDraft[]) => void | Promise<void>;
}) {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [hotspots, setHotspots] = useState<HotspotDraft[]>(() => fromProductHotspots(initialHotspots));
  const [placingMode, setPlacingMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleSaveClick() {
    if (!onSave) return;
    setSaving(true);
    await onSave(hotspots);
    setSaving(false);
  }

  useEffect(() => {
    import("@google/model-viewer").then(() => setScriptReady(true));
  }, []);

  function handleModelClick(e: React.MouseEvent<HTMLElement>) {
    if (!placingMode) return;
    const viewer = viewerRef.current as unknown as {
      positionAndNormalFromPoint?: (x: number, y: number) => { position: { x: number; y: number; z: number }; normal: { x: number; y: number; z: number } } | null;
    };
    if (!viewer?.positionAndNormalFromPoint) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = viewer.positionAndNormalFromPoint(x, y);

    if (!hit) return; // Click missed the model geometry entirely.

    const newHotspot: HotspotDraft = {
      id: `draft-${Date.now()}`,
      title: `จุดใหม่ ${hotspots.length + 1}`,
      description: "",
      position: hit.position,
      normal: hit.normal,
      isActive: true,
    };
    setHotspots((prev) => [...prev, newHotspot]);
    setSelectedId(newHotspot.id);
    setPlacingMode(false);
  }

  function updateHotspot(id: string, patch: Partial<HotspotDraft>) {
    setHotspots((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }

  function removeHotspot(id: string) {
    setHotspots((prev) => prev.filter((h) => h.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  const selected = hotspots.find((h) => h.id === selectedId);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">
            {placingMode ? "คลิกบนโมเดลเพื่อวางจุดใหม่" : "คลิก \"เพิ่มจุด\" แล้วคลิกตำแหน่งบนโมเดล"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="focus-ring flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPreview ? "ซ่อนตัวอย่าง" : "แสดงตัวอย่าง"}
            </button>
            <button
              type="button"
              onClick={() => setPlacingMode((v) => !v)}
              className={`focus-ring flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                placingMode ? "border-primary bg-primary/15 text-primary" : "border-border text-foreground hover:border-primary/40"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              {placingMode ? "กำลังวางจุด..." : "เพิ่มจุด"}
            </button>
          </div>
        </div>

        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface-secondary">
          {!scriptReady && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">กำลังโหลด...</div>
          )}
          {scriptReady && (
            // eslint-disable-next-line react/no-unknown-property
            <model-viewer
              ref={viewerRef as unknown as React.RefObject<HTMLElement>}
              src={modelUrl}
              alt="ตัวอย่างโมเดลสำหรับวาง Hotspot"
              camera-controls
              touch-action="pan-y"
              shadow-intensity="1"
              environment-image="neutral"
              exposure="1"
              loading="eager"
              onLoad={() => setModelLoaded(true)}
              onClick={handleModelClick}
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "transparent",
                cursor: placingMode ? "crosshair" : "grab",
              }}
            >
              {modelLoaded &&
                showPreview &&
                hotspots.map((h, i) => (
                  <button
                    key={h.id}
                    slot={`hotspot-${h.id}`}
                    data-position={`${h.position.x}m ${h.position.y}m ${h.position.z}m`}
                    data-normal={`${h.normal.x}m ${h.normal.y}m ${h.normal.z}m`}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setSelectedId(h.id);
                    }}
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-semibold ${
                      selectedId === h.id ? "border-primary bg-primary text-white" : "border-primary/70 bg-white text-primary"
                    }`}
                    type="button"
                  >
                    {i + 1}
                  </button>
                ))}
            </model-viewer>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {onSave && (
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={saving}
            className="focus-ring rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : `บันทึก Hotspot (${hotspots.length} จุด)`}
          </button>
        )}
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            รายการจุดสำคัญ ({hotspots.length})
          </h3>
          {hotspots.length === 0 ? (
            <p className="text-xs text-muted">ยังไม่มีจุดสำคัญ กด &ldquo;เพิ่มจุด&rdquo; แล้วคลิกบนโมเดล</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {hotspots.map((h, i) => (
                <li key={h.id} className="flex items-center gap-2 py-2">
                  <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted" />
                  <button
                    type="button"
                    onClick={() => setSelectedId(h.id)}
                    className={`flex-1 truncate text-left text-xs ${selectedId === h.id ? "font-medium text-primary" : "text-foreground"}`}
                  >
                    {i + 1}. {h.title || "(ไม่มีชื่อ)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateHotspot(h.id, { isActive: !h.isActive })}
                    className="text-muted hover:text-foreground"
                    aria-label="เปิด/ปิดจุด"
                  >
                    {h.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeHotspot(h.id)}
                    className="text-muted hover:text-danger"
                    aria-label="ลบจุด"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">แก้ไขจุดที่เลือก</h3>
            <div className="flex flex-col gap-3">
              <FieldRow label="ชื่อจุด">
                <input
                  value={selected.title}
                  onChange={(e) => updateHotspot(selected.id, { title: e.target.value })}
                  className="input"
                />
              </FieldRow>
              <FieldRow label="รายละเอียด">
                <textarea
                  value={selected.description}
                  onChange={(e) => updateHotspot(selected.id, { description: e.target.value })}
                  className="input min-h-16"
                />
              </FieldRow>
              <div className="grid grid-cols-3 gap-2">
                <PositionField
                  label="X"
                  value={selected.position.x}
                  onChange={(v) => updateHotspot(selected.id, { position: { ...selected.position, x: v } })}
                />
                <PositionField
                  label="Y"
                  value={selected.position.y}
                  onChange={(v) => updateHotspot(selected.id, { position: { ...selected.position, y: v } })}
                />
                <PositionField
                  label="Z"
                  value={selected.position.z}
                  onChange={(v) => updateHotspot(selected.id, { position: { ...selected.position, z: v } })}
                />
              </div>
              <p className="text-[11px] text-muted">
                ตำแหน่งถูกคำนวณอัตโนมัติจากจุดที่คลิกบนโมเดล (raycast) — ปรับละเอียดเพิ่มเติมได้ที่นี่หากจำเป็น
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PositionField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] text-muted">{label}</span>
      <input
        type="number"
        step="0.01"
        value={value.toFixed(3)}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="input px-2 py-1.5 text-xs"
      />
    </label>
  );
}
