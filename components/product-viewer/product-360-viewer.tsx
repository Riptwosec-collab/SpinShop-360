"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize, Minimize, Pause, Play, RefreshCw, AlertTriangle, ZoomIn } from "lucide-react";
import { cn, clamp } from "@/lib/utils";

interface Product360ViewerProps {
  frames: string[];
  alt: string;
}

export function Product360Viewer({ frames, alt }: Product360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ dragging: false, startX: 0, startFrame: 0 });
  const [loadedCount, setLoadedCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [autoSpin, setAutoSpin] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [reduceMotion, setReduceMotion] = useState(false);

  const frameCount = frames.length;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    setLoadedCount(0);
    setReady(false);
    setHasError(false);
    setFrameIndex(0);

    if (frameCount === 0) {
      setHasError(true);
      return;
    }

    let cancelled = false;
    let loaded = 0;
    let failed = 0;

    function loadFrame(src: string, isFirst = false) {
      const image = new window.Image();
      image.decoding = "async";
      image.src = src;
      image.onload = () => {
        if (cancelled) return;
        loaded += 1;
        setLoadedCount(loaded);
        if (isFirst) setReady(true);
      };
      image.onerror = () => {
        if (cancelled) return;
        failed += 1;
        if (isFirst || failed > Math.max(2, frameCount * 0.5)) setHasError(true);
      };
    }

    loadFrame(frames[0], true);
    const preloadTimer = window.setTimeout(() => {
      frames.slice(1).forEach((src) => loadFrame(src));
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(preloadTimer);
    };
  }, [frames, frameCount]);

  useEffect(() => {
    if (!autoSpin || !ready || reduceMotion || frameCount < 2 || dragState.current.dragging) return;
    const interval = window.setInterval(() => {
      setFrameIndex((index) => (index + 1) % frameCount);
    }, 90 / speed);
    return () => window.clearInterval(interval);
  }, [autoSpin, ready, reduceMotion, frameCount, speed]);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const handlePointerDown = useCallback((clientX: number) => {
    if (frameCount < 2) return;
    dragState.current = { dragging: true, startX: clientX, startFrame: frameIndex };
    setAutoSpin(false);
  }, [frameCount, frameIndex]);

  const handlePointerMove = useCallback((clientX: number) => {
    if (!dragState.current.dragging || frameCount < 2) return;
    const deltaX = clientX - dragState.current.startX;
    const delta = Math.round(deltaX * (frameCount / 400));
    const next = ((dragState.current.startFrame - delta) % frameCount + frameCount) % frameCount;
    setFrameIndex(next);
  }, [frameCount]);

  const handlePointerUp = useCallback(() => {
    dragState.current.dragging = false;
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => handlePointerMove(event.clientX);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  async function toggleFullscreen() {
    const element = containerRef.current;
    if (!element) return;
    if (document.fullscreenElement) await document.exitFullscreen?.();
    else await element.requestFullscreen?.();
  }

  function stepFrame(delta: number) {
    if (frameCount < 2) return;
    setAutoSpin(false);
    setFrameIndex((index) => ((index + delta) % frameCount + frameCount) % frameCount);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepFrame(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      stepFrame(1);
    } else if (event.key === " ") {
      event.preventDefault();
      setAutoSpin((value) => !value);
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      setZoom((value) => clamp(value + 0.25, 1, 2));
    } else if (event.key === "-") {
      event.preventDefault();
      setZoom((value) => clamp(value - 0.25, 1, 2));
    }
  }

  const progressPct = frameCount > 0 ? Math.round((loadedCount / frameCount) * 100) : 0;

  if (hasError) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface-secondary p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-warning" />
        <p className="text-sm text-foreground">ไม่สามารถโหลดภาพหมุน 360 องศาได้</p>
        <p className="text-xs text-muted">กรุณาตรวจสอบชุดภาพสินค้า หรือลองโหลดหน้านี้ใหม่</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="focus-ring flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          โหลดใหม่
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => handlePointerDown(event.clientX)}
      className="focus-ring relative aspect-square w-full touch-none select-none overflow-hidden rounded-2xl border border-border bg-surface-secondary"
      role="region"
      aria-roledescription="ตัวแสดงภาพสินค้า 360 องศา"
      aria-label={`${alt} เฟรมที่ ${frameIndex + 1} จาก ${frameCount}. ใช้ลูกศรซ้ายขวาเพื่อหมุน`}
    >
      {!ready && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface-secondary">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted">กำลังโหลดภาพ 360 องศา...</p>
          <p className="text-xs text-muted">{progressPct}%</p>
        </div>
      )}

      {ready && frames[frameIndex] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={frames[frameIndex]}
          alt={alt}
          draggable={false}
          className="h-full w-full object-contain transition-transform duration-75"
          style={{ transform: `scale(${zoom})` }}
        />
      )}

      {ready && (
        <>
          <div className="absolute left-3 top-3 rounded-full border border-border bg-background/80 px-3 py-1 text-[11px] text-muted backdrop-blur-glass">
            ลากหรือใช้ปุ่มลูกศร • {frameIndex + 1}/{frameCount}
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <IconButton
                onClick={() => setAutoSpin((value) => !value)}
                label={autoSpin ? "หยุดหมุนอัตโนมัติ" : "หมุนอัตโนมัติ"}
                icon={autoSpin ? Pause : Play}
                active={autoSpin && !reduceMotion}
              />
              <IconButton
                onClick={() => setSpeed((value) => (value >= 2 ? 0.5 : value + 0.5))}
                label={`ความเร็ว x${speed}`}
                icon={RefreshCw}
              >
                <span className="text-[10px]">x{speed}</span>
              </IconButton>
              <IconButton
                onClick={() => setZoom((value) => (value >= 2 ? 1 : clamp(value + 0.25, 1, 2)))}
                label={`ซูม x${zoom}`}
                icon={ZoomIn}
              />
              <IconButton
                onClick={toggleFullscreen}
                label={isFullscreen ? "ออกจากเต็มจอ" : "เต็มจอ"}
                icon={isFullscreen ? Minimize : Maximize}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function IconButton({
  onClick,
  label,
  icon: Icon,
  active,
  children,
}: {
  onClick: () => void;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  active?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "focus-ring flex h-9 w-9 items-center justify-center rounded-lg border backdrop-blur-glass transition-colors",
        active
          ? "border-primary/50 bg-primary/20 text-primary"
          : "border-border bg-background/80 text-foreground hover:border-primary/40"
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : children}
    </button>
  );
}
