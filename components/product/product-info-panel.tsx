"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { Product } from "@/types/product";
import { PriceDisplay } from "./price-display";
import { RatingStars } from "./rating-stars";
import { QuantitySelector } from "./quantity-selector";
import { VariantSelector } from "./variant-selector";
import { findVariant } from "@/lib/services/products";
import { useCartStore } from "@/lib/stores/cart-store";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { formatCurrency, cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

export function ProductInfoPanel({ product }: { product: Product }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    product.options.forEach((option) => {
      const firstAvailable = option.values.find((value) =>
        product.variants.some(
          (variant) => variant.optionValueIds.includes(value.id) && variant.stockQuantity > 0
        )
      );
      if (firstAvailable) initial[option.id] = firstAvailable.id;
    });
    return initial;
  });
  const [quantity, setQuantity] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const isWishlisted = useWishlistStore((state) => state.isWishlisted(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const pushToast = useToastStore((state) => state.push);

  const selectedValueIds = useMemo(() => Object.values(selected), [selected]);
  const activeVariant = useMemo(
    () => findVariant(product, selectedValueIds),
    [product, selectedValueIds]
  );

  const allOptionsSelected = product.options.every((option) => selected[option.id]);
  const inStock = (activeVariant?.stockQuantity ?? 0) > 0;

  function isValueAvailable(optionId: string, valueId: string) {
    const candidateSelection = { ...selected, [optionId]: valueId };
    const candidateIds = Object.values(candidateSelection);
    const variant = product.variants.find(
      (item) =>
        candidateIds.every((id) => item.optionValueIds.includes(id)) &&
        item.optionValueIds.length <= candidateIds.length
    );
    return (variant?.stockQuantity ?? 0) > 0;
  }

  function handleSelect(optionId: string, valueId: string) {
    setSelected((previous) => ({ ...previous, [optionId]: valueId }));
    setValidationError(null);
    track("variant_select", { productId: product.id, optionId, valueId });
  }

  function variantLabel() {
    return (
      product.options
        .map((option) => option.values.find((value) => value.id === selected[option.id])?.value)
        .filter(Boolean)
        .join(" / ") || "-"
    );
  }

  function handleAddToCart(buyNow = false) {
    if (!allOptionsSelected || !activeVariant) {
      setValidationError("กรุณาเลือกตัวเลือกสินค้าให้ครบก่อนเพิ่มลงตะกร้า");
      return;
    }

    const result = addItem({
      productId: product.id,
      variantId: activeVariant.id,
      productName: product.name,
      variantLabel: variantLabel(),
      slug: product.slug,
      imageUrl: activeVariant.imageUrl ?? product.images[0]?.url ?? product.fallbackImageUrl,
      unitPrice: activeVariant.price,
      compareAtPrice: activeVariant.compareAtPrice,
      quantity,
      stockQuantity: activeVariant.stockQuantity,
    });
    pushToast(result.message, result.ok ? "success" : "error");
    if (result.ok) {
      if (buyNow) router.push("/checkout");
      else openDrawer();
    }
  }

  function handleWishlist() {
    const nowInWishlist = toggleWishlist(product.id);
    pushToast(
      nowInWishlist ? "เพิ่มในรายการโปรดแล้ว" : "นำออกจากรายการโปรดแล้ว",
      "success"
    );
  }

  async function handleShare() {
    const url = window.location.href;
    const shareNavigator = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };

    if (shareNavigator.share) {
      try {
        await shareNavigator.share({ title: product.name, text: product.shortDescription, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      pushToast("คัดลอกลิงก์สินค้าแล้ว", "success");
    } catch {
      pushToast("ไม่สามารถแชร์สินค้าได้ กรุณาคัดลอก URL จากเบราว์เซอร์", "error");
    }
  }

  const price = activeVariant?.price ?? product.basePrice;
  const compareAtPrice = activeVariant?.compareAtPrice ?? product.compareAtPrice;

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="breadcrumb" className="flex items-center gap-1 text-xs text-muted">
        <Link href="/" className="hover:text-foreground">หน้าแรก</Link>
        <ChevronRight aria-hidden="true" className="h-3 w-3" />
        <Link href={`/products?category=${product.categorySlug}`} className="hover:text-foreground">
          {product.category}
        </Link>
        <ChevronRight aria-hidden="true" className="h-3 w-3" />
        <span className="line-clamp-1 text-foreground">{product.name}</span>
      </nav>

      <div>
        <span className="text-sm text-muted">{product.brand}</span>
        <h1 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">{product.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <RatingStars rating={product.reviewSummary.average} count={product.reviewSummary.count} size="md" />
          <span className="text-xs text-muted">ขายแล้ว {product.soldCount} ชิ้น</span>
          <span className="text-xs text-muted">SKU: {activeVariant?.sku ?? product.sku}</span>
        </div>
      </div>

      <PriceDisplay price={price} compareAtPrice={compareAtPrice} size="lg" />

      {!inStock && allOptionsSelected ? (
        <p className="text-sm font-medium text-danger">สินค้าหมด</p>
      ) : (
        <p className="text-sm text-muted">
          เหลือ <span className="font-medium text-foreground">{activeVariant?.stockQuantity ?? product.stockQuantity}</span> ชิ้น
        </p>
      )}

      <p className="text-sm leading-relaxed text-muted">{product.shortDescription}</p>

      <VariantSelector
        options={product.options}
        selected={selected}
        onSelect={handleSelect}
        isValueAvailable={isValueAvailable}
      />

      {validationError && (
        <p role="alert" className="text-sm font-medium text-danger">{validationError}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <QuantitySelector
          value={quantity}
          max={Math.max(1, activeVariant?.stockQuantity ?? 1)}
          onChange={setQuantity}
        />
        <button
          type="button"
          onClick={handleWishlist}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground hover:border-danger/40 hover:text-danger"
          aria-label={isWishlisted ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
          aria-pressed={isWishlisted}
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-danger text-danger")} />
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground hover:border-primary/40"
          aria-label="แชร์สินค้า"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      <div className="hidden gap-3 sm:flex">
        <button
          type="button"
          onClick={() => handleAddToCart(false)}
          disabled={!inStock}
          className="focus-ring flex-1 rounded-xl border border-primary/50 bg-primary/10 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          เพิ่มลงตะกร้า
        </button>
        <button
          type="button"
          onClick={() => handleAddToCart(true)}
          disabled={!inStock}
          className="focus-ring flex-1 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          ซื้อทันที
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 text-sm sm:grid-cols-3">
        <InfoRow icon={Truck} label="จัดส่ง" value={`${product.shippingEtaDays[0]}-${product.shippingEtaDays[1]} วันทำการ`} />
        <InfoRow icon={ShieldCheck} label="รับประกัน" value="รับประกันสินค้า 1 ปี" />
        <InfoRow icon={RotateCcw} label="คืนสินค้า" value="คืนได้ภายใน 7 วัน" />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-background/95 p-3 backdrop-blur-glass sm:hidden">
        <div className="flex-1">
          <p className="text-xs text-muted">ราคา</p>
          <p className="text-base font-semibold text-foreground">{formatCurrency(price)}</p>
        </div>
        <button
          type="button"
          onClick={() => handleAddToCart(false)}
          disabled={!inStock}
          className="focus-ring rounded-xl border border-primary/50 bg-primary/10 px-4 py-3 text-sm font-medium text-primary disabled:opacity-40"
        >
          ใส่ตะกร้า
        </button>
        <button
          type="button"
          onClick={() => handleAddToCart(true)}
          disabled={!inStock}
          className="focus-ring rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
        >
          ซื้อทันที
        </button>
      </div>
      <div className="h-16 sm:hidden" aria-hidden="true" />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-xs font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
