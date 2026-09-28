"use client";

import { Localized } from "@/lib/i18n/localized";


import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Clock, X, Loader2, ArrowUpRight } from "lucide-react";
import type { Product } from "@/types/product";
import { formatCurrency, cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/locale-provider";

const RECENT_KEY = "spinshop360-recent-search";
export function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const en = locale === "en";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const term = query.trim();
  const suggestions = term.length >= 2;
  const show = open && (suggestions || recent.length > 0);
  const count = suggestions ? results.length : recent.length;

  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
      if (Array.isArray(stored)) setRecent(stored.filter((v): v is string => typeof v === "string").slice(0, 5));
    } catch { /* Search works without browser storage. */ }
  }, []);
  useEffect(() => {
    const handler = (e: PointerEvent) => { if (!containerRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);
  useEffect(() => {
    let cancelled = false;
    setResults([]); setActive(-1); setFailed(false);
    if (term.length < 2) { setLoading(false); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { searchProducts } = await import("@/lib/services/products");
        const items = await searchProducts(term);
        if (!cancelled) setResults(items);
      } catch { if (!cancelled) setFailed(true); }
      finally { if (!cancelled) setLoading(false); }
    }, 180);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [term]);

  function remember(value: string) {
    const next = [value, ...recent.filter((r) => r !== value)].slice(0, 5);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* optional */ }
  }
  function submitSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    remember(trimmed); setOpen(false);
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  }
  function choose(index: number) {
    if (!suggestions) return submitSearch(recent[index]);
    const product = results[index];
    if (!product) return;
    remember(term); setOpen(false); router.push(`/products/${product.slug}`);
  }

  return <Localized><div ref={containerRef} className="relative w-full min-w-0" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <div className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface/80 px-3 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/10">
      <Search className="h-4 w-4 shrink-0 text-muted" />
      <input ref={inputRef} autoFocus={autoFocus} value={query} role="combobox" aria-label={t.common.search} aria-autocomplete="list" aria-expanded={show} aria-controls={show ? listId : undefined} aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setOpen(false); setActive(-1); }
          if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setOpen(true); if (count) setActive((i) => e.key === "ArrowDown" ? (i + 1) % count : (i <= 0 ? count - 1 : i - 1)); }
          if (e.key === "Enter") { e.preventDefault(); if (show && active >= 0) choose(active); else submitSearch(query); }
        }}
        placeholder={en ? "Search products, brands or SKU" : "ค้นหาสินค้า แบรนด์ หรือ SKU"} className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted" />
      {loading ? <Loader2 aria-label={en ? "Searching" : "กำลังค้นหา"} className="h-4 w-4 animate-spin text-accent" /> : query && <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label={en ? "Clear search" : "ล้างคำค้นหา"} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted"><X className="h-4 w-4" /></button>}
    </div>
    {show && <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[65dvh] overflow-auto rounded-2xl border border-border bg-surface p-2 shadow-soft">
      <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted">{suggestions ? (en ? "Products" : "สินค้าที่พบ") : (en ? "Recent searches" : "ค้นหาล่าสุด")}</p>
      <div id={listId} role="listbox" aria-label={en ? "Search suggestions" : "ผลการค้นหา"}>
        {(suggestions ? results : recent).map((item, i) => <button key={typeof item === "string" ? item : item.id} id={`${listId}-${i}`} role="option" aria-selected={active === i} onClick={() => choose(i)} onPointerMove={() => setActive(i)} className={cn("flex min-h-12 w-full items-center gap-3 rounded-xl p-2.5 text-left transition", active === i ? "bg-surface-secondary" : "hover:bg-surface-secondary")}>
          {typeof item === "string" ? <><Clock className="h-4 w-4 text-muted" /><span className="text-sm">{item}</span></> : <><Image src={item.images[0]?.url ?? item.fallbackImageUrl} alt="" width={44} height={44} loading="lazy" className="h-11 w-11 rounded-lg object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-sm">{item.name}</span><span className="text-xs text-muted">{item.brand}</span></span><span className="text-xs font-semibold">{formatCurrency(item.basePrice)}</span></>}
        </button>)}
      </div>
      {suggestions && <>
        <p role="status" className="px-3 text-sm text-muted">{loading ? (en ? "Searching…" : "กำลังค้นหา…") : failed ? (en ? "Search is unavailable. Please try again." : "ค้นหาไม่สำเร็จ กรุณาลองอีกครั้ง") : results.length === 0 ? (en ? "No matching products" : "ไม่พบสินค้าที่ตรงกับคำค้นหา") : ""}</p>
        <button onClick={() => submitSearch(term)} className="mt-2 flex min-h-11 w-full items-center justify-between rounded-xl border-t border-border px-3 text-sm text-accent">{en ? "View all results" : "ดูผลการค้นหาทั้งหมด"}<ArrowUpRight className="h-4 w-4" /></button>
      </>}
    </div>}
  </div></Localized>;
}
