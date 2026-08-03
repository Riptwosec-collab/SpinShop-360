"use client";

import Link from "next/link";
import { Plus, Box, RotateCw, Smartphone } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAdminProducts } from "@/lib/hooks/use-admin-products";

const STATUS_LABEL: Record<string, string> = {
  active: "เผยแพร่แล้ว",
  draft: "ฉบับร่าง",
  out_of_stock: "สินค้าหมด",
  archived: "เก็บถาวร",
};

export default function AdminProductsPage() {
  const { products, loading } = useAdminProducts();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">จัดการสินค้า</h1>
          <p className="text-sm text-muted">สินค้าทั้งหมด {products.length} รายการ</p>
        </div>
        <Link
          href="/admin/products/new"
          className="focus-ring flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          เพิ่มสินค้าใหม่
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center text-sm text-muted">
          กำลังโหลดข้อมูลสินค้า...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3">สินค้า</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">ราคา</th>
                <th className="px-4 py-3">สต็อก</th>
                <th className="px-4 py-3">Viewer</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="max-w-xs px-4 py-3">
                    <p className="line-clamp-1 font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted">{p.brandName}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.sku}</td>
                  <td className="px-4 py-3">{formatCurrency(p.basePrice)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stockQuantity <= p.lowStockThreshold ? "text-warning" : "text-foreground"}>
                      {p.stockQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.supports3d && <span title="3D"><Box className="h-3.5 w-3.5 text-accent" /></span>}
                      {p.supports360 && <span title="360°"><RotateCw className="h-3.5 w-3.5 text-primary" /></span>}
                      {p.supportsAr && <span title="AR"><Smartphone className="h-3.5 w-3.5 text-success" /></span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="focus-ring text-xs text-primary hover:text-primary-hover">
                      แก้ไข
                    </Link>
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
