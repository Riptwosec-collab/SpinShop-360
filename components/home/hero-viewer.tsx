"use client";

import { Localized } from "@/lib/i18n/localized";


import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Box, Loader2, Rotate3d } from "lucide-react";
import { useTranslation } from "@/lib/i18n/locale-provider";

const HERO_MODEL_URL = "/models/demo/keyboard.glb";
export function HeroViewer() {
  const { locale } = useTranslation();
  const en = locale === "en";
  const [requested, setRequested] = useState(false);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(true);
  const modelRef = useRef<import("@/types/model-viewer").ModelViewerElement>(null);
  useEffect(() => {
    if (!requested) return;
    let cancelled = false;
    setFailed(false);
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    import("@google/model-viewer").then(() => { if (!cancelled) setReady(true); }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [requested]);
  useEffect(() => {
    const model = modelRef.current;
    if (!model) return;
    const onLoad = () => setLoaded(true);
    const onError = () => setFailed(true);
    model.addEventListener("load", onLoad); model.addEventListener("error", onError);
    if (model.loaded) onLoad();
    return () => { model.removeEventListener("load", onLoad); model.removeEventListener("error", onError); };
  }, [ready]);
  useEffect(() => {
    if (!requested || loaded || failed) return;
    const timeout = window.setTimeout(() => setFailed(true), 25000);
    return () => window.clearTimeout(timeout);
  }, [requested, loaded, failed]);
  return <Localized><div className="premium-panel relative mx-auto aspect-square min-h-[420px] w-full max-w-lg sm:min-h-0 overflow-hidden bg-[radial-gradient(ellipse_at_center,rgb(var(--primary)/0.18),transparent_70%)]">
    <div className="pointer-events-none absolute inset-x-6 top-5 z-10 flex items-center justify-between text-[10px] tracking-widest text-muted"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" />INTERACTIVE STUDIO</span><span>01 / 360</span></div>
    {!requested && <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-6 flex h-40 w-40 items-center justify-center rounded-full border border-accent/25 sm:h-48 sm:w-48"><div className="absolute inset-4 rounded-full border border-primary/30" /><div className="absolute -inset-5 rounded-full border border-border/60" /><Box strokeWidth={.9} className="h-20 w-20 text-accent drop-shadow-[0_0_24px_rgba(34,211,238,0.3)]" /><span className="absolute -right-2 top-8 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface"><Rotate3d className="h-5 w-5 text-accent" /></span></div>
      <p className="mt-2 text-xl font-medium">{en ? "A new perspective." : "อีกมุมของการเลือกซื้อ"}</p>
      <p className="mt-2 max-w-xs text-xs leading-6 text-muted">{en ? "Rotate, zoom and explore a sample 3D model." : "ลองหมุน ซูม และสำรวจโมเดล 3D ตัวอย่างด้วยตัวคุณเอง"}</p>
      <button onClick={() => setRequested(true)} className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-5 text-sm text-accent">{en ? "Launch 3D experience" : "เปิดประสบการณ์ 3D"}<ArrowUpRight className="h-4 w-4" /></button>
    </div>}
    {requested && !loaded && !failed && <div role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted"><Loader2 className="h-5 w-5 animate-spin" />{en ? "Loading 3D model…" : "กำลังโหลดโมเดล 3D…"}</div>}
    {ready && !failed && <model-viewer ref={modelRef} src={HERO_MODEL_URL} alt={en ? "Illustrative keyboard model" : "โมเดลคีย์บอร์ดสาธิต"} auto-rotate={reduced ? undefined : true} camera-controls touch-action="pan-y" disable-zoom shadow-intensity="1" environment-image="neutral" exposure="1" interaction-prompt="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", backgroundColor: "transparent" }} />}
    {failed && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center"><p className="text-sm text-muted">{en ? "The 3D preview could not load." : "โหลดตัวอย่าง 3D ไม่สำเร็จ"}</p><button className="primary-action" onClick={() => { setRequested(false); setReady(false); setLoaded(false); setFailed(false); }}>{en ? "Back to preview" : "กลับไปหน้าตัวอย่าง"}</button></div>}
    <div className="pointer-events-none absolute inset-x-6 bottom-5 flex justify-between border-t border-border/60 pt-3 text-[10px] text-muted"><span>{en ? "Sample 3D model" : "โมเดล 3D ตัวอย่าง"}</span><span>{en ? "Drag to rotate" : "ลากเพื่อหมุนดูรอบตัว"}</span></div>
  </div></Localized>;
}
