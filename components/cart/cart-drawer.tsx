"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, Trash2, ShoppingBag, Truck } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const isOpen = useCartStore((state) => state.isDrawerOpen);
  const close = useCartStore((state) => state.closeDrawer);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const subtotal = useCartStore((state) => state.subtotal());

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className={cn("fixed inset-0 z-[60]", isOpen ? "pointer-events-auto" : "pointer-events-none")}>
      <div
        className={cn("absolute inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity", isOpen ? "opacity-100" : "opacity-0")}
        onClick={close}
      />
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="ตะกร้าสินค้า"
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <div>
            <h2 className="text-base font-bold tracking-[-0.02em]">Your Cart <span className="text-muted">({items.length})</span></h2>
            <p className="text-[10px] text-muted">ตรวจสอบสินค้าก่อนชำระเงิน</p>
          </div>
          <button onClick={close} className="focus-ring rounded-xl border border-border p-2 text-muted hover:text-foreground" aria-label="ปิดตะกร้า">
            <X className="h-4 w-4" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-secondary">
              <ShoppingBag className="h-7 w-7 text-muted" />
            </span>
            <p className="text-sm font-semibold text-foreground">ตะกร้าของคุณยังว่างอยู่</p>
            <p className="max-w-xs text-xs leading-5 text-muted">เลือกสินค้าที่สนใจแล้วเพิ่มลงตะกร้าเพื่อเริ่มสั่งซื้อ</p>
            <Link
              href="/products"
              onClick={close}
              className="focus-ring mt-1 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white hover:bg-primary-hover"
            >
              เลือกซื้อสินค้า
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto px-5 py-4">
              <ul className="flex flex-col divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3 py-4 first:pt-0">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-secondary">
                      <Image src={item.imageUrl} alt={item.productName} fill sizes="80px" className="object-contain p-1.5" />
                    </div>
                    <div className="min-w-0 flex flex-1 flex-col">
                      <Link href={`/products/${item.slug}`} onClick={close} className="focus-ring line-clamp-2 text-xs font-semibold leading-5 text-foreground">
                        {item.productName}
                      </Link>
                      {item.variantLabel !== "-" && (
                        <span className="mt-0.5 text-[10px] text-muted">{item.variantLabel}</span>
                      )}
                      <div className="mt-auto flex items-end justify-between gap-2">
                        <div className="flex h-8 items-center rounded-lg border border-border bg-surface">
                          <button
                            className="focus-ring p-2 text-muted hover:text-foreground"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="ลดจำนวน"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-[11px] font-semibold">{item.quantity}</span>
                          <button
                            className="focus-ring p-2 text-muted hover:text-foreground disabled:opacity-35"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="เพิ่มจำนวน"
                            disabled={item.quantity >= item.stockQuantity}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-xs font-bold text-foreground">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="focus-ring self-start rounded-lg p-1.5 text-muted hover:bg-danger/5 hover:text-danger"
                      aria-label="ลบสินค้า"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border bg-surface-secondary/45 px-5 py-4">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Shipping</span>
                  <span className="font-medium text-muted">คำนวณที่ Checkout</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-base font-bold text-foreground">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <Link
                  href="/cart"
                  onClick={close}
                  className="focus-ring block w-full rounded-xl bg-primary py-3 text-center text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={close}
                  className="focus-ring block w-full rounded-xl border border-border bg-surface py-3 text-center text-xs font-semibold text-foreground transition-colors hover:bg-surface-secondary"
                >
                  Checkout
                </Link>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-surface px-3 py-3">
                <div className="flex items-start gap-2.5">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    {remainingForFreeShipping > 0 ? (
                      <p className="text-[10px] text-muted">
                        ซื้อเพิ่มอีก <span className="font-semibold text-foreground">{formatCurrency(remainingForFreeShipping)}</span> เพื่อรับส่งฟรี
                      </p>
                    ) : (
                      <p className="text-[10px] font-semibold text-success">คุณได้รับสิทธิ์จัดส่งฟรีแล้ว</p>
                    )}
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
