"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";
import type { Product } from "@/types/product";

const FALLBACK_MODEL_URL = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

export function HeroViewer({ product }: { product?: Product }) {
  const [ready, setReady] = useState(false);
  const modelUrl = product?.modelGlbUrl ?? (!product ? FALLBACK_MODEL_URL : null);
  const imageUrl = product?.images[0]?.url ?? product?.fallbackImageUrl;

  useEffect(() => {
    if (!modelUrl) return;
    import("@google/model-viewer").then(() => setReady(true));
  }, [modelUrl]);

  return (
    <div className="relative mx-auto aspect-[1.08/1] w-full max-w-xl overflow-hidden rounded-[30px] border border-white/10 bg-[#061226] shadow-[0_30px_90px_-40px_rgba(0,122,255,0.75)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_52%_54%,rgba(24,143,255,0.24),transparent_30%),radial-gradient(circle_at_75%_20%,rgba(0,210,255,0.18),transparent_25%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[58%] h-[42%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-cyan-300/30 shadow-[0_0_35px_rgba(34,211,238,0.25)]" />
      <div className="pointer-events-none absolute left-1/2 top-[58%] h-[28%] w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-blue-400/50 shadow-[0_0_30px_rgba(59,130,246,0.35)]" />

      {modelUrl ? (
        <>
          {!ready && (
            <div className="absolute inset-0 flex animate-pulse items-center justify-center">
              <div className="h-40 w-40 rounded-full bg-white/5" />
            </div>
          )}
          {ready && (
            // eslint-disable-next-line react/no-unknown-property
            <model-viewer
              src={modelUrl}
              alt={product?.name ?? "ตัวอย่างสินค้าโมเดล 3D"}
              auto-rotate
              auto-rotate-delay={0}
              rotation-per-second="18deg"
              camera-controls
              touch-action="pan-y"
              disable-zoom
              shadow-intensity="1"
              environment-image="neutral"
              exposure="1.05"
              loading="eager"
              interaction-prompt="none"
              style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
            />
          )}
        </>
      ) : imageUrl ? (
        <Image
          src={imageUrl}
          alt={product?.name ?? "สินค้าแนะนำ"}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-[13%] drop-shadow-[0_28px_35px_rgba(0,0,0,0.45)]"
        />
      ) : null}

      <div className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-slate-950/45 px-4 py-2 text-[11px] font-medium text-white/80 backdrop-blur-xl">
        <RotateCw className="h-3.5 w-3.5 text-cyan-300" />
        {product?.supports360 ? "ลากเพื่อหมุนสินค้า 360°" : "Interactive 360° experience"}
      </div>
      <div className="pointer-events-none absolute right-5 top-5 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-cyan-200">
        360° VIEW
      </div>
    </div>
  );
}
