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
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);
  const pushToast = useToastStore((s) => s.push);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    const nowIn = toggleWishlist(product.id);
    pushToast(nowIn ? "เพิ่มในรายการโปรดแล้ว" : "นำออกจากรายการโปรดแล้ว", "success");
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.options.length > 0) {
      pushToast("กรุณาเลือกตัวเลือกสินค้าในหน้ารายละเอียดก่อน", "info");
      return;
    }
    const variant = product.variants[0];
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
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group focus-ring relative flex overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow",
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
          className="object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.supports3d && <ProductBadge type="3d" />}
          {product.supports360 && <ProductBadge type="360" />}
          {product.supportsAr && <ProductBadge type="ar" />}
        </div>
        <button
          onClick={handleWishlist}
          className="focus-ring absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-glass transition-colors hover:text-danger"
          aria-label="เพิ่มในรายการโปรด"
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-danger text-danger")} />
        </button>
        <div className="absolute inset-x-2 bottom-2 flex translate-y-8 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={handleQuickAdd}
            className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            เพิ่มตะกร้า
          </button>
          <span className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg bg-background/70 text-foreground backdrop-blur-glass">
            <Eye className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <span className="text-xs text-muted">{product.brand}</span>
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">{product.name}</h3>
        <RatingStars rating={product.reviewSummary.average} count={product.reviewSummary.count} />
        <div className="mt-auto pt-1">
          <PriceDisplay price={product.basePrice} compareAtPrice={product.compareAtPrice} size="sm" />
        </div>
      </div>
    </Link>
  );
}
