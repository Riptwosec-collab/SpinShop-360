"use client";

import { Localized } from "@/lib/i18n/localized";


import Link from "next/link";
import { ArrowUpRight, Rotate3d, Scan, SlidersHorizontal, Sparkles } from "lucide-react";
import { HeroViewer } from "./hero-viewer";
import { useTranslation } from "@/lib/i18n/locale-provider";

export function HeroSection() {
  const { t, locale } = useTranslation();
  const en = locale === "en";
  const features = [
    { icon: Rotate3d, label: en ? "Every angle" : "เห็นครบทุกมุม", sub: "3D / 360°" },
    { icon: Scan, label: en ? "In your space" : "ลองวางในพื้นที่จริง", sub: "AUGMENTED REALITY" },
    { icon: SlidersHorizontal, label: en ? "Find your match" : "เลือกแบบที่ใช่", sub: "COMPARE & DISCOVER" },
  ];
  return <Localized><section className="relative isolate overflow-hidden border-b border-border">
    <div className="hero-grid pointer-events-none absolute inset-0 -z-10" />
    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_40%,rgb(var(--primary)/0.16),transparent_60%)]" />
    <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:px-8 lg:py-20">
      <div className="page-enter">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3 py-1.5 text-[11px] font-medium tracking-wider text-accent"><Sparkles className="h-3.5 w-3.5" /> THE NEXT DIMENSION OF SHOPPING</span>
        <h1 className="mt-6 max-w-xl text-balance text-4xl font-semibold leading-[1.3] tracking-tight sm:text-5xl lg:text-6xl">{t.hero.title}</h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-muted sm:text-base">{t.hero.subtitle}</p>
        <div className="mt-7 flex flex-wrap gap-3"><Link href="/products" className="primary-action shadow-glow">{t.hero.cta1}<ArrowUpRight className="h-4 w-4" /></Link><Link href="/products?supports3d=true" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface/70 px-5 py-3 text-sm font-medium transition hover:border-accent/40"><Rotate3d className="h-4 w-4 text-accent" />{t.hero.cta2}</Link></div>
        <div className="mt-10 grid grid-cols-3 gap-3 border-t border-border/70 pt-6">{features.map(({ icon: Icon, label, sub }) => <div key={sub}><Icon className="mb-2 h-5 w-5 text-accent" /><p className="text-xs font-medium sm:text-sm">{label}</p><p className="mt-1 text-[8px] tracking-wider text-muted sm:text-[9px]">{sub}</p></div>)}</div>
      </div>
      <HeroViewer />
    </div>
  </section></Localized>;
}
