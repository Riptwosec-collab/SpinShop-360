export type ProductStatus = "draft" | "active" | "out_of_stock" | "archived";

export type ViewerMode = "image" | "360" | "3d" | "ar";

export type OptionDisplayType = "select" | "buttons" | "color" | "image";

export interface ProductOptionValue {
  id: string;
  optionId: string;
  value: string;
  colorHex?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
}

export interface ProductOption {
  id: string;
  productId: string;
  name: string;
  displayType: OptionDisplayType;
  sortOrder: number;
  values: ProductOptionValue[];
}

export interface MaterialOption {
  id: string;
  name: string;
  color: string;
  roughness?: number;
  metalness?: number;
  /** Name of the mesh/material inside the GLTF this option should recolor */
  targetMaterialName?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  imageUrl?: string | null;
  modelUrl?: string | null;
  isActive: boolean;
  /** map of optionId -> optionValueId, used to resolve a variant from a selection */
  optionValueIds: string[];
}

export interface ProductHotspot {
  id: string;
  productId: string;
  variantId?: string | null;
  title: string;
  description: string;
  imageUrl?: string | null;
  /** normalized position on the model, e.g. { x, y, z } */
  position: { x: number; y: number; z: number };
  normal?: { x: number; y: number; z: number } | null;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Product360Set {
  variantId?: string | null;
  frameCount: number;
  /** ordered list of frame URLs, index 0 = frame-001 */
  frames: string[];
}

export interface ProductReviewSummary {
  average: number;
  count: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  brand: string;
  category: string;
  categorySlug: string;
  status: ProductStatus;
  basePrice: number;
  compareAtPrice?: number | null;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  isBestseller: boolean;
  isNew: boolean;
  supports3d: boolean;
  supports360: boolean;
  supportsAr: boolean;
  modelGlbUrl?: string | null;
  modelUsdzUrl?: string | null;
  /**
   * When present, the product detail page offers a "real-time color" mode
   * (React Three Fiber) that recolors the loaded GLTF's materials live,
   * instead of swapping to a different model file per variant.
   */
  materialOptions?: MaterialOption[] | null;
  fallbackImageUrl: string;
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  hotspots: ProductHotspot[];
  threeSixty?: Product360Set | null;
  specs: { label: string; value: string }[];
  dimensions?: {
    widthCm: number;
    heightCm: number;
    depthCm: number;
    weightKg: number;
  } | null;
  reviewSummary: ProductReviewSummary;
  soldCount: number;
  shippingEtaDays: [number, number];
  createdAt: string;
}

export interface ProductFilterState {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  supports3d?: boolean;
  supports360?: boolean;
  supportsAr?: boolean;
  onSale?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  search?: string;
  sort?: ProductSort;
  view?: "grid" | "list";
  page?: number;
}

export type ProductSort =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "bestselling"
  | "discount";
