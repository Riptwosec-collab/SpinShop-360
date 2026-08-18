import type { Product } from "@/types/product";

export type GeneratedProductModelKind = "keyboard" | "smartphone" | "gaming-chair" | "mecha";

export interface Product3DColorOption {
  id: string;
  name: string;
  color: string;
}

const GENERATED_MODEL_BY_SLUG: Record<string, GeneratedProductModelKind> = {
  "aurora-mechanical-keyboard-75": "keyboard",
  "halo-x13-smartphone": "smartphone",
  "throne-elite-gaming-chair": "gaming-chair",
  "guardian-mecha-collectible-figure": "mecha",
};

const DEMO_MODEL_PATTERNS = [
  "modelviewer.dev/shared-assets/models/",
  "Astronaut.glb",
  "RobotExpressive.glb",
  "NeilArmstrong.glb",
];

export function isDemo3DModelUrl(url?: string | null) {
  if (!url) return false;
  return DEMO_MODEL_PATTERNS.some((pattern) => url.includes(pattern));
}

/**
 * Returns a merchant/catalog GLB only when it is not one of the old
 * model-viewer demo assets. A real uploaded product model always wins over
 * the generated catalog fallback.
 */
export function getRealProductModelUrl(product: Pick<Product, "modelGlbUrl">) {
  const value = product.modelGlbUrl?.trim();
  if (!value || isDemo3DModelUrl(value)) return null;
  return value;
}

/**
 * The mock catalog uses fictional product brands, so these product-shaped
 * generated models replace unrelated astronaut/robot sample assets. Once a
 * merchant uploads a real GLB, getRealProductModelUrl() takes precedence.
 */
export function getGeneratedProductModelKind(product: Pick<Product, "slug" | "modelGlbUrl">) {
  if (getRealProductModelUrl(product)) return null;
  return GENERATED_MODEL_BY_SLUG[product.slug] ?? null;
}

export function getProduct3DColorOptions(product: Product): Product3DColorOption[] {
  if (product.materialOptions?.length) {
    return product.materialOptions.map((option) => ({
      id: option.id,
      name: option.name,
      color: option.color,
    }));
  }

  const seen = new Set<string>();
  const options: Product3DColorOption[] = [];

  for (const option of product.options) {
    for (const value of option.values) {
      if (!value.colorHex || seen.has(value.colorHex)) continue;
      seen.add(value.colorHex);
      options.push({ id: value.id, name: value.value, color: value.colorHex });
    }
  }

  return options;
}

export function productCanUse3D(product: Product) {
  return Boolean(
    product.supports3d &&
      (getRealProductModelUrl(product) || getGeneratedProductModelKind(product))
  );
}

export function productCanUseAr(product: Product) {
  return Boolean(product.supportsAr && getRealProductModelUrl(product));
}
