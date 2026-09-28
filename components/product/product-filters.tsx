"use client";

import { Localized } from "@/lib/i18n/localized";


import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES, USE_MOCK_DATA } from "@/lib/constants";
import type { CatalogCategory } from "@/lib/services/products";
import { Modal } from "@/components/shared/modal";

interface ProductFiltersProps {
  brands: string[];
  categories?: CatalogCategory[];
}

const PRICE_RANGES = [
  { label: "ต่ำกว่า 1,000 บาท", min: 0, max: 1000 },
  { label: "1,000 - 5,000 บาท", min: 1000, max: 5000 },
  { label: "5,000 - 20,000 บาท", min: 5000, max: 20000 },
  { label: "มากกว่า 20,000 บาท", min: 20000, max: undefined },
];

export function ProductFilters({ brands, categories = USE_MOCK_DATA ? [...CATEGORIES] : [] }: ProductFiltersProps) {
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
          {categories.map((cat) => (
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
            const checked = activeMin === String(range.min) && (activeMax ?? "") === String(range.max ?? "");
            return (
              <FilterCheckbox
                key={range.label}
                label={range.label}
                checked={checked}
                onChange={() => {
                  if (checked) {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("minPrice");
                    params.delete("maxPrice");
                    params.delete("page");
                    router.push(`/products?${params.toString()}`);
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
    <Localized><>
      <button
        onClick={() => setDrawerOpen(true)}
        className="focus-ring mb-4 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        ตัวกรอง
      </button>

      <aside className="premium-panel hidden h-fit w-60 shrink-0 p-5 lg:sticky lg:top-36 lg:block">{content}</aside>

      <Modal open={drawerOpen} onClose={() => setDrawerOpen(false)} label="ตัวกรองสินค้า" className="mobile-safe mt-auto max-h-[85dvh] w-full rounded-t-3xl border-t p-5">
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
      </Modal>
    </></Localized>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Localized><div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      {children}
    </div></Localized>
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
    <Localized><label className="focus-ring flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm text-muted hover:text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-border accent-[rgb(var(--primary))]"
      />
      {label}
    </label></Localized>
  );
}
