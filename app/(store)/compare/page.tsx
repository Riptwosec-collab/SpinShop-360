"use client";

import { useMemo } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useCompareStore } from "@/lib/stores/compare-store";
import { MOCK_PRODUCTS } from "@/lib/mock-data/products";
import { PriceDisplay } from "@/components/product/price-display";
import { RatingStars } from "@/components/product/rating-stars";
import { EmptyState } from "@/components/shared/empty-state";
import { useCartStore } from "@/lib/stores/cart-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { useTranslation } from "@/lib/i18n/locale-provider";

const ROWS: { label: string; get: (p: (typeof MOCK_PRODUCTS)[number]) => string }[] = [
  { label: "ราคา", get: (p) => `฿${p.basePrice.toLocaleString()}` },
  { label: "แบรนด์", get: (p) => p.brand },
  { label: "คะแนนรีวิว", get: (p) => `${p.reviewSummary.average.toFixed(1)} (${p.reviewSummary.count})` },
  { label: "ขนาด", get: (p) => (p.dimensions ? `${p.dimensions.widthCm}x${p.dimensions.heightCm}x${p.dimensions.depthCm} ซม.` : "-") },
  { label: "น้ำหนัก", get: (p) => (p.dimensions ? `${p.dimensions.weightKg} กก.` : "-") },
  { label: "รองรับ 3D", get: (p) => (p.supports3d ? "รองรับ" : "ไม่รองรับ") },
  { label: "รองรับ 360°", get: (p) => (p.supports360 ? "รองรับ" : "ไม่รองรับ") },
  { label: "รองรับ AR", get: (p) => (p.supportsAr ? "รองรับ" : "ไม่รองรับ") },
  { label: "สถานะสินค้า", get: (p) => (p.stockQuantity > 0 ? "พร้อมส่ง" : "สินค้าหมด") },
];

export default function ComparePage() {
  const { t } = useTranslation();
  const productIds = useCompareStore((s) => s.productIds);
  const remove = useCompareStore((s) => s.remove);
  const products = useMemo(
    () => MOCK_PRODUCTS.filter((p) => productIds.includes(p.id)),
    [productIds]
  );
  const addItem = useCartStore((s) => s.addItem);
  const pushToast = useToastStore((s) => s.push);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-semibold text-foreground">{t.compare.title}</h1>
      <p className="mb-6 text-sm text-muted">{t.compare.subtitle} (เพิ่มสินค้าเข้าเปรียบเทียบได้จากหน้ารายการสินค้า)</p>

      {products.length === 0 ? (
        <EmptyState
          title={t.compare.empty}
          description="ไปที่หน้าสินค้าทั้งหมดแล้วเลือกสินค้าที่ต้องการเปรียบเทียบ"
          actionHref="/products"
          actionLabel="เลือกซื้อสินค้า"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-32" />
                {products.map((p) => (
                  <th key={p.id} className="w-56 rounded-t-xl border border-border bg-surface p-4 text-left align-top">
                    <div className="flex items-start justify-between">
                      <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-surface-secondary">
                        <Image src={p.images[0]?.url ?? p.fallbackImageUrl} alt={p.name} fill sizes="96px" className="object-cover" />
                      </div>
                      <button onClick={() => remove(p.id)} aria-label="ลบออกจากการเปรียบเทียบ" className="text-muted hover:text-danger">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground">{p.name}</p>
                    <div className="mt-1">
                      <PriceDisplay price={p.basePrice} compareAtPrice={p.compareAtPrice} size="sm" />
                    </div>
                    <RatingStars rating={p.reviewSummary.average} count={p.reviewSummary.count} />
                    <button
                      onClick={() => {
                        const variant = p.variants[0];
                        const result = addItem({
                          productId: p.id,
                          variantId: variant.id,
                          productName: p.name,
                          variantLabel: "-",
                          slug: p.slug,
                          imageUrl: p.images[0]?.url ?? p.fallbackImageUrl,
                          unitPrice: variant.price,
                          compareAtPrice: variant.compareAtPrice,
                          quantity: 1,
                          stockQuantity: variant.stockQuantity,
                        });
                        pushToast(result.message, result.ok ? "success" : "error");
                      }}
                      className="focus-ring mt-3 w-full rounded-lg bg-primary py-2 text-xs font-medium text-white hover:bg-primary-hover"
                    >
                      เพิ่มลงตะกร้า
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.label}>
                  <td className="border-x border-b border-border bg-surface-secondary p-3 text-xs font-medium text-muted">
                    {row.label}
                  </td>
                  {products.map((p) => (
                    <td
                      key={p.id}
                      className={`border-b border-r border-border p-3 text-sm text-foreground ${i === ROWS.length - 1 ? "rounded-b-none" : ""}`}
                    >
                      {row.get(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
