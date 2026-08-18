"use client";

import Link from "next/link";
import { ArrowRight, Box, RotateCw, ScanLine, ZoomIn } from "lucide-react";
import { HeroViewer } from "@/components/home/hero-viewer";
import { useTranslation } from "@/lib/i18n/locale-provider";
import type { Product } from "@/types/product";

export function HeroSection({ product }: { product?: Product }) {
  const { locale } = useTranslation();
  const isThai = locale === "th";

  return (
    <section className="mx-auto max-w-7xl px-4 pb-5 pt-5 sm:px-6 lg:px-8 lg:pt-7">
      <div className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[#071525] text-white shadow-[0_30px_80px_-45px_rgba(8,77,160,0.65)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_35%,rgba(0,119,255,0.18),transparent_34%),radial-gradient(circle_at_82%_45%,rgba(0,209,255,0.12),transparent_30%)]" />

        <div className="relative grid min-h-[410px] grid-cols-1 items-center gap-5 px-6 py-8 sm:px-9 lg:grid-cols-[0.92fr_1.08fr] lg:px-12 lg:py-10">
          <div className="z-10 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
              <RotateCw className="h-3.5 w-3.5" />
              Interactive 360° Shopping
            </span>

            <h1 className="mt-5 text-balance text-3xl font-bold leading-[1.08] tracking-[-0.045em] sm:text-4xl lg:text-[46px]">
              {isThai ? "มองทุกมุมก่อนตัดสินใจ" : "Experience Every Angle"}
              <span className="mt-1 block bg-gradient-to-r from-[#2f8cff] via-[#16b8ff] to-[#55d8ff] bg-clip-text text-transparent">
                {isThai ? "ช้อปมั่นใจด้วย 360°" : "Shop with 360° Confidence"}
              </span>
            </h1>

            <p className="mt-4 max-w-md text-sm leading-7 text-slate-300 sm:text-[15px]">
              {isThai
                ? "หมุน ซูม และดูรายละเอียดสินค้าแบบ 3D ก่อนซื้อ ให้ประสบการณ์ออนไลน์ใกล้เคียงการหยิบสินค้าดูจริง"
                : "Rotate, zoom and inspect products in 3D before you buy. See more detail and choose with confidence."}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/products?supports360=true"
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(17,108,255,0.95)] transition-all hover:-translate-y-0.5 hover:bg-primary-hover"
              >
                {isThai ? "เลือกดูสินค้า 360°" : "Explore 360° Products"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/products?supports3d=true"
                className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Box className="h-4 w-4 text-cyan-300" />
                {isThai ? "สินค้า 3D" : "3D Collection"}
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-5 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5"><RotateCw className="h-3.5 w-3.5 text-blue-400" />360° View</span>
              <span className="flex items-center gap-1.5"><ZoomIn className="h-3.5 w-3.5 text-blue-400" />Zoom</span>
              <span className="flex items-center gap-1.5"><ScanLine className="h-3.5 w-3.5 text-blue-400" />AR Ready</span>
            </div>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[620px]">
            <HeroViewer product={product} />
          </div>
        </div>
      </div>
    </section>
  );
}
