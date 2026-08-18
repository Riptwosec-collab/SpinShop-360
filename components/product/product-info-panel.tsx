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
    <div className="flex flex-col gap-4 lg:pl-2">
      <nav aria-label="breadcrumb" className="flex items-center gap-1 text-[11px] text-muted">
        <Link href="/" className="hover:text-foreground">หน้าแรก</Link>
        <ChevronRight aria-hidden="true" className="h-3 w-3" />
        <Link href={`/products?category=${product.categorySlug}`} className="hover:text-foreground">
          {product.category}
        </Link>
        <ChevronRight aria-hidden="true" className="h-3 w-3" />
        <span className="line-clamp-1 text-foreground">{product.name}</span>
      </nav>

      <div>
        <span className="text-xs font-medium text-muted">{product.brand}</span>
        <h1 className="mt-1 text-2xl font-bold tracking-[-0.035em] text-foreground sm:text-3xl lg:text-[34px]">{product.name}</h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <RatingStars rating={product.reviewSummary.average} count={product.reviewSummary.count} size="md" />
          <span className="text-[11px] text-muted">ขายแล้ว {product.soldCount} ชิ้น</span>
          <span className="text-[11px] text-muted">SKU: {activeVariant?.sku ?? product.sku}</span>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-secondary/65 px-4 py-3">
        <PriceDisplay price={price} compareAtPrice={compareAtPrice} size="lg" />
        <p className="mt-1 text-[11px] text-muted">ราคาสุทธิจะยืนยันอีกครั้งในขั้นตอนชำระเงิน</p>
      </div>

      <p className="text-sm leading-6 text-muted">{product.shortDescription}</p>

      <div className="border-t border-border pt-4">
        <VariantSelector
          options={product.options}
          selected={selected}
          onSelect={handleSelect}
          isValueAvailable={isValueAvailable}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">จำนวน</p>
          <QuantitySelector
            value={quantity}
            max={Math.max(1, activeVariant?.stockQuantity ?? 1)}
            onChange={setQuantity}
          />
        </div>
        <div className="flex items-end gap-2 pt-5">
          <button
            type="button"
            onClick={handleWishlist}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground shadow-sm hover:border-danger/40 hover:text-danger"
            aria-label={isWishlisted ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
            aria-pressed={isWishlisted}
          >
            <Heart className={cn("h-4 w-4", isWishlisted && "fill-danger text-danger")} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground shadow-sm hover:border-primary/40"
            aria-label="แชร์สินค้า"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {validationError && (
        <p role="alert" className="rounded-xl bg-danger/8 px-3 py-2 text-xs font-medium text-danger">{validationError}</p>
      )}

      <div className="flex items-center justify-between text-xs">
        {!inStock && allOptionsSelected ? (
          <span className="font-semibold text-danger">สินค้าหมด</span>
        ) : (
          <span className="text-muted">
            สินค้าคงเหลือ <span className="font-semibold text-foreground">{activeVariant?.stockQuantity ?? product.stockQuantity}</span> ชิ้น
          </span>
        )}
      </div>

      <div className="hidden grid-cols-1 gap-2 sm:grid">
        <button
          type="button"
          onClick={() => handleAddToCart(false)}
          disabled={!inStock}
          className="focus-ring rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-[0_14px_28px_-16px_rgba(17,108,255,0.75)] transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          เพิ่มลงตะกร้า
        </button>
        <button
          type="button"
          onClick={() => handleAddToCart(true)}
          disabled={!inStock}
          className="focus-ring rounded-xl bg-slate-950 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          ซื้อทันที
        </button>
      </div>

      <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-border bg-surface">
        <InfoRow icon={Truck} label="จัดส่ง" value={`${product.shippingEtaDays[0]}-${product.shippingEtaDays[1]} วัน`} />
        <InfoRow icon={ShieldCheck} label="รับประกัน" value="1 ปี" />
        <InfoRow icon={RotateCcw} label="คืนสินค้า" value="ภายใน 7 วัน" />
      </div>

      <div className="fixed inset-x-0 bottom-[60px] z-30 flex items-center gap-2 border-t border-border bg-surface/95 p-3 shadow-[0_-12px_28px_-22px_rgba(15,23,42,0.5)] backdrop-blur-xl sm:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted">ราคา</p>
          <p className="truncate text-base font-bold text-foreground">{formatCurrency(price)}</p>
        </div>
        <button
          type="button"
          onClick={() => handleAddToCart(false)}
          disabled={!inStock}
          className="focus-ring rounded-xl bg-primary px-4 py-3 text-xs font-semibold text-white disabled:opacity-40"
        >
          ใส่ตะกร้า
        </button>
        <button
          type="button"
          onClick={() => handleAddToCart(true)}
          disabled={!inStock}
          className="focus-ring rounded-xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-slate-950"
        >
          ซื้อทันที
        </button>
      </div>
      <div className="h-20 sm:hidden" aria-hidden="true" />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 border-r border-border px-2 py-3 text-center last:border-r-0 sm:flex-row sm:text-left">
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-[9px] text-muted sm:text-[10px]">{label}</p>
        <p className="truncate text-[10px] font-semibold text-foreground sm:text-[11px]">{value}</p>
      </div>
    </div>
  );
}
