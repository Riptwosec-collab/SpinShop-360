"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "featured", label: "สินค้าแนะนำ" },
  { value: "newest", label: "ใหม่ล่าสุด" },
  { value: "price-asc", label: "ราคาต่ำไปสูง" },
  { value: "price-desc", label: "ราคาสูงไปต่ำ" },
  { value: "rating", label: "คะแนนรีวิวสูงสุด" },
  { value: "bestselling", label: "ขายดีที่สุด" },
  { value: "discount", label: "ส่วนลดมากที่สุด" },
];

export function ProductSort({ total }: { total: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? "featured";
  const view = searchParams.get("view") ?? "grid";

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">พบสินค้า {total} รายการ</p>
      <div className="flex items-center gap-2">
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          aria-label="เรียงลำดับสินค้า"
          className="focus-ring rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="flex overflow-hidden rounded-lg border border-border">
          <button
            onClick={() => setParam("view", "grid")}
            aria-label="มุมมองตาราง"
            aria-pressed={view === "grid"}
            className={cn("p-2", view === "grid" ? "bg-primary/15 text-primary" : "text-muted hover:text-foreground")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setParam("view", "list")}
            aria-label="มุมมองรายการ"
            aria-pressed={view === "list"}
            className={cn("p-2", view === "list" ? "bg-primary/15 text-primary" : "text-muted hover:text-foreground")}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
