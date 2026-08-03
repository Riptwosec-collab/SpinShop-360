"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

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

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  function toggleBoolParam(key: string) {
    const isActive = searchParams.get(key) === "true";
    updateParam(key, isActive ? null : "true");
  }

  function clearAll() {
    router.push("/products");
  }

  const activeCategory = searchParams.get("category");
  const activeBrand = searchParams.get("brand");
  const activeMin = searchParams.get("minPrice");
  const activeMax = searchParams.get("maxPrice");

  const content = (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">ตัวกรองสินค้า</h3>
        <button onClick={clearAll} className="focus-ring text-xs text-primary hover:text-primary-hover">
          ล้างตัวกรอง
        </button>
      </div>

      <FilterGroup title="หมวดหมู่">
        <div className="flex flex-col gap-1.5">
          {CATEGORIES.map((cat) => (
            <FilterCheckbox
              key={cat.slug}
              label={cat.name}
              checked={activeCategory === cat.slug}
              onChange={() => updateParam("category", activeCategory === cat.slug ? null : cat.slug)}
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
            const checked = activeMin === String(range.min) && activeMax === String(range.max ?? "");
            return (
              <FilterCheckbox
                key={range.label}
                label={range.label}
                checked={checked}
                onChange={() => {
                  if (checked) {
                    updateParam("minPrice", null);
                    updateParam("maxPrice", null);
                  } else {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("minPrice", String(range.min));
                    if (range.max) params.set("maxPrice", String(range.max));
                    else params.delete("maxPrice");
                    params.delete("page");
                    router.push(`/products?${params.toString()}`);
                  }
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
        onClick={() => setDrawerOpen(true)}
        className="focus-ring mb-4 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        ตัวกรอง
      </button>

      <aside className="hidden w-64 shrink-0 lg:block">{content}</aside>

      <div className={cn("fixed inset-0 z-50 lg:hidden", drawerOpen ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          className={cn("absolute inset-0 bg-black/60 transition-opacity", drawerOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-2xl border-t border-border bg-background p-5 transition-transform",
            drawerOpen ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold">ตัวกรองสินค้า</span>
            <button onClick={() => setDrawerOpen(false)} aria-label="ปิด" className="focus-ring text-muted">
              <X className="h-5 w-5" />
            </button>
          </div>
          {content}
          <button
            onClick={() => setDrawerOpen(false)}
            className="focus-ring mt-6 w-full rounded-lg bg-primary py-3 text-sm font-medium text-white"
          >
            แสดงผลลัพธ์
          </button>
        </div>
      </div>
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      {children}
    </div>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="focus-ring flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm text-muted hover:text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-border accent-[rgb(var(--primary))]"
      />
      {label}
    </label>
  );
}
