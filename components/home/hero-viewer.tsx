"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Box, RotateCw } from "lucide-react";
import type { Product } from "@/types/product";
import {
  getGeneratedProductModelKind,
  getProduct3DColorOptions,
  getRealProductModelUrl,
} from "@/lib/product-3d-assets";

const GeneratedProductCanvas = dynamic(
  () => import("@/components/product-viewer/generated-product-canvas").then((module) => module.GeneratedProductCanvas),
  { ssr: false }
);

export function HeroViewer({ product }: { product?: Product }) {
  const [ready, setReady] = useState(false);
  const realModelUrl = useMemo(
    () => (product ? getRealProductModelUrl(product) : null),
    [product]
  );
  const generatedModelKind = useMemo(
    () => (product ? getGeneratedProductModelKind(product) : null),
    [product]
  );
  const generatedColor = useMemo(
    () => (product ? getProduct3DColorOptions(product)[0]?.color ?? null : null),
    [product]
  );
  const imageUrl = product?.images[0]?.url ?? product?.fallbackImageUrl;
  const has3D = Boolean(product?.supports3d && (realModelUrl || generatedModelKind));

  useEffect(() => {
    setReady(false);
    if (!realModelUrl) return;
    let active = true;
    import("@google/model-viewer").then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, [realModelUrl]);

  return (
    <div className="relative mx-auto aspect-[1.08/1] w-full max-w-xl overflow-hidden rounded-[30px] border border-white/10 bg-[#061226] shadow-[0_30px_90px_-40px_rgba(0,122,255,0.75)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_52%_54%,rgba(24,143,255,0.24),transparent_30%),radial-gradient(circle_at_75%_20%,rgba(0,210,255,0.18),transparent_25%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[58%] h-[42%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-cyan-300/30 shadow-[0_0_35px_rgba(34,211,238,0.25)]" />
      <div className="pointer-events-none absolute left-1/2 top-[58%] h-[28%] w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-blue-400/50 shadow-[0_0_30px_rgba(59,130,246,0.35)]" />

      {has3D && generatedModelKind ? (
        <div className="absolute inset-0 z-[1]">
          <GeneratedProductCanvas
            kind={generatedModelKind}
            color={generatedColor}
            autoRotate
          />
        </div>
      ) : has3D && realModelUrl ? (
        <>
          {!ready && (
            <div className="absolute inset-0 z-[1] flex animate-pulse items-center justify-center">
              <div className="h-40 w-40 rounded-full bg-white/5" />
            </div>
          )}
          {ready && (
            // eslint-disable-next-line react/no-unknown-property
            <model-viewer
              src={realModelUrl}
              poster={imageUrl}
              alt={product?.name ?? "สินค้าโมเดล 3D"}
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
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/25">
          <Box className="h-20 w-20" />
        </div>
      )}

      <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-slate-950/45 px-4 py-2 text-[11px] font-medium text-white/80 backdrop-blur-xl">
        <RotateCw className="h-3.5 w-3.5 text-cyan-300" />
        {has3D
          ? "ลากเพื่อหมุนสินค้า 3D · ดูได้ทุกมุม"
          : product?.supports360
            ? "ลากเพื่อหมุนสินค้า 360°"
            : "ดูรายละเอียดสินค้าจริง"}
      </div>
      <div className="pointer-events-none absolute right-5 top-5 z-10 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-cyan-200">
        {has3D ? "3D PRODUCT" : "360° VIEW"}
      </div>
    </div>
  );
}
