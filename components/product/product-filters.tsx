"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

interface ProductFiltersProps {
  brands: string[];
}

const PRICE_RANGES = [
  { label: "ต่ำกว่า 1,000 บาท", min: 0, max: 1000 },
  { label: "1,000 - 5,000 บาท", min: 1000, max: 5000 },
  { label: "5,000 - 20,000 บาท", min: 5000, max: 20000 },
  { label: "มากกว่า 20,000 บาท", min: 20000, max: undefined },
];

export function ProductFilters({ brands }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      openButtonRef.current?.focus();
    };
  }, [drawerOpen]);

  function navigate(params: URLSearchParams) {
    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
  }

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) params.delete(key);
    else params.set(key, value);
    params.delete("page");
    navigate(params);
  }

  function toggleBoolParam(key: string) {
    updateParam(key, searchParams.get(key) === "true" ? null : "true");
  }

  const activeCategory = searchParams.get("category");
  const activeBrand = searchParams.get("brand");
  const activeMin = searchParams.get("minPrice");
  const activeMax = searchParams.get("maxPrice");
  const activeFilterCount = [
    activeCategory,
    activeBrand,
    activeMin,
    searchParams.get("supports3d"),
    searchParams.get("supports360"),
    searchParams.get("supportsAr"),
    searchParams.get("onSale"),
    searchParams.get("isNew"),
    searchParams.get("isBestseller"),
  ].filter(Boolean).length;

  const content = (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">ตัวกรองสินค้า</h3>
        <button type="button" onClick={() => router.push("/products")} className="focus-ring rounded text-xs text-primary hover:text-primary-hover">
          ล้างตัวกรอง
        </button>
      </div>

      <FilterGroup title="หมวดหมู่">
        <div className="flex flex-col gap-1.5">
          {CATEGORIES.map((category) => (
            <FilterCheckbox
              key={category.slug}
              label={category.name}
              checked={activeCategory === category.slug}
              onChange={() => updateParam("category", activeCategory === category.slug ? null : category.slug)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="แบรนด์">
        <div className="flex flex-col gap-1.5">
          {brands.map((brand) => (
            <FilterCheckbox
              key={brand}
              label={brand}
              checked={activeBrand === brand}
              onChange={() => updateParam("brand", activeBrand === brand ? null : brand)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="ช่วงราคา">
        <div className="flex flex-col gap-1.5">
          {PRICE_RANGES.map((range) => {
            const checked =
              activeMin === String(range.min) &&
              (range.max === undefined ? activeMax === null : activeMax === String(range.max));
            return (
              <FilterCheckbox
                key={range.label}
                label={range.label}
                checked={checked}
                onChange={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (checked) {
                    params.delete("minPrice");
                    params.delete("maxPrice");
                  } else {
                    params.set("minPrice", String(range.min));
                    if (range.max === undefined) params.delete("maxPrice");
                    else params.set("maxPrice", String(range.max));
                  }
                  params.delete("page");
                  navigate(params);
                }}
              />
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="รูปแบบการแสดงสินค้า">
        <div className="flex flex-col gap-1.5">
          <FilterCheckbox label="รองรับ 3D" checked={searchParams.get("supports3d") === "true"} onChange={() => toggleBoolParam("supports3d")} />
          <FilterCheckbox label="รองรับ 360 องศา" checked={searchParams.get("supports360") === "true"} onChange={() => toggleBoolParam("supports360")} />
          <FilterCheckbox label="รองรับ AR" checked={searchParams.get("supportsAr") === "true"} onChange={() => toggleBoolParam("supportsAr")} />
        </div>
      </FilterGroup>

      <FilterGroup title="อื่น ๆ">
        <div className="flex flex-col gap-1.5">
          <FilterCheckbox label="สินค้าลดราคา" checked={searchParams.get("onSale") === "true"} onChange={() => toggleBoolParam("onSale")} />
          <FilterCheckbox label="สินค้ามาใหม่" checked={searchParams.get("isNew") === "true"} onChange={() => toggleBoolParam("isNew")} />
          <FilterCheckbox label="สินค้าขายดี" checked={searchParams.get("isBestseller") === "true"} onChange={() => toggleBoolParam("isBestseller")} />
        </div>
      </FilterGroup>
    </div>
  );

  return (
    <>
      <button
        ref={openButtonRef}
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="focus-ring mb-4 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm lg:hidden"
        aria-expanded={drawerOpen}
        aria-controls="product-filter-drawer"
      >
        <SlidersHorizontal className="h-4 w-4" />
        ตัวกรอง
        {activeFilterCount > 0 && (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">{activeFilterCount}</span>
        )}
      </button>

      <aside aria-label="ตัวกรองสินค้า" className="hidden w-64 shrink-0 lg:block">{content}</aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 h-full w-full bg-black/60" onClick={() => setDrawerOpen(false)} aria-label="ปิดตัวกรอง" tabIndex={-1} />
          <div
            id="product-filter-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="ตัวกรองสินค้า"
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-2xl border-t border-border bg-background p-5 shadow-soft"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">ตัวกรองสินค้า</span>
              <button ref={closeButtonRef} type="button" onClick={() => setDrawerOpen(false)} aria-label="ปิดตัวกรอง" className="focus-ring rounded-lg p-2 text-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            {content}
            <button type="button" onClick={() => setDrawerOpen(false)} className="focus-ring mt-6 w-full rounded-lg bg-primary py-3 text-sm font-medium text-white">
              แสดงผลลัพธ์
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="focus-within:ring-2 focus-within:ring-primary flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm text-muted hover:text-foreground">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-border accent-[rgb(var(--primary))]" />
      {label}
    </label>
  );
}
