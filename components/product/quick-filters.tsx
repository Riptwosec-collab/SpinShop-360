"use client";

import { Localized } from "@/lib/i18n/localized";

import { useRouter, useSearchParams } from "next/navigation";
import { Rotate3d, Sparkles, Tag, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
const FILTER_KEYS = ["category", "brand", "minPrice", "maxPrice", "supports3d", "supports360", "supportsAr", "onSale", "isNew", "isBestseller", "featured"];
export function QuickFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const { locale } = useTranslation();
  const en = locale === "en";
  const choices = [{ key: "supports3d", label: "3D", icon: Rotate3d }, { key: "supports360", label: "360°", icon: Rotate3d }, { key: "isNew", label: en ? "New arrivals" : "มาใหม่", icon: Sparkles }, { key: "onSale", label: en ? "On sale" : "ลดราคา", icon: Tag }];
  function toggle(key: string) {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === "true") next.delete(key); else next.set(key, "true");
    next.delete("page"); router.push(`/products?${next}`, { scroll: false });
  }
  function clear() {
    const next = new URLSearchParams(params.toString());
    FILTER_KEYS.forEach((key) => next.delete(key)); next.delete("page");
    router.push(`/products?${next}`, { scroll: false });
  }
  const count = FILTER_KEYS.filter((key) => params.has(key)).length;
  return <Localized><div className="mb-6 flex flex-wrap items-center gap-2" aria-label={en ? "Quick filters" : "ตัวกรองด่วน"}>
    {choices.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => toggle(key)} aria-pressed={params.get(key) === "true"} className={cn("focus-ring flex min-h-11 items-center gap-2 rounded-full border px-4 text-xs transition", params.get(key) === "true" ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-muted hover:border-accent/30 hover:text-foreground")}><Icon className="h-3.5 w-3.5" />{label}</button>)}
    {count > 0 && <button onClick={clear} className="flex min-h-11 items-center gap-1 px-2 text-xs text-muted hover:text-foreground"><X className="h-3.5 w-3.5" />{en ? "Clear filters" : "ล้างตัวกรองทั้งหมด"}</button>}
  </div></Localized>;
}
