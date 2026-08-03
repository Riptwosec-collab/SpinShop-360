"use client";

import { useEffect, useState } from "react";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatCurrency, formatOrderDate } from "@/lib/utils";
import type { Order } from "@/types/order";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = JSON.parse(window.localStorage.getItem("spinshop360-orders") ?? "[]");
      setOrders(stored);
    }
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-foreground">คำสั่งซื้อ</h1>
      <p className="mb-6 text-sm text-muted">
        คำสั่งซื้อที่สร้างระหว่างทดสอบ Checkout ในโหมด Mock จะแสดงที่นี่ ({orders.length} รายการ)
      </p>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted">
          ยังไม่มีคำสั่งซื้อ ลองสั่งซื้อสินค้าที่หน้าร้านเพื่อดูข้อมูลที่นี่
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3">เลขที่คำสั่งซื้อ</th>
                <th className="px-4 py-3">ลูกค้า</th>
                <th className="px-4 py-3">วันที่</th>
                <th className="px-4 py-3">ยอดรวม</th>
                <th className="px-4 py-3">การชำระเงิน</th>
                <th className="px-4 py-3">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-muted">{o.email}</td>
                  <td className="px-4 py-3 text-muted">{formatOrderDate(o.createdAt)}</td>
                  <td className="px-4 py-3">{formatCurrency(o.grandTotal)}</td>
                  <td className="px-4 py-3 text-muted">{o.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
