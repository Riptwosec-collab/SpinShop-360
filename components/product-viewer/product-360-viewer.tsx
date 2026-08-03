"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize, Minimize, Pause, Play, RefreshCw, AlertTriangle } from "lucide-react";
import { cn, clamp } from "@/lib/utils";

interface Product360ViewerProps {
  frames: string[];
  alt: string;
}

export function Product360Viewer({ frames, alt }: Product360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [autoSpin, setAutoSpin] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const dragState = useRef<{ dragging: boolean; startX: number; startFrame: number }>({
    dragging: false,
    startX: 0,
    startFrame: 0,
  });

  const frameCount = frames.length;

  // Preload frames progressively
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    let failed = 0;

    frames.forEach((src) => {
      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        if (cancelled) return;
        loaded += 1;
        setLoadedCount(loaded);
        if (loaded + failed >= frameCount) setReady(true);
      };
      img.onerror = () => {
        if (cancelled) return;
        failed += 1;
        if (failed > frameCount * 0.5) setHasError(true);
        if (loaded + failed >= frameCount) setReady(true);
      };
    });

    return () => {
      cancelled = true;
    };
  }, [frames, frameCount]);

  // Auto spin
  useEffect(() => {
    if (!autoSpin || !ready || dragState.current.dragging) return;
    const interval = setInterval(() => {
      setFrameIndex((i) => (i + 1) % frameCount);
    }, 90 / speed);
    return () => clearInterval(interval);
  }, [autoSpin, ready, frameCount, speed]);

  const handlePointerDown = useCallback((clientX: number) => {
    dragState.current = { dragging: true, startX: clientX, startFrame: frameIndex };
    setAutoSpin(false);
  }, [frameIndex]);

  const handlePointerMove = useCallback(
    (clientX: number) => {
      if (!dragState.current.dragging) return;
      const deltaX = clientX - dragState.current.startX;
      const framesPerPixel = frameCount / 400;
      const delta = Math.round(deltaX * framesPerPixel);
      let next = (dragState.current.startFrame - delta) % frameCount;
      if (next < 0) next += frameCount;
      setFrameIndex(next);
    },
    [frameCount]
  );

  const handlePointerUp = useCallback(() => {
    dragState.current.dragging = false;
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => handlePointerMove(e.clientX);
    const onUp = () => handlePointerUp();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }

  const progressPct = frameCount > 0 ? Math.round((loadedCount / frameCount) * 100) : 0;

  if (hasError) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface-secondary text-center">
        <AlertTriangle className="h-8 w-8 text-warning" />
        <p className="text-sm text-foreground">ภาพหมุน 360 องศาโหลดไม่สำเร็จบางเฟรม</p>
        <button
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
      className="relative aspect-square w-full touch-none select-none overflow-hidden rounded-2xl border border-border bg-surface-secondary"
      onPointerDown={(e) => handlePointerDown(e.clientX)}
      role="img"
      aria-label={`${alt} - ภาพหมุน 360 องศา เฟรมที่ ${frameIndex + 1} จาก ${frameCount}`}
    >
      {!ready && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface-secondary">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted">กำลังโหลดภาพ 360 องศา...</p>
          <p className="text-xs text-muted">{progressPct}%</p>
        </div>
      )}

      {frames.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={i === frameIndex ? alt : ""}
          draggable={false}
          className={cn(
            "absolute inset-0 h-full w-full object-contain transition-opacity duration-75",
            i === frameIndex ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          style={{ transform: `scale(${zoom})` }}
        />
      ))}

      {ready && (
        <>
          <div className="absolute left-3 top-3 rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] text-muted backdrop-blur-glass">
            ลากเพื่อหมุน • {frameIndex + 1}/{frameCount}
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <IconButton
                onClick={() => setAutoSpin((v) => !v)}
                label={autoSpin ? "หยุดหมุนอัตโนมัติ" : "หมุนอัตโนมัติ"}
                icon={autoSpin ? Pause : Play}
                active={autoSpin}
              />
              <IconButton
                onClick={() => setSpeed((s) => (s >= 2 ? 0.5 : s + 0.5))}
                label={`ความเร็ว x${speed}`}
                icon={RefreshCw}
              >
                <span className="text-[10px]">x{speed}</span>
              </IconButton>
              <IconButton
                onClick={() => setZoom((z) => (z >= 2 ? 1 : z + 0.25))}
                label="ซูม"
              >
                <span className="text-[10px]">+</span>
              </IconButton>
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
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "focus-ring flex h-9 w-9 items-center justify-center rounded-lg border backdrop-blur-glass transition-colors",
        active
          ? "border-primary/50 bg-primary/20 text-primary"
          : "border-border bg-background/70 text-foreground hover:border-primary/40"
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : children}
    </button>
  );
}
