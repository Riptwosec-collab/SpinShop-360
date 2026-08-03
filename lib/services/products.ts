import { MOCK_PRODUCTS } from "@/lib/mock-data/products";
import { getMockReviewsByProduct } from "@/lib/mock-data/reviews";
import type { Product, ProductFilterState, ProductSort } from "@/types/product";
import { PRODUCTS_PER_PAGE, USE_MOCK_DATA } from "@/lib/constants";

/**
 * Data Access Layer for products.
 *
 * USE_MOCK_DATA=true (default) reads from in-memory seed data so the whole
 * storefront works with zero external services. When USE_MOCK_DATA=false,
 * swap the body of each function below for a Supabase query
 * (`supabase.from("products").select(...)`) — the function signatures and
 * return shapes are designed to stay identical either way, so no UI code
 * needs to change.
 */

async function delay(ms = 0) {
  if (ms > 0) await new Promise((r) => setTimeout(r, ms));
}

export async function getProducts(filters: ProductFilterState = {}): Promise<{
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}> {
  await delay();
  if (!USE_MOCK_DATA) {
    // TODO(supabase): replace with a filtered/sorted query against `products`.
    throw new Error("Supabase mode not configured. Set NEXT_PUBLIC_USE_MOCK_DATA=true.");
  }

  let items = MOCK_PRODUCTS.filter((p) => p.status === "active");

  if (filters.category) items = items.filter((p) => p.categorySlug === filters.category);
  if (filters.brand) items = items.filter((p) => p.brand === filters.brand);
  if (filters.minPrice != null) items = items.filter((p) => p.basePrice >= filters.minPrice!);
  if (filters.maxPrice != null) items = items.filter((p) => p.basePrice <= filters.maxPrice!);
  if (filters.supports3d) items = items.filter((p) => p.supports3d);
  if (filters.supports360) items = items.filter((p) => p.supports360);
  if (filters.supportsAr) items = items.filter((p) => p.supportsAr);
  if (filters.onSale) items = items.filter((p) => (p.compareAtPrice ?? 0) > p.basePrice);
  if (filters.isNew) items = items.filter((p) => p.isNew);
  if (filters.isBestseller) items = items.filter((p) => p.isBestseller);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  items = sortProducts(items, filters.sort ?? "featured");

  const total = items.length;
  const page = filters.page ?? 1;
  const pageSize = PRODUCTS_PER_PAGE;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return { items: paged, total, page, pageSize };
}

function sortProducts(items: Product[], sort: ProductSort): Product[] {
  const copy = [...items];
  switch (sort) {
    case "newest":
      return copy.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
    case "price-asc":
      return copy.sort((a, b) => a.basePrice - b.basePrice);
    case "price-desc":
      return copy.sort((a, b) => b.basePrice - a.basePrice);
    case "rating":
      return copy.sort((a, b) => b.reviewSummary.average - a.reviewSummary.average);
    case "bestselling":
      return copy.sort((a, b) => b.soldCount - a.soldCount);
    case "discount":
      return copy.sort((a, b) => {
        const da = a.compareAtPrice ? a.compareAtPrice - a.basePrice : 0;
        const db = b.compareAtPrice ? b.compareAtPrice - b.basePrice : 0;
        return db - da;
      });
    case "featured":
    default:
      return copy.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  await delay();
  return MOCK_PRODUCTS.find((p) => p.slug === slug && p.status === "active") ?? null;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  await delay();
  return MOCK_PRODUCTS.filter((p) => p.isFeatured && p.status === "active").slice(0, limit);
}

export async function getBestsellerProducts(limit = 8): Promise<Product[]> {
  await delay();
  return MOCK_PRODUCTS.filter((p) => p.isBestseller && p.status === "active")
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, limit);
}

export async function getArProducts(limit = 6): Promise<Product[]> {
  await delay();
  return MOCK_PRODUCTS.filter((p) => p.supportsAr && p.status === "active").slice(0, limit);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  await delay();
  return MOCK_PRODUCTS.filter(
    (p) => p.id !== product.id && p.categorySlug === product.categorySlug && p.status === "active"
  ).slice(0, limit);
}

export async function getAllBrands(): Promise<string[]> {
  await delay();
  return Array.from(new Set(MOCK_PRODUCTS.map((p) => p.brand))).sort();
}

export async function getProductReviews(productId: string) {
  await delay();
  return getMockReviewsByProduct(productId);
}

export async function searchProducts(query: string, limit = 6): Promise<Product[]> {
  await delay();
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return MOCK_PRODUCTS.filter(
    (p) =>
      p.status === "active" &&
      (p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q))
  ).slice(0, limit);
}

export function findVariant(product: Product, selectedValueIds: string[]) {
  if (product.variants.length === 1 && product.options.length === 0) {
    return product.variants[0];
  }
  return (
    product.variants.find(
      (v) =>
        v.optionValueIds.length === selectedValueIds.length &&
        v.optionValueIds.every((id) => selectedValueIds.includes(id))
    ) ?? null
  );
}
