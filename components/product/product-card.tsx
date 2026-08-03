"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import type { Product } from "@/types/product";
import { ProductBadge } from "./product-badge";
import { PriceDisplay } from "./price-display";
import { RatingStars } from "./rating-stars";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { useCartStore } from "@/lib/stores/cart-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils";

export function ProductCard({ product, view = "grid" }: { product: Product; view?: "grid" | "list" }) {
  const isWishlisted = useWishlistStore((state) => state.isWishlisted(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const addItem = useCartStore((state) => state.addItem);
  const pushToast = useToastStore((state) => state.push);

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
        "group relative flex overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow focus-within:border-primary/40 focus-within:shadow-glow",
        view === "grid" ? "flex-col" : "flex-row items-stretch gap-4"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-surface-secondary",
          view === "grid" ? "aspect-square w-full" : "aspect-square w-40 shrink-0 sm:w-52"
        )}
      >
        <Image
          src={product.images[0]?.url ?? product.fallbackImageUrl}
          alt={product.images[0]?.altText ?? product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
        />
        <Link href={href} className="focus-ring absolute inset-0 z-10 rounded-xl" aria-label={`ดูรายละเอียด ${product.name}`} />

        <div className="pointer-events-none absolute left-2 top-2 z-20 flex flex-col gap-1">
          {product.supports3d && <ProductBadge kind="3d" />}
          {product.supports360 && <ProductBadge kind="360" />}
          {product.supportsAr && <ProductBadge kind="ar" />}
        </div>

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isWishlisted ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
          aria-pressed={isWishlisted}
          className="focus-ring absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-glass transition-colors hover:text-danger"
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-danger text-danger")} />
        </button>

        <div className="absolute inset-x-2 bottom-2 z-20 flex translate-y-0 gap-2 opacity-100 transition-all duration-300 sm:translate-y-8 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={handleQuickAdd}
            className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            เพิ่มตะกร้า
          </button>
          <Link
            href={href}
            aria-label={`เปิดหน้าสินค้า ${product.name}`}
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-foreground backdrop-blur-glass"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <Link href={href} className="focus-ring flex flex-1 flex-col gap-1.5 rounded-xl p-3.5">
        <span className="text-xs text-muted">{product.brand}</span>
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">{product.name}</h3>
        <RatingStars rating={product.reviewSummary.average} count={product.reviewSummary.count} />
        <div className="mt-auto pt-1">
          <PriceDisplay price={product.basePrice} compareAtPrice={product.compareAtPrice} size="sm" />
        </div>
      </Link>
    </article>
  );
}
