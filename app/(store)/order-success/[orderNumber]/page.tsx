"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getMockOrder } from "@/lib/services/orders";
import type { Order } from "@/types/order";
import { formatCurrency, formatOrderDate } from "@/lib/utils";
import { ORDER_STATUS_LABEL, USE_MOCK_DATA } from "@/lib/constants";

function mapSupabaseOrder(row: Record<string, unknown>): Order {
  const items = (row.order_items as Record<string, unknown>[] | undefined) ?? [];
  return {
    id: row.id as string,
    orderNumber: row.order_number as string,
    email: row.email as string,
    phone: row.phone as string,
    status: row.status as Order["status"],
    items: items.map((i) => ({
      productId: (i.product_id as string) ?? "",
      variantId: (i.variant_id as string) ?? "",
      productName: i.product_name as string,
      sku: i.sku as string,
      variantName: (i.variant_name as string) ?? "",
      imageUrl: (i.image_url as string) ?? "",
      unitPrice: Number(i.unit_price),
      quantity: Number(i.quantity),
      lineTotal: Number(i.line_total),
    })),
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discount_amount),
    shippingFee: Number(row.shipping_fee),
    taxAmount: Number(row.tax_amount ?? 0),
    grandTotal: Number(row.grand_total),
    couponCode: row.coupon_code as string | null,
    shippingAddress: row.shipping_address as Order["shippingAddress"],
    paymentMethod: row.payment_method as Order["paymentMethod"],
    shippingMethod: row.shipping_method as string,
    customerNote: row.customer_note as string | undefined,
    createdAt: row.created_at as string,
  };
}

export default function OrderSuccessPage({ params }: { params: { orderNumber: string } }) {
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    const mockOrder = getMockOrder(params.orderNumber);
    if (mockOrder || USE_MOCK_DATA) {
      setOrder(mockOrder);
      return;
    }
    // Supabase mode: mock storage won't have it — fetch from the API.
    fetch(`/api/orders/${params.orderNumber}`)
      .then((res) => res.json())
      .then((data) => setOrder(data.ok ? mapSupabaseOrder(data.order) : null))
      .catch(() => setOrder(null));
  }, [params.orderNumber]);

  if (order === undefined) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted">กำลังโหลด...</div>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted">ไม่พบคำสั่งซื้อนี้</p>
        <Link href="/products" className="focus-ring mt-4 inline-block text-primary">
          กลับไปเลือกซื้อสินค้า
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-9 w-9" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">สั่งซื้อสำเร็จ!</h1>
        <p className="mt-1 text-sm text-muted">ขอบคุณสำหรับการสั่งซื้อ เราจะจัดส่งสินค้าให้เร็วที่สุด</p>
        <p className="mt-3 rounded-lg bg-surface px-4 py-2 text-sm font-medium text-foreground">
          เลขที่คำสั่งซื้อ: {order.orderNumber}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted">สถานะ</span>
          <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
            {ORDER_STATUS_LABEL[order.status]}
          </span>
        </div>
        <ul className="mb-4 flex flex-col gap-2 divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.variantId} className="flex justify-between py-2 text-sm">
              <span className="text-muted">
                {item.productName} x{item.quantity}
              </span>
              <span className="font-medium">{formatCurrency(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
          <Row label="ยอดรวมสินค้า" value={formatCurrency(order.subtotal)} />
          <Row label="ค่าจัดส่ง" value={order.shippingFee === 0 ? "ฟรี" : formatCurrency(order.shippingFee)} />
          {order.discountAmount > 0 && <Row label="ส่วนลด" value={`-${formatCurrency(order.discountAmount)}`} />}
          <Row label="ยอดชำระทั้งหมด" value={formatCurrency(order.grandTotal)} bold />
        </dl>
        <div className="mt-4 border-t border-border pt-3 text-sm text-muted">
          <p>วิธีชำระเงิน: {order.paymentMethod}</p>
          <p>
            จัดส่งไปที่: {order.shippingAddress.recipientName}, {order.shippingAddress.addressLine1}, {order.shippingAddress.subdistrict} {order.shippingAddress.district} {order.shippingAddress.province} {order.shippingAddress.postalCode}
          </p>
          <p>สั่งซื้อเมื่อ: {formatOrderDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/account"
          className="focus-ring flex-1 rounded-xl border border-border py-3 text-center text-sm font-medium text-foreground hover:border-primary/40"
        >
          ดูคำสั่งซื้อของฉัน
        </Link>
        <Link
          href="/products"
          className="focus-ring flex-1 rounded-xl bg-primary py-3 text-center text-sm font-medium text-white hover:bg-primary-hover"
        >
          เลือกซื้อสินค้าต่อ
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-semibold text-foreground" : ""}`}>
      <span className={bold ? "" : "text-muted"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
