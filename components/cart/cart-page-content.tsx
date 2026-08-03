"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, Tag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/stores/cart-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { formatCurrency } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n/locale-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export function CartPageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const couponCode = useCartStore((s) => s.couponCode);
  const discount = useCartStore((s) => s.discount);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const clearCoupon = useCartStore((s) => s.clearCoupon);
  const subtotal = useCartStore((s) => s.subtotal());
  const shippingFee = useCartStore((s) => s.shippingFee());
  const total = useCartStore((s) => s.total());
  const pushToast = useToastStore((s) => s.push);

  const [couponInput, setCouponInput] = useState("");
  const [applying, setApplying] = useState(false);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setApplying(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotal }),
      });
      const result = await res.json();
      if (result.ok && result.discount != null) {
        applyCoupon(couponInput.toUpperCase(), result.discount);
        pushToast(result.message, "success");
        track("coupon_apply", { code: couponInput.toUpperCase(), discount: result.discount });
      } else {
        pushToast(result.message ?? "ไม่สามารถใช้คูปองนี้ได้", "error");
      }
    } catch {
      pushToast("เกิดข้อผิดพลาดในการตรวจสอบคูปอง กรุณาลองใหม่", "error");
    } finally {
      setApplying(false);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={t.cart.empty}
        description={t.cart.emptyDesc}
        actionHref="/products"
        actionLabel="เลือกซื้อสินค้า"
      />
    );
  }

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {remaining > 0 ? (
          <p className="mb-4 text-sm text-muted">
            ซื้อเพิ่มอีก <span className="font-medium text-foreground">{formatCurrency(remaining)}</span> เพื่อรับสิทธิ์จัดส่งฟรี
          </p>
        ) : (
          <p className="mb-4 text-sm font-medium text-success">คุณได้รับสิทธิ์จัดส่งฟรีแล้ว 🎉</p>
        )}

        <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-secondary">
                <Image src={item.imageUrl} alt={item.productName} fill sizes="96px" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <Link href={`/products/${item.slug}`} className="focus-ring text-sm font-medium text-foreground hover:text-primary">
                  {item.productName}
                </Link>
                {item.variantLabel !== "-" && <span className="text-xs text-muted">{item.variantLabel}</span>}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="focus-ring p-2 text-muted hover:text-foreground"
                      aria-label="ลดจำนวน"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stockQuantity}
                      className="focus-ring p-2 text-muted hover:text-foreground disabled:opacity-30"
                      aria-label="เพิ่มจำนวน"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</span>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                aria-label="ลบสินค้า"
                className="focus-ring self-start text-muted hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-base font-semibold text-foreground">สรุปคำสั่งซื้อ</h2>

        {couponCode ? (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm">
            <span className="flex items-center gap-1.5 text-success">
              <Tag className="h-3.5 w-3.5" /> {couponCode}
            </span>
            <button onClick={clearCoupon} aria-label="ลบคูปอง" className="text-muted hover:text-danger">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="mb-4 flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder={t.cart.couponPlaceholder}
              className="focus-ring flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={applying}
              className="focus-ring shrink-0 rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
            >
              {applying ? "กำลังตรวจสอบ..." : t.cart.applyCoupon}
            </button>
          </div>
        )}

        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{t.cart.subtotal}</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t.cart.shipping}</dt>
            <dd>{shippingFee === 0 ? t.cart.free : formatCurrency(shippingFee)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-success">
              <dt>{t.cart.discount}</dt>
              <dd>-{formatCurrency(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
            <dt>{t.cart.grandTotal}</dt>
            <dd>{formatCurrency(total)}</dd>
          </div>
        </dl>

        <button
          onClick={() => router.push("/checkout")}
          className="focus-ring mt-5 w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          {t.cart.checkout}
        </button>
        <Link
          href="/products"
          className="focus-ring mt-3 block text-center text-sm text-muted hover:text-foreground"
        >
          {t.cart.continueShopping}
        </Link>
      </div>
    </div>
  );
}
