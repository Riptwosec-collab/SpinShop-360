import { CATEGORIES } from "@/lib/constants";
import { MOCK_PRODUCTS } from "@/lib/mock-data/products";

export default function AdminCategoriesPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-foreground">หมวดหมู่สินค้า</h1>
      <p className="mb-6 text-sm text-muted">จัดการหมวดหมู่สินค้าทั้งหมดในร้าน</p>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3">ชื่อหมวดหมู่</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">จำนวนสินค้า</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {CATEGORIES.map((c) => (
              <tr key={c.slug}>
                <td className="px-4 py-3 text-foreground">{c.name}</td>
                <td className="px-4 py-3 text-muted">{c.slug}</td>
                <td className="px-4 py-3 text-muted">
                  {MOCK_PRODUCTS.filter((p) => p.categorySlug === c.slug).length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
