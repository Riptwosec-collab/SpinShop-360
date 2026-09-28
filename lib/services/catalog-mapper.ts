import type {
  Product,
  ProductOption,
  ProductHotspot,
  MaterialOption,
} from "@/types/product";

/** Explicit public projection; never select cost_price or customer/profile fields. */
export const CATALOG_SELECT = `id,name,slug,short_description,description,status,base_price,compare_at_price,sku,stock_quantity,low_stock_threshold,is_featured,is_bestseller,is_new,supports_3d,supports_360,supports_ar,model_glb_url,model_usdz_url,fallback_image_url,material_options,specs,dimensions,sold_count,shipping_eta_days,created_at,
 brands(name),categories(name,slug),
 product_images(id,product_id,url,alt_text,sort_order,is_primary),
 product_options(id,product_id,name,display_type,sort_order,product_option_values(id,option_id,value,color_hex,image_url,sort_order)),
 product_variants(id,product_id,sku,price,compare_at_price,stock_quantity,image_url,model_url,is_active,variant_option_values(option_value_id)),
 product_hotspots(id,product_id,variant_id,title,description,image_url,position,normal,icon,sort_order,is_active),
 product_360_frames(variant_id,frame_number,image_url),reviews(rating,status)`;

export interface CatalogRow {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  status: Product["status"];
  base_price: number;
  compare_at_price: number | null;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  supports_3d: boolean;
  supports_360: boolean;
  supports_ar: boolean;
  model_glb_url: string | null;
  model_usdz_url: string | null;
  fallback_image_url: string | null;
  material_options: MaterialOption[] | null;
  specs: Product["specs"] | null;
  dimensions: Product["dimensions"];
  sold_count: number;
  shipping_eta_days: [number, number] | null;
  created_at: string;
  brands: { name: string } | null;
  categories: { name: string; slug: string } | null;
  product_images: {
    id: string;
    product_id: string;
    url: string;
    alt_text: string | null;
    sort_order: number;
    is_primary: boolean;
  }[];
  product_options: {
    id: string;
    product_id: string;
    name: string;
    display_type: ProductOption["displayType"];
    sort_order: number;
    product_option_values: {
      id: string;
      option_id: string;
      value: string;
      color_hex: string | null;
      image_url: string | null;
      sort_order: number;
    }[];
  }[];
  product_variants: {
    id: string;
    product_id: string;
    sku: string;
    price: number;
    compare_at_price: number | null;
    stock_quantity: number;
    image_url: string | null;
    model_url: string | null;
    is_active: boolean;
    variant_option_values: { option_value_id: string }[];
  }[];
  product_hotspots: {
    id: string;
    product_id: string;
    variant_id: string | null;
    title: string;
    description: string | null;
    image_url: string | null;
    position: ProductHotspot["position"];
    normal: ProductHotspot["normal"];
    icon: string | null;
    sort_order: number;
    is_active: boolean;
  }[];
  product_360_frames: {
    variant_id: string | null;
    frame_number: number;
    image_url: string;
  }[];
  reviews: { rating: number; status: string }[];
}
export function mapCatalogProduct(p: CatalogRow): Product {
  const reviews = (p.reviews ?? []).filter((r) => r.status === "approved");
  const frames = (p.product_360_frames ?? [])
    .filter((f) => !f.variant_id)
    .sort((a, b) => a.frame_number - b.frame_number);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.short_description ?? "",
    description: p.description ?? "",
    brand: p.brands?.name ?? "",
    category: p.categories?.name ?? "",
    categorySlug: p.categories?.slug ?? "",
    status: p.status,
    basePrice: Number(p.base_price),
    compareAtPrice:
      p.compare_at_price == null ? null : Number(p.compare_at_price),
    sku: p.sku,
    stockQuantity: p.stock_quantity,
    lowStockThreshold: p.low_stock_threshold ?? 10,
    isFeatured: p.is_featured,
    isBestseller: p.is_bestseller,
    isNew: p.is_new ?? false,
    supports3d: p.supports_3d,
    supports360: p.supports_360,
    supportsAr: p.supports_ar,
    modelGlbUrl: p.model_glb_url,
    modelUsdzUrl: p.model_usdz_url,
    fallbackImageUrl: p.fallback_image_url ?? "/images/placeholder.svg",
    materialOptions: p.material_options ?? null,
    specs: p.specs ?? [],
    dimensions: p.dimensions ?? null,
    soldCount: p.sold_count ?? 0,
    shippingEtaDays: p.shipping_eta_days ?? [3, 7],
    createdAt: p.created_at,
    images: (p.product_images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({
        id: i.id,
        productId: i.product_id,
        url: i.url,
        altText: i.alt_text ?? p.name,
        sortOrder: i.sort_order,
        isPrimary: i.is_primary,
      })),
    options: (p.product_options ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => ({
        id: o.id,
        productId: o.product_id,
        name: o.name,
        displayType: o.display_type,
        sortOrder: o.sort_order,
        values: (o.product_option_values ?? [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((v) => ({
            id: v.id,
            optionId: v.option_id,
            value: v.value,
            colorHex: v.color_hex,
            imageUrl: v.image_url,
            sortOrder: v.sort_order,
          })),
      })),
    variants: (p.product_variants ?? [])
      .filter((v) => v.is_active)
      .map((v) => ({
        id: v.id,
        productId: v.product_id,
        sku: v.sku,
        price: Number(v.price),
        compareAtPrice:
          v.compare_at_price == null ? null : Number(v.compare_at_price),
        stockQuantity: v.stock_quantity,
        imageUrl: v.image_url,
        modelUrl: v.model_url,
        isActive: v.is_active,
        optionValueIds: (v.variant_option_values ?? []).map(
          (o) => o.option_value_id,
        ),
      })),
    hotspots: (p.product_hotspots ?? [])
      .filter((h) => h.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((h) => ({
        id: h.id,
        productId: h.product_id,
        variantId: h.variant_id,
        title: h.title,
        description: h.description ?? "",
        imageUrl: h.image_url,
        position: h.position,
        normal: h.normal,
        icon: h.icon,
        sortOrder: h.sort_order,
        isActive: h.is_active,
      })),
    threeSixty: frames.length
      ? { frameCount: frames.length, frames: frames.map((f) => f.image_url) }
      : null,
    reviewSummary: {
      count: reviews.length,
      average: reviews.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0,
    },
  };
}
