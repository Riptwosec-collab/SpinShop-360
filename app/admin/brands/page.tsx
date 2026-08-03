import { MOCK_PRODUCTS } from "@/lib/mock-data/products";

export default function AdminBrandsPage() {
  const brands = Array.from(new Set(MOCK_PRODUCTS.map((p) => p.brand))).sort();
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-foreground">แบรนด์สินค้า</h1>
      <p className="mb-6 text-sm text-muted">แบรนด์ทั้งหมดในระบบ ({brands.length} แบรนด์)</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {brands.map((b) => (
          <div key={b} className="rounded-xl border border-border bg-surface p-4 text-sm text-foreground">
            {b}
            <p className="mt-1 text-xs text-muted">
              {MOCK_PRODUCTS.filter((p) => p.brand === b).length} สินค้า
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
