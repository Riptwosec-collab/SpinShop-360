"use client";

import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, RotateCw, Box, Smartphone, Palette } from "lucide-react";
import type { Product, ViewerMode } from "@/types/product";
import { ImageGallery } from "./image-gallery";
import { Product360Viewer } from "./product-360-viewer";
import { Product3DViewer } from "./product-3d-viewer";
import { Product3DMaterialViewer } from "./product-3d-material-viewer";
import { ProductGenerated3DViewer } from "./product-generated-3d-viewer";
import {
  getGeneratedProductModelKind,
  getProduct3DColorOptions,
  getRealProductModelUrl,
} from "@/lib/product-3d-assets";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

const SESSION_KEY = "spinshop360-viewer-mode";

type ExtendedViewerMode = ViewerMode | "material";

const MODE_META: Record<ExtendedViewerMode, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  image: { label: "รูปภาพ", icon: ImageIcon },
  "360": { label: "360° View", icon: RotateCw },
  "3d": { label: "3D View", icon: Box },
  ar: { label: "AR Try-On", icon: Smartphone },
  material: { label: "เปลี่ยนสี", icon: Palette },
};

export function ProductViewer({ product }: { product: Product }) {
  const realModelUrl = useMemo(() => getRealProductModelUrl(product), [product]);
  const generatedModelKind = useMemo(() => getGeneratedProductModelKind(product), [product]);
  const generatedColors = useMemo(() => getProduct3DColorOptions(product), [product]);

  const hasInteractive3D = Boolean(product.supports3d && (realModelUrl || generatedModelKind));
  const hasRealAr = Boolean(product.supportsAr && realModelUrl);

  const availableModes: ExtendedViewerMode[] = [
    "image",
    ...(product.supports360 && product.threeSixty ? (["360"] as const) : []),
    ...(hasInteractive3D ? (["3d"] as const) : []),
    ...(hasRealAr ? (["ar"] as const) : []),
    ...(product.materialOptions && product.materialOptions.length > 0 && realModelUrl
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
    // availableModes is derived from this product's immutable viewer capability data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  function selectMode(nextMode: ExtendedViewerMode) {
    setMode(nextMode);
    window.sessionStorage.setItem(SESSION_KEY, nextMode);
    const eventMap: Partial<Record<ExtendedViewerMode, "product_3d_open" | "product_360_open" | "product_ar_open">> = {
      "3d": "product_3d_open",
      "360": "product_360_open",
      ar: "product_ar_open",
    };
    const event = eventMap[nextMode];
    if (event) track(event, { productId: product.id, productName: product.name });
  }

  return (
    <div className="min-w-0">
      {availableModes.length > 1 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="เลือกรูปแบบการแสดงสินค้า">
          {availableModes.map((viewerMode) => {
            const { label, icon: Icon } = MODE_META[viewerMode];
            return (
              <button
                key={viewerMode}
                role="tab"
                aria-selected={mode === viewerMode}
                onClick={() => selectMode(viewerMode)}
                className={cn(
                  "focus-ring flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-semibold transition-all",
                  mode === viewerMode
                    ? "border-primary/35 bg-primary text-white shadow-[0_10px_20px_-14px_rgba(17,108,255,0.8)]"
                    : "border-border bg-surface text-muted hover:border-primary/25 hover:text-foreground"
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

      {mode === "3d" && generatedModelKind && (
        <ProductGenerated3DViewer
          kind={generatedModelKind}
          alt={product.name}
          colors={generatedColors}
        />
      )}

      {(mode === "3d" || mode === "ar") && !generatedModelKind && realModelUrl && (
        <Product3DViewer
          modelUrl={realModelUrl}
          usdzUrl={product.modelUsdzUrl}
          alt={product.name}
          fallbackImageUrl={product.fallbackImageUrl}
          hotspots={product.hotspots}
          supportsAr={hasRealAr}
        />
      )}

      {mode === "material" && realModelUrl && product.materialOptions && (
        <Product3DMaterialViewer
          modelUrl={realModelUrl}
          materialOptions={product.materialOptions}
          alt={product.name}
        />
      )}
    </div>
  );
}
