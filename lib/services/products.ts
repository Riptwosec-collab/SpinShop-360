import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MOCK_PRODUCTS } from "@/lib/mock-data/products";
import { getMockReviewsByProduct } from "@/lib/mock-data/reviews";
import type {
  Product,
  Product360Set,
  ProductFilterState,
  ProductHotspot,
  ProductImage,
  ProductOption,
  ProductSort,
  ProductVariant,
} from "@/types/product";
import type { Review } from "@/types/review";
import { PRODUCTS_PER_PAGE, USE_MOCK_DATA } from "@/lib/constants";

const PRODUCT_SELECT = `
  *,
  brands(name),
  categories(name, slug),
  product_images(*),
  product_360_frames(*),
  product_variants(*, variant_option_values(option_value_id)),
  product_options(*, product_option_values(*)),
  product_hotspots(*),
  reviews(id, rating, status)
`;

let catalogClient: SupabaseClient | null | undefined;

function getCatalogClient() {
  if (catalogClient !== undefined) return catalogClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  catalogClient = url && anonKey
    ? createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  return catalogClient;
}

function requireCatalogClient() {
  const client = getCatalogClient();
  if (!client) throw new Error("Supabase catalog is not configured");
  return client;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function relation(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) return value;
  return records(value)[0] ?? null;
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function nullableText(value: unknown) {
  return typeof value === "string" ? value : null;
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanValue(value: unknown) {
  return value === true;
}

function vector(value: unknown) {
  if (!isRecord(value)) return { x: 0, y: 0, z: 0 };
  return {
    x: numberValue(value.x),
    y: numberValue(value.y),
    z: numberValue(value.z),
  };
}

function mapImage(row: Record<string, unknown>): ProductImage {
  return {
    id: text(row.id),
    productId: text(row.product_id),
    url: text(row.url),
    altText: text(row.alt_text),
    sortOrder: numberValue(row.sort_order),
    isPrimary: booleanValue(row.is_primary),
  };
}

function mapOption(row: Record<string, unknown>): ProductOption {
  return {
    id: text(row.id),
    productId: text(row.product_id),
    name: text(row.name),
    displayType: ["select", "buttons", "color", "image"].includes(text(row.display_type))
      ? text(row.display_type) as ProductOption["displayType"]
      : "buttons",
    sortOrder: numberValue(row.sort_order),
    values: records(row.product_option_values)
      .map((value) => ({
        id: text(value.id),
        optionId: text(value.option_id),
        value: text(value.value),
        colorHex: nullableText(value.color_hex),
        imageUrl: nullableText(value.image_url),
        sortOrder: numberValue(value.sort_order),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

function mapVariant(row: Record<string, unknown>): ProductVariant {
  return {
    id: text(row.id),
    productId: text(row.product_id),
    sku: text(row.sku),
    price: numberValue(row.price),
    compareAtPrice: row.compare_at_price == null ? null : numberValue(row.compare_at_price),
    stockQuantity: numberValue(row.stock_quantity),
    imageUrl: nullableText(row.image_url),
    modelUrl: nullableText(row.model_url),
    isActive: row.is_active !== false,
    optionValueIds: records(row.variant_option_values).map((item) => text(item.option_value_id)).filter(Boolean),
  };
}

function mapHotspot(row: Record<string, unknown>): ProductHotspot {
  return {
    id: text(row.id),
    productId: text(row.product_id),
    variantId: nullableText(row.variant_id),
    title: text(row.title),
    description: text(row.description),
    imageUrl: nullableText(row.image_url),
    position: vector(row.position),
    normal: row.normal == null ? null : vector(row.normal),
    icon: nullableText(row.icon),
    sortOrder: numberValue(row.sort_order),
    isActive: row.is_active !== false,
  };
}

function mapFrames(value: unknown): Product360Set | null {
  const frames = records(value)
    .sort((a, b) => numberValue(a.frame_number) - numberValue(b.frame_number));
  if (frames.length === 0) return null;
  const variantIds = new Set(frames.map((frame) => nullableText(frame.variant_id)));
  return {
    variantId: variantIds.size === 1 ? nullableText(frames[0].variant_id) : null,
    frameCount: frames.length,
    frames: frames.map((frame) => text(frame.image_url)).filter(Boolean),
  };
}

function mapProduct(row: Record<string, unknown>): Product {
  const brand = relation(row.brands);
  const category = relation(row.categories);
  const images = records(row.product_images).map(mapImage).sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
  const options = records(row.product_options).map(mapOption).sort((a, b) => a.sortOrder - b.sortOrder);
  const variants = records(row.product_variants).map(mapVariant).filter((variant) => variant.isActive);
  const hotspots = records(row.product_hotspots).map(mapHotspot).filter((hotspot) => hotspot.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const reviews = records(row.reviews).filter((review) => text(review.status) === "approved");
  const average = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + numberValue(review.rating), 0) / reviews.length
    : 0;
  const createdAt = text(row.created_at, new Date(0).toISOString());
  const publishedAt = nullableText(row.published_at) ?? createdAt;
  const basePrice = numberValue(row.base_price, variants[0]?.price ?? 0);
  const variantStock = variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);

  return {
    id: text(row.id),
    name: text(row.name),
    slug: text(row.slug),
    shortDescription: text(row.short_description),
    description: text(row.description),
    brand: text(brand?.name, "ไม่ระบุแบรนด์"),
    category: text(category?.name, "ไม่ระบุหมวดหมู่"),
    categorySlug: text(category?.slug),
    status: ["draft", "active", "out_of_stock", "archived"].includes(text(row.status))
      ? text(row.status) as Product["status"]
      : "draft",
    basePrice,
    compareAtPrice: row.compare_at_price == null ? null : numberValue(row.compare_at_price),
    sku: text(row.sku),
    stockQuantity: variants.length > 0 ? variantStock : numberValue(row.stock_quantity),
    lowStockThreshold: numberValue(row.low_stock_threshold, 10),
    isFeatured: booleanValue(row.is_featured),
    isBestseller: booleanValue(row.is_bestseller),
    isNew: Date.now() - new Date(publishedAt).getTime() <= 30 * 24 * 60 * 60 * 1000,
    supports3d: booleanValue(row.supports_3d),
    supports360: booleanValue(row.supports_360),
    supportsAr: booleanValue(row.supports_ar),
    modelGlbUrl: nullableText(row.model_glb_url) ?? nullableText(row.model_gltf_url),
    modelUsdzUrl: nullableText(row.model_usdz_url),
    materialOptions: null,
    fallbackImageUrl: text(row.fallback_image_url, images[0]?.url ?? "/placeholder-product.svg"),
    images,
    options,
    variants,
    hotspots,
    threeSixty: mapFrames(row.product_360_frames),
    specs: [],
    dimensions: null,
    reviewSummary: { average, count: reviews.length },
    soldCount: 0,
    shippingEtaDays: [2, 4],
    createdAt,
  };
}

async function fetchCatalog(): Promise<Product[]> {
  const { data, error } = await requireCatalogClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "active")
    .is("deleted_at", null);
  if (error) throw new Error(`Unable to load products: ${error.message}`);
  return records(data).map(mapProduct);
}

function applyFilters(items: Product[], filters: ProductFilterState) {
  let filtered = items;
  if (filters.category) filtered = filtered.filter((product) => product.categorySlug === filters.category);
  if (filters.brand) filtered = filtered.filter((product) => product.brand === filters.brand);
  if (filters.minPrice != null) filtered = filtered.filter((product) => product.basePrice >= filters.minPrice!);
  if (filters.maxPrice != null) filtered = filtered.filter((product) => product.basePrice <= filters.maxPrice!);
  if (filters.supports3d) filtered = filtered.filter((product) => product.supports3d);
  if (filters.supports360) filtered = filtered.filter((product) => product.supports360);
  if (filters.supportsAr) filtered = filtered.filter((product) => product.supportsAr);
  if (filters.onSale) filtered = filtered.filter((product) => (product.compareAtPrice ?? 0) > product.basePrice);
  if (filters.isNew) filtered = filtered.filter((product) => product.isNew);
  if (filters.isBestseller) filtered = filtered.filter((product) => product.isBestseller);
  if (filters.search) {
    const query = filters.search.toLocaleLowerCase("th");
    filtered = filtered.filter((product) =>
      [product.name, product.sku, product.brand, product.category]
        .some((value) => value.toLocaleLowerCase("th").includes(query))
    );
  }
  return filtered;
}

function sortProducts(items: Product[], sort: ProductSort): Product[] {
  const copy = [...items];
  switch (sort) {
    case "newest":
      return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
        const discountA = a.compareAtPrice ? a.compareAtPrice - a.basePrice : 0;
        const discountB = b.compareAtPrice ? b.compareAtPrice - b.basePrice : 0;
        return discountB - discountA;
      });
    case "featured":
    default:
      return copy.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  }
}

export async function getProducts(filters: ProductFilterState = {}): Promise<{
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const source = USE_MOCK_DATA ? MOCK_PRODUCTS.filter((product) => product.status === "active") : await fetchCatalog();
  const items = sortProducts(applyFilters(source, filters), filters.sort ?? "featured");
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = PRODUCTS_PER_PAGE;
  const total = items.length;
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (USE_MOCK_DATA) return MOCK_PRODUCTS.find((product) => product.slug === slug && product.status === "active") ?? null;
  const { data, error } = await requireCatalogClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(`Unable to load product: ${error.message}`);
  return isRecord(data) ? mapProduct(data) : null;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const products = USE_MOCK_DATA ? MOCK_PRODUCTS : await fetchCatalog();
  return products.filter((product) => product.isFeatured && product.status === "active").slice(0, limit);
}

export async function getBestsellerProducts(limit = 8): Promise<Product[]> {
  const products = USE_MOCK_DATA ? MOCK_PRODUCTS : await fetchCatalog();
  return products.filter((product) => product.isBestseller && product.status === "active")
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, limit);
}

export async function getArProducts(limit = 6): Promise<Product[]> {
  const products = USE_MOCK_DATA ? MOCK_PRODUCTS : await fetchCatalog();
  return products.filter((product) => product.supportsAr && product.status === "active").slice(0, limit);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const products = USE_MOCK_DATA ? MOCK_PRODUCTS : await fetchCatalog();
  return products.filter((item) => item.id !== product.id && item.categorySlug === product.categorySlug && item.status === "active").slice(0, limit);
}

export async function getAllBrands(): Promise<string[]> {
  if (USE_MOCK_DATA) return Array.from(new Set(MOCK_PRODUCTS.map((product) => product.brand))).sort();
  const { data, error } = await requireCatalogClient().from("brands").select("name").eq("is_active", true).order("name");
  if (error) throw new Error(`Unable to load brands: ${error.message}`);
  return records(data).map((row) => text(row.name)).filter(Boolean);
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  if (USE_MOCK_DATA) return getMockReviewsByProduct(productId);
  const { data, error } = await requireCatalogClient()
    .from("reviews")
    .select("*, profiles(full_name, avatar_url), review_images(url)")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load reviews: ${error.message}`);
  return records(data).map((row) => {
    const profile = relation(row.profiles);
    return {
      id: text(row.id),
      productId: text(row.product_id),
      userName: text(profile?.full_name, "ลูกค้า SpinShop"),
      userAvatarUrl: nullableText(profile?.avatar_url),
      rating: numberValue(row.rating),
      title: text(row.title),
      content: text(row.content),
      images: records(row.review_images).map((image) => text(image.url)).filter(Boolean),
      variantLabel: undefined,
      isVerifiedPurchase: booleanValue(row.is_verified_purchase),
      status: "approved",
      helpfulCount: numberValue(row.helpful_count),
      createdAt: text(row.created_at),
    };
  });
}

export async function searchProducts(query: string, limit = 6): Promise<Product[]> {
  const normalized = query.trim();
  if (!normalized) return [];
  if (USE_MOCK_DATA) {
    const lower = normalized.toLocaleLowerCase("th");
    return MOCK_PRODUCTS.filter((product) =>
      product.status === "active" &&
      [product.name, product.brand, product.sku, product.category]
        .some((value) => value.toLocaleLowerCase("th").includes(lower))
    ).slice(0, limit);
  }

  const escaped = normalized.replace(/[%_,()]/g, "");
  const { data, error } = await requireCatalogClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "active")
    .is("deleted_at", null)
    .or(`name.ilike.%${escaped}%,sku.ilike.%${escaped}%`)
    .limit(limit);
  if (error) throw new Error(`Unable to search products: ${error.message}`);
  return records(data).map(mapProduct);
}

export function findVariant(product: Product, selectedValueIds: string[]) {
  if (product.variants.length === 1 && product.options.length === 0) return product.variants[0];
  return product.variants.find((variant) =>
    variant.optionValueIds.length === selectedValueIds.length &&
    variant.optionValueIds.every((id) => selectedValueIds.includes(id))
  ) ?? null;
}
