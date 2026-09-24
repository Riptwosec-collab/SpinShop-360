"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, ArrowUpRight, Check, GitCompareArrows } from "lucide-react";
import type { Product } from "@/types/product";
import { ProductBadge } from "./product-badge";
import { PriceDisplay } from "./price-display";
import { RatingStars } from "./rating-stars";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { useCartStore } from "@/lib/stores/cart-store";
import { useCompareStore } from "@/lib/stores/compare-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { useTranslation } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function ProductCard({ product, view = "grid" }: { product: Product; view?: "grid" | "list" }) {
  const { locale, t } = useTranslation();
  const en = locale === "en";
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const comparing = useCompareStore((s) => s.productIds.includes(product.id));
  const toggleCompare = useCompareStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);
  const pushToast = useToastStore((s) => s.push);
  const variant = product.variants.find((v) => v.isActive && v.stockQuantity > 0);
  const inStock = product.status === "active" && !!variant;
  const href = `/products/${product.slug}`;

  function handleQuickAdd() {
    if (!variant) return;
    const result = addItem({ productId: product.id, variantId: variant.id, productName: product.name,
      variantLabel: "-", slug: product.slug, imageUrl: variant.imageUrl ?? product.images[0]?.url ?? product.fallbackImageUrl,
      unitPrice: variant.price, compareAtPrice: variant.compareAtPrice, quantity: 1, stockQuantity: variant.stockQuantity });
    pushToast(result.message, result.ok ? "success" : "error");
  }

  return <article className={cn("group relative flex min-w-0 overflow-hidden rounded-2xl border border-border bg-surface transition duration-300 hover:border-accent/35 hover:shadow-glow motion-safe:hover:-translate-y-1", view === "grid" ? "flex-col" : "flex-row items-stretch")}>
    <div className={cn("relative shrink-0 overflow-hidden bg-surface-secondary", view === "grid" ? "aspect-square w-full" : "w-[34%] sm:w-48")}>
      <Link href={href} className="focus-ring relative block h-full min-h-40 w-full" aria-label={product.name}>
        <Image src={product.images[0]?.url ?? product.fallbackImageUrl} alt={product.images[0]?.altText ?? product.name} fill sizes={view === "list" ? "(max-width: 640px) 34vw, 192px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"} className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
      </Link>
      <div className="pointer-events-none absolute left-2 top-2 flex max-w-[65%] flex-wrap gap-1">
        {product.supports3d && <ProductBadge type="3d" />}{product.supports360 && <ProductBadge type="360" />}{product.supportsAr && <ProductBadge type="ar" />}
      </div>
      <button onClick={() => { const added = toggleWishlist(product.id); pushToast(added ? t.product.addedToWishlist : t.product.removedFromWishlist, "success"); }}
        className="focus-ring absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-background/90 backdrop-blur-glass transition hover:text-danger"
        aria-label={t.common.wishlist} aria-pressed={isWishlisted}><Heart className={cn("h-4 w-4", isWishlisted && "fill-danger text-danger")} /></button>
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-1 text-[10px]"><span className="uppercase tracking-widest text-muted">{product.brand}</span><span className={cn("flex items-center gap-1", inStock ? "text-success" : "text-danger")}>{inStock && <span className="h-1 w-1 rounded-full bg-success" />}{inStock ? t.common.inStock : t.common.outOfStock}</span></div>
      <h3 className="min-h-10 text-sm font-semibold leading-5"><Link href={href} className="focus-ring line-clamp-2 rounded hover:text-accent">{product.name}</Link></h3>
      <RatingStars rating={product.reviewSummary.average} count={product.reviewSummary.count} />
      <div className="mt-auto pb-1 pt-2"><PriceDisplay price={product.basePrice} compareAtPrice={product.compareAtPrice} size="sm" /></div>
      <div className="flex items-center gap-2 border-t border-border/70 pt-3">
        {product.options.length > 0 && inStock ? <Link href={href} className="primary-action min-w-0 flex-1 px-2 py-2 text-xs">{en ? "Choose options" : "เลือกตัวเลือก"}<ArrowUpRight className="hidden h-3.5 w-3.5 shrink-0 sm:block" /></Link> : <button onClick={handleQuickAdd} disabled={!inStock} className="primary-action min-w-0 flex-1 px-2 py-2 text-xs"><ShoppingCart className="hidden h-3.5 w-3.5 shrink-0 sm:block" />{inStock ? t.common.addToCart : t.common.outOfStock}</button>}
        <button aria-label={t.nav.compare} aria-pressed={comparing} onClick={() => { const result = toggleCompare(product.id); pushToast(result.message, result.ok ? "success" : "error"); }} className={cn("icon-action h-11 w-10 border border-border", comparing && "border-accent/40 text-accent")} title={t.nav.compare}>{comparing ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}</button>
      </div>
    </div>
  </article>;
}
