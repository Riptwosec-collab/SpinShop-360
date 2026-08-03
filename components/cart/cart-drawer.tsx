"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isDrawerOpen);
  const close = useCartStore((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className={cn("fixed inset-0 z-[60]", isOpen ? "pointer-events-auto" : "pointer-events-none")}>
      <div
        className={cn("absolute inset-0 bg-black/60 transition-opacity", isOpen ? "opacity-100" : "opacity-0")}
        onClick={close}
      />
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-background transition-transform",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-label="ตะกร้าสินค้า"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-base font-semibold">ตะกร้าสินค้า ({items.length})</h2>
          <button onClick={close} className="focus-ring rounded-lg p-2 text-muted hover:text-foreground" aria-label="ปิดตะกร้า">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <ShoppingBag className="h-10 w-10 text-muted" />
            <p className="text-sm text-muted">ตะกร้าของคุณยังว่างอยู่</p>
            <button
              onClick={close}
              className="focus-ring rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              เลือกซื้อสินค้า
            </button>
          </div>
        ) : (
          <>
            <div className="border-b border-border p-4">
              {remainingForFreeShipping > 0 ? (
                <p className="text-xs text-muted">
                  ซื้อเพิ่มอีก <span className="font-medium text-foreground">{formatCurrency(remainingForFreeShipping)}</span> เพื่อรับส่งฟรี
                </p>
              ) : (
                <p className="text-xs font-medium text-success">คุณได้รับสิทธิ์จัดส่งฟรีแล้ว 🎉</p>
              )}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <ul className="flex flex-col gap-4">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-secondary">
                      <Image src={item.imageUrl} alt={item.productName} fill sizes="80px" className="object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <Link href={`/products/${item.slug}`} onClick={close} className="focus-ring line-clamp-1 text-sm font-medium">
                        {item.productName}
                      </Link>
                      {item.variantLabel !== "-" && (
                        <span className="text-xs text-muted">{item.variantLabel}</span>
                      )}
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-border">
                          <button
                            className="focus-ring p-1.5 text-muted hover:text-foreground"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="ลดจำนวน"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs">{item.quantity}</span>
                          <button
                            className="focus-ring p-1.5 text-muted hover:text-foreground"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="เพิ่มจำนวน"
                            disabled={item.quantity >= item.stockQuantity}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-medium">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="focus-ring self-start text-muted hover:text-danger"
                      aria-label="ลบสินค้า"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border p-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-muted">ยอดรวมสินค้า</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <Link
                href="/cart"
                onClick={close}
                className="focus-ring block w-full rounded-lg bg-primary py-3 text-center text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                ไปที่ตะกร้าสินค้า
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
