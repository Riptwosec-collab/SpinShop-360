import type { Metadata } from "next";
import { getProducts, getAllBrands } from "@/lib/services/products";
import { ProductFilters } from "@/components/product/product-filters";
import { ProductSort } from "@/components/product/product-sort";
import { ProductCard } from "@/components/product/product-card";
import { Pagination } from "@/components/product/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import type { ProductSort as SortType } from "@/types/product";

export const metadata: Metadata = {
  title: "สินค้าทั้งหมด",
  description: "เลือกซื้อสินค้าพร้อมระบบดูสินค้า 3D และ 360 องศา ค้นหา กรอง และเปรียบเทียบสินค้าได้ง่าย",
};

interface PageProps {
  searchParams: Record<string, string | undefined>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page ?? 1) || 1;
  const { items, total, pageSize } = await getProducts({
    category: searchParams.category,
    brand: searchParams.brand,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    supports3d: searchParams.supports3d === "true",
    supports360: searchParams.supports360 === "true",
    supportsAr: searchParams.supportsAr === "true",
    onSale: searchParams.onSale === "true",
    isNew: searchParams.isNew === "true",
    isBestseller: searchParams.isBestseller === "true",
    search: searchParams.search,
    sort: (searchParams.sort as SortType) ?? "featured",
    page,
  });
  const brands = await getAllBrands();
  const view = searchParams.view === "list" ? "list" : "grid";
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-semibold text-foreground">
        {searchParams.search ? `ผลการค้นหา "${searchParams.search}"` : "สินค้าทั้งหมด"}
      </h1>
      <p className="mb-6 text-sm text-muted">เลือกซื้อสินค้าพร้อมระบบดูสินค้า 3D และ 360 องศา</p>

      <div className="flex flex-col gap-8 lg:flex-row">
        <ProductFilters brands={brands} />

        <div className="flex-1">
          <ProductSort total={total} />

          {items.length === 0 ? (
            <EmptyState
              title="ไม่พบสินค้าที่ตรงกับเงื่อนไข"
              description="ลองปรับตัวกรองหรือล้างตัวกรองทั้งหมดเพื่อดูสินค้าทั้งหมด"
              actionHref="/products"
              actionLabel="ล้างตัวกรอง"
            />
          ) : (
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col gap-4"
              }
            >
              {items.map((p) => (
                <ProductCard key={p.id} product={p} view={view} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}
