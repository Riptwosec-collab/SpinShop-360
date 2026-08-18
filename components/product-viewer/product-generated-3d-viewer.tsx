"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Maximize, Minimize, RefreshCw, RotateCw } from "lucide-react";
import type {
  GeneratedProductModelKind,
  Product3DColorOption,
} from "@/lib/product-3d-assets";

const GeneratedProductCanvas = dynamic(
  () => import("./generated-product-canvas").then((module) => module.GeneratedProductCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-secondary">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-xs text-muted">กำลังสร้างโมเดลสินค้า 3D...</p>
      </div>
    ),
  }
);

const KIND_LABELS: Record<GeneratedProductModelKind, string> = {
  keyboard: "Mechanical Keyboard 3D",
  smartphone: "Smartphone 3D",
  "gaming-chair": "Gaming Chair 3D",
  mecha: "Mecha Figure 3D",
};

export function ProductGenerated3DViewer({
  kind,
  alt,
  colors = [],
}: {
  kind: GeneratedProductModelKind;
  alt: string;
  colors?: Product3DColorOption[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewKey, setViewKey] = useState(0);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(colors[0]?.id ?? null);

  useEffect(() => {
    setSelectedColorId(colors[0]?.id ?? null);
  }, [kind, colors]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const selectedColor = useMemo(
    () => colors.find((option) => option.id === selectedColorId)?.color ?? null,
    [colors, selectedColorId]
  );

  async function toggleFullscreen() {
    const element = containerRef.current;
    if (!element) return;
    if (document.fullscreenElement) await document.exitFullscreen?.();
    else await element.requestFullscreen?.();
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_50%_42%,rgba(66,153,225,0.14),transparent_42%),linear-gradient(145deg,var(--surface-secondary),var(--surface))] shadow-[0_20px_55px_-38px_rgba(17,108,255,0.5)]"
        aria-label={`โมเดล 3D ของ ${alt}`}
      >
        <GeneratedProductCanvas
          key={`${kind}-${viewKey}`}
          kind={kind}
          color={selectedColor}
          autoRotate={autoRotate}
        />

        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full border border-border/80 bg-background/75 px-3 py-1.5 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-xl">
          <Box className="h-3.5 w-3.5 text-primary" />
          {KIND_LABELS[kind]}
        </div>

        <div className="pointer-events-none absolute bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-[10px] text-muted backdrop-blur-xl">
          ลากเพื่อหมุน · เลื่อนเพื่อซูม · ดูได้ทุกมุม
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <ToolbarButton
              active={autoRotate}
              onClick={() => setAutoRotate((value) => !value)}
              label={autoRotate ? "หยุดหมุนอัตโนมัติ" : "หมุนอัตโนมัติ"}
              icon={RotateCw}
            />
            <ToolbarButton
              onClick={() => setViewKey((value) => value + 1)}
              label="รีเซ็ตมุมมอง"
              icon={RefreshCw}
            />
          </div>
          <ToolbarButton
            onClick={toggleFullscreen}
            label={isFullscreen ? "ออกจากเต็มจอ" : "เต็มจอ"}
            icon={isFullscreen ? Minimize : Maximize}
          />
        </div>
      </div>

      {colors.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
          <span className="mr-1 text-[11px] font-semibold text-muted">สีโมเดล</span>
          {colors.map((option) => {
            const selected = selectedColorId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedColorId(option.id)}
                aria-pressed={selected}
                aria-label={`เปลี่ยนสีโมเดลเป็น ${option.name}`}
                title={option.name}
                className={`focus-ring flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium transition-all ${
                  selected
                    ? "border-primary bg-primary/8 text-primary"
                    : "border-border text-muted hover:border-primary/35 hover:text-foreground"
                }`}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-inner"
                  style={{ backgroundColor: option.color }}
                />
                {option.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  label,
  icon: Icon,
  active,
}: {
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`focus-ring flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm backdrop-blur-xl transition-colors ${
        active
          ? "border-primary/45 bg-primary/15 text-primary"
          : "border-border/80 bg-background/75 text-foreground hover:border-primary/35"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
