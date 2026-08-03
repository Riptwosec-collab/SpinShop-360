"use client";

import { useEffect, useState } from "react";
import { Radio, AlertTriangle, ShoppingBag } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface StockEvent {
  id: string;
  sku: string;
  stockQuantity: number;
  timestamp: number;
}

interface OrderEvent {
  id: string;
  orderNumber: string;
  grandTotal: number;
  timestamp: number;
}

/**
 * Subscribes to Supabase Realtime changes on `product_variants` and
 * `orders` (see `supabase/migrations/0005_realtime.sql`) so the dashboard
 * updates the moment stock changes or a new order comes in — no polling.
 *
 * Renders nothing in Mock Mode (no Supabase configured), so the dashboard
 * degrades gracefully to its static snapshot view.
 */
export function RealtimeAdminFeed() {
  const [connected, setConnected] = useState(false);
  const [stockEvents, setStockEvents] = useState<StockEvent[]>([]);
  const [orderEvents, setOrderEvents] = useState<OrderEvent[]>([]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("admin-dashboard-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "product_variants" },
        (payload) => {
          const row = payload.new as { id: string; sku: string; stock_quantity: number };
          setStockEvents((prev) =>
            [{ id: row.id, sku: row.sku, stockQuantity: row.stock_quantity, timestamp: Date.now() }, ...prev].slice(0, 5)
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as { id: string; order_number: string; grand_total: number };
          setOrderEvents((prev) =>
            [{ id: row.id, orderNumber: row.order_number, grandTotal: row.grand_total, timestamp: Date.now() }, ...prev].slice(0, 5)
          );
        }
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const supabaseConfigured = !!createSupabaseBrowserClient();
  if (!supabaseConfigured) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <Radio className={`h-4 w-4 ${connected ? "text-success" : "text-muted"}`} />
        <h2 className="text-sm font-semibold text-foreground">
          กิจกรรมแบบเรียลไทม์ {connected ? "(เชื่อมต่อแล้ว)" : "(กำลังเชื่อมต่อ...)"}
        </h2>
      </div>

      {stockEvents.length === 0 && orderEvents.length === 0 ? (
        <p className="text-xs text-muted">รอการอัปเดตสต็อกหรือคำสั่งซื้อใหม่แบบเรียลไทม์...</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {orderEvents.map((e) => (
            <li key={`order-${e.id}-${e.timestamp}`} className="flex items-center gap-2 text-xs">
              <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="text-foreground">คำสั่งซื้อใหม่ {e.orderNumber}</span>
              <span className="text-muted">{formatCurrency(e.grandTotal)}</span>
            </li>
          ))}
          {stockEvents.map((e) => (
            <li key={`stock-${e.id}-${e.timestamp}`} className="flex items-center gap-2 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />
              <span className="text-foreground">สต็อก {e.sku} อัปเดตเหลือ</span>
              <span className="text-muted">{e.stockQuantity} ชิ้น</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
