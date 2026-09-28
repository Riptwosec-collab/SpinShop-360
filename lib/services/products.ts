import { MOCK_PRODUCTS } from "@/lib/mock-data/products";
import { getMockReviewsByProduct } from "@/lib/mock-data/reviews";
import type { Product, ProductFilterState, ProductSort } from "@/types/product";
import { CATEGORIES, PRODUCTS_PER_PAGE, USE_MOCK_DATA } from "@/lib/constants";

import { createCatalogClient } from "@/lib/supabase/catalog";
import {
  CATALOG_SELECT,
  mapCatalogProduct,
  type CatalogRow,
} from "./catalog-mapper";
import type { Review } from "@/types/review";

async function catalog(
  filter: { ids?: string[]; slug?: string } = {},
): Promise<Product[]> {
  if (USE_MOCK_DATA)
    return MOCK_PRODUCTS.filter(
      (p) =>
        p.status === "active" &&
        (!filter.ids || filter.ids.includes(p.id)) &&
        (!filter.slug || p.slug === filter.slug),
    );
  const client = createCatalogClient();
  const rows: CatalogRow[] = [];
  // Explicit ranges avoid silently truncating catalogs at the Data API row limit.
  const batchSize = 200;
  for (let start = 0; ; start += batchSize) {
    let query = client
      .from("products")
      .select(CATALOG_SELECT)
      .eq("status", "active")
      .is("deleted_at", null);
    if (filter.ids) query = query.in("id", filter.ids);
    if (filter.slug) query = query.eq("slug", filter.slug);
    const { data, error } = await query
      .order("id")
      .range(start, start + batchSize - 1);
    if (error) throw new Error(`Unable to load catalog: ${error.message}`);
    const batch = (data ?? []) as unknown as CatalogRow[];
    rows.push(...batch);
    if (batch.length < batchSize) break;
  }
  return rows.map(mapCatalogProduct);
}

export async function getProducts(filters: ProductFilterState = {}): Promise<{
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}> {
  let items = await catalog();

  if (filters.category)
    items = items.filter((p) => p.categorySlug === filters.category);
  if (filters.brand) items = items.filter((p) => p.brand === filters.brand);
  if (filters.minPrice != null)
    items = items.filter((p) => p.basePrice >= filters.minPrice!);
  if (filters.maxPrice != null)
    items = items.filter((p) => p.basePrice <= filters.maxPrice!);
  if (filters.supports3d) items = items.filter((p) => p.supports3d);
  if (filters.supports360) items = items.filter((p) => p.supports360);
  if (filters.supportsAr) items = items.filter((p) => p.supportsAr);
  if (filters.onSale)
    items = items.filter((p) => (p.compareAtPrice ?? 0) > p.basePrice);
  if (filters.isNew) items = items.filter((p) => p.isNew);
  if (filters.isBestseller) items = items.filter((p) => p.isBestseller);
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }

  items = sortProducts(items, filters.sort ?? "featured");

  const total = items.length;
  const page = Number.isFinite(filters.page)
    ? Math.max(1, Math.floor(filters.page!))
    : 1;
  const pageSize = PRODUCTS_PER_PAGE;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return { items: paged, total, page, pageSize };
}

function sortProducts(items: Product[], sort: ProductSort): Product[] {
  const copy = [...items];
  switch (sort) {
    case "newest":
      return copy.sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );
    case "price-asc":
      return copy.sort((a, b) => a.basePrice - b.basePrice);
    case "price-desc":
      return copy.sort((a, b) => b.basePrice - a.basePrice);
    case "rating":
      return copy.sort(
        (a, b) => b.reviewSummary.average - a.reviewSummary.average,
      );
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
  return (
    (await catalog({ slug })).find(
      (p) => p.slug === slug && p.status === "active",
    ) ?? null
  );
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return (await catalog())
    .filter((p) => p.isFeatured && p.status === "active")
    .slice(0, limit);
}

export async function getBestsellerProducts(limit = 8): Promise<Product[]> {
  return (await catalog())
    .filter((p) => p.isBestseller && p.status === "active")
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, limit);
}

export async function getArProducts(limit = 6): Promise<Product[]> {
  return (await catalog())
    .filter((p) => p.supportsAr && p.status === "active")
    .slice(0, limit);
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  return (await catalog())
    .filter(
      (p) =>
        p.id !== product.id &&
        p.categorySlug === product.categorySlug &&
        p.status === "active",
    )
    .slice(0, limit);
}

export async function getAllBrands(): Promise<string[]> {
  return Array.from(new Set((await catalog()).map((p) => p.brand))).sort();
}

const REVIEW_SELECT =
  "id,product_id,rating,title,content,is_verified_purchase,status,helpful_count,created_at,review_images(image_url,sort_order)";
interface ReviewRow {
  id: string;
  product_id: string;
  rating: number;
  title: string | null;
  content: string;
  is_verified_purchase: boolean;
  status: Review["status"];
  helpful_count: number;
  created_at: string;
  review_images: { image_url: string; sort_order: number }[];
}
function mapReview(r: ReviewRow): Review {
  return {
    id: r.id,
    productId: r.product_id,
    userName: "ลูกค้าที่รีวิว",
    rating: r.rating,
    title: r.title ?? "",
    content: r.content,
    images: (r.review_images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => i.image_url),
    isVerifiedPurchase: r.is_verified_purchase,
    status: r.status,
    helpfulCount: r.helpful_count,
    createdAt: r.created_at,
  };
}
export async function getProductReviews(productId: string): Promise<Review[]> {
  if (USE_MOCK_DATA) return getMockReviewsByProduct(productId);
  const { data, error } = await createCatalogClient()
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load reviews: ${error.message}`);
  return ((data ?? []) as unknown as ReviewRow[]).map(mapReview);
}

export async function searchProducts(
  query: string,
  limit = 6,
): Promise<Product[]> {
  if (!query.trim()) return [];
  const q = query.trim().toLowerCase();
  return (await catalog())
    .filter(
      (p) =>
        p.status === "active" &&
        (p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)),
    )
    .slice(0, limit);
}

export function findVariant(product: Product, selectedValueIds: string[]) {
  if (product.variants.length === 1 && product.options.length === 0) {
    return product.variants[0];
  }
  return (
    product.variants.find(
      (v) =>
        v.optionValueIds.length === selectedValueIds.length &&
        v.optionValueIds.every((id) => selectedValueIds.includes(id)),
    ) ?? null
  );
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  return catalog({ ids });
}

export interface CatalogCategory {
  name: string;
  slug: string;
  icon: string;
}
export async function getCategories(): Promise<CatalogCategory[]> {
  if (USE_MOCK_DATA) return [...CATEGORIES];
  const { data, error } = await createCatalogClient()
    .from("categories")
    .select("name,slug,sort_order")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(`Unable to load categories: ${error.message}`);
  return (data ?? []).map((c) => ({
    name: c.name,
    slug: c.slug,
    icon: "Package",
  }));
}

export async function getFeaturedReviews(
  limit = 3,
): Promise<{ review: Review; product: Product }[]> {
  if (USE_MOCK_DATA) {
    const products = await catalog();
    return products
      .flatMap((product) =>
        getMockReviewsByProduct(product.id).map((review) => ({
          product,
          review,
        })),
      )
      .sort(
        (a, b) =>
          Date.parse(b.review.createdAt) - Date.parse(a.review.createdAt),
      )
      .slice(0, limit);
  }
  const { data, error } = await createCatalogClient()
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error)
    throw new Error(`Unable to load featured reviews: ${error.message}`);
  const reviews = ((data ?? []) as unknown as ReviewRow[]).map(mapReview);
  const products = await getProductsByIds([
    ...new Set(reviews.map((r) => r.productId)),
  ]);
  return reviews.flatMap((review) => {
    const product = products.find((p) => p.id === review.productId);
    return product ? [{ review, product }] : [];
  });
}
