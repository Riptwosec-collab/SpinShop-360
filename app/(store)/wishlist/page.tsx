"use client";

import { Localized } from "@/lib/i18n/localized";


import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { useCatalogProducts } from "@/lib/hooks/use-catalog-products";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { useTranslation } from "@/lib/i18n/locale-provider";

export default function WishlistPage() {
  const { t } = useTranslation();
  const productIds = useWishlistStore((s) => s.productIds);
  const {products,loading,error} = useCatalogProducts(productIds);

  return (
    <Localized><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">{t.wishlist.title}</h1>
      {loading ? <p role="status">กำลังโหลดสินค้า / Loading products…</p> : error ? <p role="alert">ไม่สามารถโหลดสินค้าได้ กรุณาลองใหม่ / Unable to load products; try again</p> : products.length === 0 ? (
        <EmptyState
          title={t.wishlist.empty}
          description="กดหัวใจที่สินค้าที่คุณสนใจเพื่อบันทึกไว้ดูภายหลัง"
          actionHref="/products"
          actionLabel="เลือกซื้อสินค้า"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div></Localized>
  );
}
