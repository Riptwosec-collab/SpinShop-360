"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, X } from "lucide-react";
import { searchProducts } from "@/lib/services/products";
import type { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";

const RECENT_KEY = "spinshop360-recent-search";

export function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
      if (Array.isArray(stored)) setRecent(stored);
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    let active = true;
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    searchProducts(query).then((r) => {
      if (active) setResults(r);
    });
    return () => {
      active = false;
    };
  }, [query]);

  function submitSearch(term: string) {
    if (!term.trim()) return;
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 5);
    setRecent(next);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setOpen(false);
    router.push(`/products?search=${encodeURIComponent(term)}`);
  }

  return (
    <div ref={containerRef} className="relative w-64 lg:w-80">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && submitSearch(query)}
          placeholder="ค้นหาสินค้า แบรนด์ หรือ SKU"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="ล้างคำค้นหา" className="text-muted">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (query.length >= 2 || recent.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-auto rounded-xl border border-border bg-surface p-2 shadow-soft">
          {query.length >= 2 ? (
            results.length > 0 ? (
              results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/products/${p.slug}`);
                  }}
                  className="focus-ring flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-surface-secondary"
                >
                  <img
                    src={p.images[0]?.url ?? p.fallbackImageUrl}
                    alt=""
                    className="h-10 w-10 rounded-md object-cover"
                  />
                  <span className="flex-1 truncate text-sm">{p.name}</span>
                  <span className="text-xs text-muted">{formatCurrency(p.basePrice)}</span>
                </button>
              ))
            ) : (
              <p className="p-3 text-center text-sm text-muted">ไม่พบสินค้าที่ตรงกับ &ldquo;{query}&rdquo;</p>
            )
          ) : (
            <div>
              <p className="px-2 py-1 text-xs font-medium text-muted">ค้นหาล่าสุด</p>
              {recent.map((term) => (
                <button
                  key={term}
                  onClick={() => submitSearch(term)}
                  className="focus-ring flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-surface-secondary"
                >
                  <Clock className="h-3.5 w-3.5 text-muted" />
                  {term}
                </button>
              ))}
              {recent.length === 0 && (
                <p className="px-2 py-2 text-sm text-muted">ยังไม่มีประวัติการค้นหา</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
