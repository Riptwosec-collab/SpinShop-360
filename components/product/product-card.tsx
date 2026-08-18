"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, ShoppingCart } from "lucide-react";
import type { Product } from "@/types/product";
import { ProductBadge } from "./product-badge";
import { PriceDisplay } from "./price-display";
import { RatingStars } from "./rating-stars";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { useCartStore } from "@/lib/stores/cart-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { productCanUse3D, productCanUseAr } from "@/lib/product-3d-assets";
import { cn } from "@/lib/utils";

export function ProductCard({ product, view = "grid" }: { product: Product; view?: "grid" | "list" }) {
  const isWishlisted = useWishlistStore((state) => state.isWishlisted(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const addItem = useCartStore((state) => state.addItem);
  const pushToast = useToastStore((state) => state.push);
  const canUse3D = productCanUse3D(product);
  const canUseAr = productCanUseAr(product);

  function handleWishlist() {
    const nowInWishlist = toggleWishlist(product.id);
    pushToast(nowInWishlist ? "เพิ่มในรายการโปรดแล้ว" : "นำออกจากรายการโปรดแล้ว", "success");
  }

  function handleQuickAdd() {
    if (product.options.length > 0) {
      pushToast("กรุณาเลือกตัวเลือกสินค้าในหน้ารายละเอียดก่อน", "info");
      return;
    }

    const variant = product.variants[0];
    if (!variant) {
      pushToast("สินค้านี้ยังไม่มีตัวเลือกที่พร้อมจำหน่าย", "error");
      return;
    }

    const result = addItem({
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      variantLabel: "-",
      slug: product.slug,
      imageUrl: product.images[0]?.url ?? product.fallbackImageUrl,
      unitPrice: variant.price,
      compareAtPrice: variant.compareAtPrice,
      quantity: 1,
      stockQuantity: variant.stockQuantity,
    });
    pushToast(result.message, result.ok ? "success" : "error");
  }

  const href = `/products/${product.slug}`;

  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_10px_28px_-24px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_18px_38px_-24px_rgba(17,108,255,0.36)] focus-within:border-primary/30",
        view === "grid" ? "flex-col" : "flex-row items-stretch gap-4"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-surface-secondary/75",
          view === "grid" ? "aspect-[1.04/1] w-full" : "aspect-square w-40 shrink-0 sm:w-52"
        )}
      >
        <Image
          src={product.images[0]?.url ?? product.fallbackImageUrl}
          alt={product.images[0]?.altText ?? product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.06]"
        />
        <Link href={href} className="focus-ring absolute inset-0 z-10 rounded-xl" aria-label={`ดูรายละเอียด ${product.name}`} />

        <div className="pointer-events-none absolute left-2 top-2 z-20 flex flex-wrap gap-1">
          {product.supports360 && <ProductBadge kind="360" />}
          {canUse3D && <ProductBadge kind="3d" />}
          {canUseAr && <ProductBadge kind="ar" />}
        </div>

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isWishlisted ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
          aria-pressed={isWishlisted}
          className="focus-ring absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-surface/90 text-foreground shadow-sm backdrop-blur-glass transition-colors hover:text-danger"
        >
          <Heart className={cn("h-3.5 w-3.5", isWishlisted && "fill-danger text-danger")} />
        </button>

        <div className="absolute inset-x-2 bottom-2 z-20 flex translate-y-0 gap-1.5 opacity-100 transition-all duration-300 sm:translate-y-8 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={handleQuickAdd}
            className="focus-ring flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-2 text-[11px] font-semibold text-white shadow-lg transition-colors hover:bg-primary-hover"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            เพิ่มตะกร้า
          </button>
          <Link
            href={href}
            aria-label={`เปิดหน้าสินค้า ${product.name}`}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface/95 text-foreground shadow-sm backdrop-blur-glass"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <Link href={href} className="focus-ring flex flex-1 flex-col rounded-xl p-3.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted">{product.brand}</span>
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground">{product.name}</h3>
        <div className="mt-2">
          <PriceDisplay price={product.basePrice} compareAtPrice={product.compareAtPrice} size="sm" />
        </div>
        <div className="mt-2">
          <RatingStars rating={product.reviewSummary.average} count={product.reviewSummary.count} />
        </div>
      </Link>
    </article>
  );
}
