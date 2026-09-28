"use client";

import { useEffect, useId, useState } from "react";
import { Image as ImageIcon, RotateCw, Box, Ruler } from "lucide-react";
import type { Product, ViewerMode } from "@/types/product";
import { ImageGallery } from "./image-gallery";
import { Product360Viewer } from "./product-360-viewer";
import { Product3DViewer } from "./product-3d-viewer";
import { useProductSelection } from "./product-selection";
import { useStudioMessages } from "./studio-messages";
import { cn } from "@/lib/utils";
import { resolveProductModelUrl } from "@/lib/product-model";
import { track } from "@/lib/analytics";

const SESSION_KEY = "spinshop360-viewer-mode";

export function ProductViewer({ product }: { product: Product }) {
  const t = useStudioMessages();
  const id = useId();
  const { selected, setSelected, activeVariant } = useProductSelection(product);
  const modelUrl = resolveProductModelUrl(activeVariant?.modelUrl || product.modelGlbUrl, product.slug);
  const imageUrl = activeVariant?.imageUrl || product.fallbackImageUrl;
  const colorOption = product.options.find((option) => option.displayType === "color");
  const selectedColor = colorOption?.values.find((value) => value.id === selected[colorOption.id]);
  const matchedMaterial = product.materialOptions?.find((material) =>
    material.color.toLowerCase() === selectedColor?.colorHex?.toLowerCase() || material.name === selectedColor?.value);
  const [finishId, setFinishId] = useState<string | null>(null);
  const activeMaterial = matchedMaterial ?? (!colorOption ? product.materialOptions?.find((material) => material.id === finishId) : undefined);
  const availableModes: ViewerMode[] = ["image",
    ...(product.supports360 && product.threeSixty?.frames.length ? ["360" as const] : []),
    ...((product.supports3d || activeVariant?.modelUrl) && modelUrl ? ["3d" as const] : []),
  ];
  const [mode, setMode] = useState<ViewerMode>("image");
  const currentMode = availableModes.includes(mode) ? mode : "image";
  const [showDimensions, setShowDimensions] = useState(false);
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const dimensions = product.dimensions;
  const hasDimensions = dimensions && [dimensions.widthCm, dimensions.heightCm, dimensions.depthCm].every((value) => Number.isFinite(value) && value > 0);
  const formatLength = (value: number) => Number((unit === "cm" ? value : value / 2.54).toFixed(2));
  const isSample = !!(modelUrl?.startsWith("/models/demo/") || modelUrl?.includes("modelviewer.dev/shared-assets/models/"));
  const images = activeVariant?.imageUrl
    ? [{ id: activeVariant.id, productId: product.id, url: activeVariant.imageUrl, altText: product.name, sortOrder: 0, isPrimary: true }, ...product.images.filter((image) => image.url !== activeVariant.imageUrl)]
    : product.images.length ? product.images : [{ id: "fallback", productId: product.id, url: product.fallbackImageUrl, altText: product.name, sortOrder: 0, isPrimary: true }];

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(SESSION_KEY) as ViewerMode | null;
      setMode(stored && availableModes.includes(stored) ? stored : "image");
    } catch { /* Session preferences are optional. */ }
    track("product_view", { productId: product.id, productName: product.name });
    // Preferences are restored once per product, never during variant selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  function selectMode(next: ViewerMode) {
    setMode(next);
    try { window.sessionStorage.setItem(SESSION_KEY, next); } catch { /* Optional storage. */ }
    const events = { "3d": "product_3d_open", "360": "product_360_open" } as const;
    if (next !== "image") track(events[next], { productId: product.id, productName: product.name });
  }
  const modeMeta = { image: { label: t.image, icon: ImageIcon }, "360": { label: t.spin, icon: RotateCw }, "3d": { label: t.model, icon: Box } };

  return (
    <section className="min-w-0" aria-label={t.title}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t.title}</p><p className="mt-1 text-sm text-muted">{t.subtitle}</p></div>
        <button type="button" aria-expanded={showDimensions} aria-controls={`${id}-dimensions`} onClick={() => setShowDimensions((value) => !value)} className={cn("focus-ring flex min-h-11 items-center gap-2 rounded-xl border px-3 text-xs", showDimensions ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted")}><Ruler className="h-4 w-4" />{t.dimensions}</button>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label={t.modes}>
        {availableModes.map((item, index) => {
          const { label, icon: Icon } = modeMeta[item];
          return <button key={item} id={`${id}-${item}`} type="button" role="tab" aria-controls={`${id}-panel`} aria-selected={currentMode === item} tabIndex={currentMode === item ? 0 : -1} onClick={() => selectMode(item)} onKeyDown={(event) => {
            if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? availableModes.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + availableModes.length) % availableModes.length;
            selectMode(availableModes[nextIndex]);
            document.getElementById(`${id}-${availableModes[nextIndex]}`)?.focus();
          }} className={cn("focus-ring flex min-h-11 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors", currentMode === item ? "border-primary/50 bg-primary/15 text-primary" : "border-border bg-surface text-muted hover:text-foreground")}><Icon className="h-4 w-4" />{label}</button>;
        })}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${currentMode}`}>
        {currentMode === "image" && <ImageGallery key={activeVariant?.id ?? product.id} images={images} alt={product.name} />}
        {currentMode === "360" && product.threeSixty && <Product360Viewer frames={product.threeSixty.frames} alt={product.name} />}
        {(currentMode === "3d") && modelUrl && <Product3DViewer key={modelUrl} modelUrl={modelUrl} alt={product.name} fallbackImageUrl={imageUrl} hotspots={product.hotspots.filter((hotspot) => !hotspot.variantId || hotspot.variantId === activeVariant?.id)} activeMaterial={activeMaterial} />}
      </div>
      {(currentMode === "3d") && isSample && <p className="mt-3 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs leading-relaxed text-muted">{t.sample}</p>}
      {showDimensions && <div id={`${id}-dimensions`} className="mt-3 rounded-xl border border-primary/25 bg-primary/5 p-4" role="region" aria-label={t.dimensions}>
        {hasDimensions ? <><div className="flex items-center justify-between gap-3"><span className="text-xs text-muted">{t.dimensionOrder}</span><div className="flex gap-1">{(["cm", "in"] as const).map((value) => <button type="button" key={value} aria-pressed={unit === value} onClick={() => setUnit(value)} className={cn("focus-ring min-h-9 rounded-lg px-3 text-xs", unit === value ? "bg-primary text-white" : "text-muted")}>{value}</button>)}</div></div><p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{[dimensions.widthCm, dimensions.heightCm, dimensions.depthCm].map(formatLength).join(" × ")} {unit}</p><p className="mt-2 text-xs text-muted">{t.dimensionNote}</p></> : <p className="text-sm text-muted">{t.unknownDimensions}</p>}
      </div>}
      {colorOption && <div className="mt-4 rounded-xl border border-border bg-surface p-4"><p className="mb-3 text-xs text-muted">{t.selected}{selectedColor ? ` · ${selectedColor.value}` : ""}</p><div className="flex flex-wrap gap-2">{colorOption.values.map((value) => {
        const ids = Object.values({ ...selected, [colorOption.id]: value.id });
        const available = product.variants.some((variant) => variant.isActive && variant.stockQuantity > 0 && ids.every((id) => variant.optionValueIds.includes(id)));
        return <button key={value.id} type="button" aria-label={`${t.color}: ${value.value}`} aria-pressed={selected[colorOption.id] === value.id} disabled={!available} onClick={() => setSelected((prev) => ({ ...prev, [colorOption.id]: value.id }))} className={cn("focus-ring flex min-h-11 items-center gap-2 rounded-xl border px-3 text-xs disabled:opacity-40", selected[colorOption.id] === value.id ? "border-primary/60 bg-primary/10 text-foreground" : "border-border text-muted")}><span className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: value.colorHex ?? "#888" }} />{value.value}</button>;
      })}</div><p className="mt-3 text-xs leading-relaxed text-muted">{currentMode === "image" ? t.imageNote : t.materialNote}</p></div>}
      {!colorOption && product.materialOptions?.length && (currentMode === "3d") ? <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t.material}>{product.materialOptions.map((material) => <button key={material.id} type="button" aria-pressed={finishId === material.id} onClick={() => setFinishId(material.id)} className="focus-ring flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-xs text-foreground"><span className="h-5 w-5 rounded-full" style={{ backgroundColor: material.color }} />{material.name}</button>)}<p className="w-full text-xs text-muted">{t.materialNote}</p></div> : null}
    </section>
  );
}
