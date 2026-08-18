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
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const category = first(resolved.category);
  const brand = first(resolved.brand);
  const minPrice = first(resolved.minPrice);
  const maxPrice = first(resolved.maxPrice);
  const supports3d = first(resolved.supports3d);
  const supports360 = first(resolved.supports360);
  const supportsAr = first(resolved.supportsAr);
  const onSale = first(resolved.onSale);
  const isNew = first(resolved.isNew);
  const isBestseller = first(resolved.isBestseller);
  const search = first(resolved.search);
  const sort = first(resolved.sort);
  const viewParam = first(resolved.view);
  const page = Math.max(1, Number(first(resolved.page) ?? 1) || 1);

  const [{ items, total, pageSize }, brands] = await Promise.all([
    getProducts({
      category,
      brand,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      supports3d: supports3d === "true",
      supports360: supports360 === "true",
      supportsAr: supportsAr === "true",
      onSale: onSale === "true",
      isNew: isNew === "true",
      isBestseller: isBestseller === "true",
      search,
      sort: (sort as SortType) ?? "featured",
      page,
    }),
    getAllBrands(),
  ]);
  const view = viewParam === "list" ? "list" : "grid";
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-semibold text-foreground">
        {search ? `ผลการค้นหา "${search}"` : "สินค้าทั้งหมด"}
      </h1>
      <p className="mb-6 text-sm text-muted">เลือกซื้อสินค้าพร้อมระบบดูสินค้า 3D และ 360 องศา</p>

      <div className="flex flex-col gap-8 lg:flex-row">
        <ProductFilters brands={brands} />

        <div className="min-w-0 flex-1">
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
              {items.map((product) => (
                <ProductCard key={product.id} product={product} view={view} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}
