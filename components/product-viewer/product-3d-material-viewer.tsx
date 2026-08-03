"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { MaterialOption } from "@/types/product";

/**
 * R3F needs a real WebGL <canvas> and browser-only APIs, so the whole tree
 * is loaded client-side only via next/dynamic (ssr: false) — importing
 * three.js during SSR would throw.
 */
const R3FCanvas = dynamic(() => import("./r3f-canvas").then((m) => m.R3FCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-border bg-surface-secondary">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  ),
});

interface Product3DMaterialViewerProps {
  modelUrl: string;
  materialOptions: MaterialOption[];
  alt: string;
}

/**
 * Real-time material/color switcher using React Three Fiber + drei's
 * useGLTF loader. Unlike the default `<model-viewer>` path (which swaps to
 * a different model file per variant), this walks the loaded GLTF's mesh
 * materials by name and mutates `material.color` / `roughness` /
 * `metalness` directly on the live Three.js scene graph — the model never
 * reloads when switching colors, matching Section 12 of the spec.
 */
export function Product3DMaterialViewer({ modelUrl, materialOptions, alt }: Product3DMaterialViewerProps) {
  const [selected, setSelected] = useState<MaterialOption | null>(materialOptions[0] ?? null);

  return (
    <div>
      <R3FCanvas modelUrl={modelUrl} alt={alt} activeMaterial={selected} />
      <div className="mt-3 flex flex-wrap gap-2">
        {materialOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt)}
            aria-pressed={selected?.id === opt.id}
            title={opt.name}
            className={`relative h-9 w-9 rounded-full border-2 transition-transform focus-ring ${
              selected?.id === opt.id ? "scale-110 border-primary" : "border-border hover:border-primary/50"
            }`}
            style={{ backgroundColor: opt.color }}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        เปลี่ยนสีแบบเรียลไทม์ด้วย React Three Fiber — ไม่ต้องโหลดโมเดลใหม่
      </p>
    </div>
  );
}
