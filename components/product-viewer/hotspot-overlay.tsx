"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { ProductHotspot } from "@/types/product";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

/**
 * Positions hotspots using normalized [-0.5, 0.5] x/y coordinates projected
 * onto the flat viewer plane. This is a simplified 2D projection (not a true
 * 3D-to-screen camera projection) so it works reliably without wiring into
 * <model-viewer>'s internal camera math — sufficient for a first version.
 * Swap for `viewer.queryHotspot` / true screen-space projection when
 * migrating to a custom React Three Fiber viewer.
 */
export function HotspotOverlay({ hotspots }: { hotspots: ProductHotspot[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const visible = hotspots.filter((h) => h.isActive);

  return (
    <div className="pointer-events-none absolute inset-0">
      {visible.map((hotspot, index) => {
        const left = 50 + hotspot.position.x * 60;
        const top = 50 - hotspot.position.y * 60;
        const isActive = activeId === hotspot.id;

        return (
          <div
            key={hotspot.id}
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <button
              onClick={() => {
                const next = !isActive;
                setActiveId(next ? hotspot.id : null);
                if (next) track("product_hotspot_click", { hotspotId: hotspot.id, title: hotspot.title });
              }}
              aria-label={`จุดสำคัญ: ${hotspot.title}`}
              aria-expanded={isActive}
              className={cn(
                "relative flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold shadow-soft transition-transform focus-ring",
                isActive
                  ? "scale-110 border-primary bg-primary text-white"
                  : "border-primary/70 bg-background/90 text-primary"
              )}
            >
              {!isActive && (
                <span className="absolute inset-0 animate-pulse-soft rounded-full bg-primary/30" />
              )}
              <span className="relative">{index + 1}</span>
            </button>

            {isActive && (
              <div className="absolute left-1/2 top-9 z-20 w-56 -translate-x-1/2 rounded-xl border border-border bg-surface p-3 text-left shadow-soft glass-surface">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h4 className="text-xs font-semibold text-foreground">{hotspot.title}</h4>
                  <button
                    onClick={() => setActiveId(null)}
                    aria-label="ปิด"
                    className="text-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-muted">{hotspot.description}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
