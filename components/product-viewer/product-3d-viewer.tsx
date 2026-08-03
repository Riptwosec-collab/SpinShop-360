"use client";

import { useEffect, useRef, useState } from "react";
import {
  RotateCw,
  Maximize,
  Minimize,
  Camera,
  MapPin,
  RefreshCw,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import type { ProductHotspot } from "@/types/product";
import { HotspotOverlay } from "./hotspot-overlay";
import type { ModelViewerElement } from "@/types/model-viewer";

interface Product3DViewerProps {
  modelUrl: string;
  usdzUrl?: string | null;
  alt: string;
  fallbackImageUrl: string;
  hotspots?: ProductHotspot[];
  supportsAr?: boolean;
}

const BACKGROUNDS = [
  { id: "neutral", label: "กลาง", image: "neutral" },
  { id: "studio", label: "สตูดิโอ" },
  { id: "outdoor", label: "กลางแจ้ง" },
];

export function Product3DViewer({
  modelUrl,
  usdzUrl,
  alt,
  fallbackImageUrl,
  hotspots = [],
  supportsAr = false,
}: Product3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [background, setBackground] = useState("neutral");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setWebglSupported(!!gl);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!webglSupported) return;
    let active = true;
    import("@google/model-viewer").then(() => {
      if (active) setScriptReady(true);
    });
    return () => {
      active = false;
    };
  }, [webglSupported]);

  useEffect(() => {
    setModelLoaded(false);
    setLoadError(false);
    setProgress(0);
  }, [modelUrl, attempt]);

  function handleProgress(e: React.SyntheticEvent<HTMLElement>) {
    const detail = (e as unknown as { detail?: { totalProgress?: number } }).detail;
    if (detail?.totalProgress != null) setProgress(Math.round(detail.totalProgress * 100));
  }

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

  function takeScreenshot() {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const dataUrl = viewer.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "spinshop360-product.png";
    link.click();
  }

  function resetCamera() {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.cameraOrbit = "0deg 75deg 105%";
    viewer.jumpCameraToGoal();
  }

  if (!webglSupported) {
    return (
      <FallbackImage
        imageUrl={fallbackImageUrl}
        alt={alt}
        message="อุปกรณ์ของคุณไม่รองรับการแสดงผลโมเดล 3D (WebGL) กำลังแสดงรูปภาพแทน"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface-secondary"
    >
      {(!scriptReady || (!modelLoaded && !loadError)) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface-secondary">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted">กำลังโหลดโมเดล 3D...</p>
          <p className="text-xs text-muted">{progress}%</p>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface-secondary p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-warning" />
          <p className="text-sm text-foreground">ไม่สามารถโหลดโมเดล 3D ได้</p>
          <button
            onClick={() => setAttempt((a) => a + 1)}
            className="focus-ring flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            ลองใหม่อีกครั้ง
          </button>
        </div>
      )}

      {scriptReady && (
        // eslint-disable-next-line react/no-unknown-property
        <model-viewer
          key={attempt}
          ref={viewerRef as unknown as React.RefObject<HTMLElement>}
          src={modelUrl}
          alt={alt}
          ar={supportsAr}
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          touch-action="pan-y"
          auto-rotate={autoRotate}
          shadow-intensity="1"
          environment-image={background === "neutral" ? "neutral" : undefined}
          exposure="1"
          loading="eager"
          reveal="auto"
          onLoad={() => setModelLoaded(true)}
          onError={() => setLoadError(true)}
          onProgress={handleProgress}
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        >
          {usdzUrl && <a slot="ar-button" style={{ display: "none" }} />}
        </model-viewer>
      )}

      {modelLoaded && showHotspots && hotspots.length > 0 && (
        <HotspotOverlay hotspots={hotspots} />
      )}

      {modelLoaded && (
        <>
          <div className="absolute left-3 top-3 rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] text-muted backdrop-blur-glass">
            ลากเพื่อหมุน เลื่อนเพื่อซูม
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <ToolbarButton
                active={autoRotate}
                onClick={() => setAutoRotate((v) => !v)}
                label={autoRotate ? "หยุดหมุนอัตโนมัติ" : "หมุนอัตโนมัติ"}
                icon={RotateCw}
              />
              <ToolbarButton onClick={resetCamera} label="รีเซ็ตมุมกล้อง" icon={RefreshCw} />
              {hotspots.length > 0 && (
                <ToolbarButton
                  active={showHotspots}
                  onClick={() => setShowHotspots((v) => !v)}
                  label="แสดง/ซ่อนจุดสำคัญ"
                  icon={MapPin}
                />
              )}
              <ToolbarButton onClick={takeScreenshot} label="ถ่ายภาพหน้าจอ" icon={Camera} />
              <ToolbarButton
                onClick={toggleFullscreen}
                label={isFullscreen ? "ออกจากเต็มจอ" : "เต็มจอ"}
                icon={isFullscreen ? Minimize : Maximize}
              />
              {supportsAr && (
                <ToolbarButton
                  onClick={() => {
                    const viewer = viewerRef.current as unknown as { activateAR?: () => void };
                    viewer?.activateAR?.();
                  }}
                  label="ดูในพื้นที่จริง (AR)"
                  icon={Smartphone}
                />
              )}
            </div>
          </div>
        </>
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
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`focus-ring flex h-9 w-9 items-center justify-center rounded-lg border backdrop-blur-glass transition-colors ${
        active
          ? "border-primary/50 bg-primary/20 text-primary"
          : "border-border bg-background/70 text-foreground hover:border-primary/40"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function FallbackImage({
  imageUrl,
  alt,
  message,
}: {
  imageUrl: string;
  alt: string;
  message: string;
}) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface-secondary">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
      <p className="absolute inset-x-3 bottom-3 rounded-lg bg-background/80 px-3 py-2 text-center text-xs text-muted backdrop-blur-glass">
        {message}
      </p>
    </div>
  );
}
