"use client";

import Link from "next/link";
import { RotateCw, Smartphone, Truck, ShieldCheck } from "lucide-react";
import { HeroViewer } from "@/components/home/hero-viewer";
import { useTranslation } from "@/lib/i18n/locale-provider";

const HIGHLIGHTS = [
  { icon: RotateCw, label: "หมุนดูได้ 360°" },
  { icon: Smartphone, label: "รองรับ AR" },
  { icon: Truck, label: "จัดส่งทั่วประเทศ" },
  { icon: ShieldCheck, label: "ชำระเงินปลอดภัย" },
];

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(var(--primary)/0.18),transparent_40%),radial-gradient(circle_at_80%_60%,rgb(var(--accent)/0.15),transparent_45%)]" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div className="order-2 lg:order-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <RotateCw className="h-3 w-3" />
            ระบบดูสินค้า 3D และ 360 องศา
          </span>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t.hero.title}
          </h1>
          <p className="mt-4 max-w-md text-balance text-muted">{t.hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="focus-ring rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              {t.hero.cta1}
            </Link>
            <Link
              href="/products?supports3d=true"
              className="focus-ring rounded-xl border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
            >
              {t.hero.cta2}
            </Link>
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted">
                <Icon className="h-4 w-4 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </dl>
        </div>

        <div className="order-1 lg:order-2">
          <HeroViewer />
        </div>
      </div>
    </section>
  );
}
