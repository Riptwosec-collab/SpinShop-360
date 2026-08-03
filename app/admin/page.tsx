import { TrendingUp, ShoppingBag, Users, AlertTriangle, Box, Smartphone } from "lucide-react";
import { MOCK_PRODUCTS } from "@/lib/mock-data/products";
import { formatCurrency } from "@/lib/utils";
import { RealtimeAdminFeed } from "@/components/admin/realtime-stock-feed";

export default function AdminDashboardPage() {
  const totalSales = MOCK_PRODUCTS.reduce((sum, p) => sum + p.basePrice * Math.round(p.soldCount * 0.02), 0);
  const lowStock = MOCK_PRODUCTS.filter((p) => p.stockQuantity <= p.lowStockThreshold);
  const bestsellers = [...MOCK_PRODUCTS].sort((a, b) => b.soldCount - a.soldCount).slice(0, 5);

  const stats = [
    { label: "ยอดขายวันนี้ (ประมาณ)", value: formatCurrency(totalSales), icon: TrendingUp },
    { label: "คำสั่งซื้อทั้งหมด (Mock)", value: "128", icon: ShoppingBag },
    { label: "ลูกค้าใหม่เดือนนี้", value: "34", icon: Users },
    { label: "สินค้าใกล้หมดสต็อก", value: String(lowStock.length), icon: AlertTriangle },
  ];

  const engagement = [
    { label: "เปิดดูโมเดล 3D", value: "1,842 ครั้ง", icon: Box },
    { label: "เปิดใช้งาน AR", value: "356 ครั้ง", icon: Smartphone },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-foreground">ภาพรวมร้านค้า</h1>
      <p className="mb-6 text-sm text-muted">สรุปข้อมูลสำคัญของ SpinShop 360 (ข้อมูลตัวอย่างในโหมด Mock)</p>

      <div className="mb-6">
        <RealtimeAdminFeed />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface p-5">
            <s.icon className="mb-3 h-5 w-5 text-primary" />
            <p className="text-xl font-semibold text-foreground">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-foreground">สินค้าขายดี</h2>
          <ul className="flex flex-col divide-y divide-border">
            {bestsellers.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                    {i + 1}
                  </span>
                  {p.name}
                </span>
                <span className="text-muted">ขายแล้ว {p.soldCount}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Viewer Engagement</h2>
          <ul className="flex flex-col gap-3">
            {engagement.map((e) => (
              <li key={e.label} className="flex items-center gap-3">
                <e.icon className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{e.value}</p>
                  <p className="text-xs text-muted">{e.label}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">สินค้าใกล้หมดสต็อก</h2>
        {lowStock.length === 0 ? (
          <p className="text-sm text-muted">ไม่มีสินค้าที่ใกล้หมดสต็อกในขณะนี้</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>{p.name}</span>
                <span className="text-warning">เหลือ {p.stockQuantity} ชิ้น</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
