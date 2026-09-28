"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { RotateCw, Maximize, Minimize, RefreshCw, Smartphone } from "lucide-react";
import type { MaterialOption, ProductHotspot } from "@/types/product";
import type { ModelViewerElement } from "@/types/model-viewer";
import { useStudioMessages } from "./studio-messages";
import { cn } from "@/lib/utils";

interface Product3DViewerProps {
  modelUrl: string;
  usdzUrl?: string | null;
  alt: string;
  fallbackImageUrl: string;
  hotspots?: ProductHotspot[];
  supportsAr?: boolean;
  activeMaterial?: MaterialOption | null;
}

type Viewer = ModelViewerElement & { activateAR: () => Promise<void> };

export function Product3DViewer({ modelUrl, usdzUrl, alt, fallbackImageUrl, hotspots = [], supportsAr = false, activeMaterial }: Product3DViewerProps) {
  const t = useStudioMessages();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [background, setBackground] = useState("neutral");
  const [exposure, setExposure] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [canAr, setCanAr] = useState(false);
  const [arError, setArError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    setModelLoaded(false);
    setProgress(0);
    setCanAr(false);
    import("@google/model-viewer").then(() => { if (active) setScriptReady(true); }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [modelUrl, attempt]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !scriptReady || loadError) return;
    const loaded = () => { setModelLoaded(true); setProgress(100); setCanAr(supportsAr && viewer.canActivateAR); };
    const failed = () => setLoadError(true);
    const progressChanged = (event: Event) => setProgress(Math.round(((event as CustomEvent<{ totalProgress: number }>).detail?.totalProgress ?? 0) * 100));
    const arChanged = (event: Event) => {
      setCanAr(supportsAr && viewer.canActivateAR);
      if ((event as CustomEvent<{ status?: string }>).detail?.status === "failed") setArError(true);
    };
    viewer.addEventListener("load", loaded);
    viewer.addEventListener("error", failed);
    viewer.addEventListener("progress", progressChanged);
    viewer.addEventListener("ar-status", arChanged);
    return () => { viewer.removeEventListener("load", loaded); viewer.removeEventListener("error", failed); viewer.removeEventListener("progress", progressChanged); viewer.removeEventListener("ar-status", arChanged); };
  }, [scriptReady, modelUrl, attempt, supportsAr, loadError]);

  useEffect(() => {
    if (modelLoaded || loadError) return;
    const timeout = window.setTimeout(() => setLoadError(true), 25000);
    return () => window.clearTimeout(timeout);
  }, [modelLoaded, loadError, modelUrl, attempt]);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    if (!modelLoaded || !activeMaterial) return;
    const hex = activeMaterial.color.replace("#", "");
    const full = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
    if (!/^[\da-f]{6}$/i.test(full)) return;
    const rgba: [number, number, number, number] = [parseInt(full.slice(0, 2), 16) / 255, parseInt(full.slice(2, 4), 16) / 255, parseInt(full.slice(4, 6), 16) / 255, 1];
    viewerRef.current?.model?.materials.forEach((material) => {
      if (activeMaterial.targetMaterialName && material.name !== activeMaterial.targetMaterialName) return;
      material.pbrMetallicRoughness.setBaseColorFactor(rgba);
      if (activeMaterial.roughness != null) material.pbrMetallicRoughness.setRoughnessFactor(activeMaterial.roughness);
      if (activeMaterial.metalness != null) material.pbrMetallicRoughness.setMetallicFactor(activeMaterial.metalness);
    });
  }, [activeMaterial, modelLoaded]);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
      else await containerRef.current?.requestFullscreen?.();
    } catch { /* Fullscreen is optional; the inline preview remains usable. */ }
  }

  if (loadError) return <div><FallbackImage imageUrl={fallbackImageUrl} alt={alt} message={t.failed} /><button type="button" onClick={() => { setLoadError(false); setAttempt((value) => value + 1); }} className="focus-ring mt-3 flex min-h-11 items-center gap-2 rounded-xl border border-primary/40 px-4 text-sm text-primary"><RefreshCw className="h-4 w-4" />{t.retry}</button></div>;

  return <div ref={containerRef} className="rounded-2xl bg-background">
    <div className={cn("relative aspect-square w-full overflow-hidden rounded-2xl border border-border", background === "dark" ? "bg-[#101827]" : background === "light" ? "bg-[#e6edf2]" : "bg-surface-secondary")}>
      {!modelLoaded && <div role="status" className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface-secondary"><div className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-primary motion-reduce:animate-none" /><p className="text-sm text-muted">{t.loading}</p><p className="text-xs text-muted">{progress}%</p></div>}
      {scriptReady && <model-viewer key={`${modelUrl}-${attempt}`} ref={viewerRef as unknown as React.RefObject<HTMLElement>} src={modelUrl} alt={alt} poster={fallbackImageUrl} {...(supportsAr ? { ar: true, "ios-src": usdzUrl ?? undefined } : {})} ar-modes="webxr scene-viewer quick-look" camera-controls touch-action="pan-y" auto-rotate={autoRotate || undefined} shadow-intensity="1" environment-image="neutral" exposure={exposure} loading="eager" reveal="auto" style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}><span slot="ar-button" /></model-viewer>}
      {modelLoaded && <p className="pointer-events-none absolute left-3 right-3 top-3 w-fit rounded-full border border-border bg-background/80 px-3 py-1.5 text-[11px] text-muted backdrop-blur-glass">{t.drag}</p>}
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      <ToolbarButton disabled={!modelLoaded} active={autoRotate} onClick={() => setAutoRotate((value) => !value)} label={autoRotate ? t.pause : t.rotate} icon={RotateCw} />
      <ToolbarButton disabled={!modelLoaded} onClick={() => { if (viewerRef.current) { viewerRef.current.cameraOrbit = "0deg 75deg 105%"; viewerRef.current.jumpCameraToGoal(); } }} label={t.reset} icon={RefreshCw} />
      <ToolbarButton disabled={!modelLoaded} onClick={toggleFullscreen} label={isFullscreen ? t.exitFull : t.full} icon={isFullscreen ? Minimize : Maximize} />
      <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted">{t.background}<select aria-label={t.background} value={background} onChange={(event) => setBackground(event.target.value)} className="focus-ring rounded bg-surface px-1 py-2 text-foreground"><option value="neutral">{t.neutral}</option><option value="dark">{t.dark}</option><option value="light">{t.light}</option></select></label>
      <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted">{t.lighting}<input aria-label={t.lighting} type="range" min="0.5" max="1.5" step="0.1" value={exposure} onChange={(event) => setExposure(Number(event.target.value))} className="focus-ring w-20 accent-primary" /></label>
    </div>
    {supportsAr && <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3"><button type="button" disabled={!modelLoaded || !canAr} onClick={async () => { setArError(false); try { await viewerRef.current?.activateAR(); } catch { setArError(true); } }} className="focus-ring flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"><Smartphone className="h-4 w-4" />{t.arLaunch}</button><p className="mt-2 text-xs leading-relaxed text-muted">{modelLoaded && !canAr ? t.arUnavailable : t.arNote}</p>{arError && <p role="alert" className="mt-2 text-xs text-danger">{t.arFailed}</p>}</div>}
    {hotspots.some((hotspot) => hotspot.isActive) && <details className="mt-3 rounded-xl border border-border p-3 text-sm"><summary className="focus-ring cursor-pointer text-foreground">{t.features}</summary><div className="mt-3 space-y-3">{hotspots.filter((hotspot) => hotspot.isActive).map((hotspot) => <div key={hotspot.id}><h3 className="text-xs font-semibold text-foreground">{hotspot.title}</h3><p className="mt-1 text-xs leading-relaxed text-muted">{hotspot.description}</p></div>)}</div></details>}
  </div>;
}

function ToolbarButton({ onClick, label, icon: Icon, active, disabled }: { onClick: () => void; label: string; icon: React.ComponentType<{ className?: string }>; active?: boolean; disabled?: boolean }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} aria-pressed={active} disabled={disabled} className={cn("focus-ring flex h-11 w-11 items-center justify-center rounded-xl border transition-colors disabled:opacity-40", active ? "border-primary/50 bg-primary/20 text-primary" : "border-border bg-surface text-foreground hover:border-primary/40")}><Icon className="h-4 w-4" /></button>;
}

export function FallbackImage({ imageUrl, alt, message }: { imageUrl: string; alt: string; message: string }) {
  return <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface-secondary"><Image src={imageUrl} alt={alt} fill unoptimized sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain" /><p role="status" className="absolute inset-x-3 bottom-3 rounded-lg bg-background/90 px-3 py-2 text-center text-xs text-muted">{message}</p></div>;
}
