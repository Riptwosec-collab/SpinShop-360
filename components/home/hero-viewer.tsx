"use client";

import { useEffect, useState } from "react";

const HERO_MODEL_URL = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

export function HeroViewer() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    import("@google/model-viewer").then(() => setReady(true));
  }, []);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-surface to-surface-secondary shadow-soft">
      {!ready && (
        <div className="absolute inset-0 flex animate-pulse items-center justify-center">
          <div className="h-40 w-40 rounded-full bg-surface-secondary" />
        </div>
      )}
      {ready && (
        // eslint-disable-next-line react/no-unknown-property
        <model-viewer
          src={HERO_MODEL_URL}
          alt="ตัวอย่างสินค้าโมเดล 3D หมุนอัตโนมัติ"
          auto-rotate
          auto-rotate-delay={0}
          rotation-per-second="18deg"
          camera-controls
          touch-action="pan-y"
          disable-zoom
          shadow-intensity="1"
          environment-image="neutral"
          exposure="1"
          loading="eager"
          interaction-prompt="none"
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        />
      )}
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] text-muted backdrop-blur-glass">
        ลากเพื่อหมุน • เลื่อนเพื่อดูมุมต่าง ๆ
      </div>
    </div>
  );
}
