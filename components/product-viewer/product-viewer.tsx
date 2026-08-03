"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, RotateCw, Box, Smartphone, Palette } from "lucide-react";
import type { Product, ViewerMode } from "@/types/product";
import { ImageGallery } from "./image-gallery";
import { Product360Viewer } from "./product-360-viewer";
import { Product3DViewer } from "./product-3d-viewer";
import { Product3DMaterialViewer } from "./product-3d-material-viewer";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

const SESSION_KEY = "spinshop360-viewer-mode";

type ExtendedViewerMode = ViewerMode | "material";

const MODE_META: Record<ExtendedViewerMode, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  image: { label: "รูปภาพ", icon: ImageIcon },
  "360": { label: "ดู 360°", icon: RotateCw },
  "3d": { label: "ดูแบบ 3D", icon: Box },
  ar: { label: "ดูในพื้นที่จริง", icon: Smartphone },
  material: { label: "เปลี่ยนสีแบบเรียลไทม์", icon: Palette },
};

export function ProductViewer({ product }: { product: Product }) {
  const availableModes: ExtendedViewerMode[] = [
    "image",
    ...(product.supports360 && product.threeSixty ? (["360"] as const) : []),
    ...(product.supports3d && product.modelGlbUrl ? (["3d"] as const) : []),
    ...(product.supportsAr && product.modelGlbUrl ? (["ar"] as const) : []),
    ...(product.materialOptions && product.materialOptions.length > 0 && product.modelGlbUrl
      ? (["material"] as const)
      : []),
  ];

  const [mode, setMode] = useState<ExtendedViewerMode>("image");

  useEffect(() => {
    const stored = window.sessionStorage.getItem(SESSION_KEY) as ExtendedViewerMode | null;
    if (stored && availableModes.includes(stored)) {
      setMode(stored);
    } else {
      setMode(availableModes[0]);
    }
    track("product_view", { productId: product.id, productName: product.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  function selectMode(m: ExtendedViewerMode) {
    setMode(m);
    window.sessionStorage.setItem(SESSION_KEY, m);
    const eventMap: Partial<Record<ExtendedViewerMode, "product_3d_open" | "product_360_open" | "product_ar_open">> = {
      "3d": "product_3d_open",
      "360": "product_360_open",
      ar: "product_ar_open",
    };
    const event = eventMap[m];
    if (event) track(event, { productId: product.id, productName: product.name });
  }

  return (
    <div>
      {availableModes.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="เลือกรูปแบบการแสดงสินค้า">
          {availableModes.map((m) => {
            const { label, icon: Icon } = MODE_META[m];
            return (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => selectMode(m)}
                className={cn(
                  "focus-ring flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  mode === m
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border bg-surface text-muted hover:border-primary/30 hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      )}

      {mode === "image" && <ImageGallery images={product.images} alt={product.name} />}

      {mode === "360" && product.threeSixty && (
        <Product360Viewer frames={product.threeSixty.frames} alt={product.name} />
      )}

      {(mode === "3d" || mode === "ar") && product.modelGlbUrl && (
        <Product3DViewer
          modelUrl={product.modelGlbUrl}
          usdzUrl={product.modelUsdzUrl}
          alt={product.name}
          fallbackImageUrl={product.fallbackImageUrl}
          hotspots={product.hotspots}
          supportsAr={product.supportsAr}
        />
      )}

      {mode === "material" && product.modelGlbUrl && product.materialOptions && (
        <Product3DMaterialViewer
          modelUrl={product.modelGlbUrl}
          materialOptions={product.materialOptions}
          alt={product.name}
        />
      )}
    </div>
  );
}
