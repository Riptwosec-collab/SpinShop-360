"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MOCK_PRODUCTS } from "@/lib/mock-data/products";
import { USE_MOCK_DATA } from "@/lib/constants";

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  brandName: string;
  brandId: string | null;
  categoryId: string | null;
  categorySlug: string;
  sku: string;
  basePrice: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  status: string;
  supports3d: boolean;
  supports360: boolean;
  supportsAr: boolean;
  modelGlbUrl: string | null;
  imageCount: number;
  frameCount: number;
  hotspots: { id: string; title: string; position: { x: number; y: number; z: number } }[];
}

function fromMockProduct(p: (typeof MOCK_PRODUCTS)[number]): AdminProductRow {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    description: p.description,
    brandName: p.brand,
    brandId: null,
    categoryId: null,
    categorySlug: p.categorySlug,
    sku: p.sku,
    basePrice: p.basePrice,
    compareAtPrice: p.compareAtPrice ?? null,
    stockQuantity: p.stockQuantity,
    lowStockThreshold: p.lowStockThreshold,
    status: p.status,
    supports3d: p.supports3d,
    supports360: p.supports360,
    supportsAr: p.supportsAr,
    modelGlbUrl: p.modelGlbUrl ?? null,
    imageCount: p.images.length,
    frameCount: p.threeSixty?.frameCount ?? 0,
    hotspots: p.hotspots.map((h) => ({ id: h.id, title: h.title, position: h.position })),
  };
}

/** List all products for the admin table. Supabase read includes drafts/archived (staff/admin RLS policy). */
export function useAdminProducts() {
  const [products, setProducts] = useState<AdminProductRow[]>(
    USE_MOCK_DATA ? MOCK_PRODUCTS.map(fromMockProduct) : []
  );
  const [loading, setLoading] = useState(!USE_MOCK_DATA);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from("products")
      .select("*, brands(name), product_images(id), product_360_frames(id), product_hotspots(id, title, position)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setProducts(
            data.map((row: Record<string, unknown>) => ({
              id: row.id as string,
              name: row.name as string,
              slug: row.slug as string,
              shortDescription: (row.short_description as string) ?? "",
              description: (row.description as string) ?? "",
              brandName: (row.brands as { name: string } | null)?.name ?? "-",
              brandId: row.brand_id as string | null,
              categoryId: row.category_id as string | null,
              categorySlug: "",
              sku: row.sku as string,
              basePrice: Number(row.base_price),
              compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : null,
              stockQuantity: Number(row.stock_quantity),
              lowStockThreshold: Number(row.low_stock_threshold),
              status: row.status as string,
              supports3d: !!row.supports_3d,
              supports360: !!row.supports_360,
              supportsAr: !!row.supports_ar,
              modelGlbUrl: row.model_glb_url as string | null,
              imageCount: (row.product_images as unknown[])?.length ?? 0,
              frameCount: (row.product_360_frames as unknown[])?.length ?? 0,
              hotspots: (row.product_hotspots as { id: string; title: string; position: { x: number; y: number; z: number } }[]) ?? [],
            }))
          );
        }
        setLoading(false);
      });
  }, []);

  return { products, loading };
}

/** Fetch a single product by id for the edit form. */
export function useAdminProduct(id: string) {
  const [product, setProduct] = useState<AdminProductRow | null | undefined>(
    USE_MOCK_DATA ? fromMockProduct(MOCK_PRODUCTS.find((p) => p.id === id)!) ?? null : undefined
  );

  useEffect(() => {
    if (USE_MOCK_DATA) {
      const mock = MOCK_PRODUCTS.find((p) => p.id === id);
      setProduct(mock ? fromMockProduct(mock) : null);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setProduct(null);
      return;
    }
    supabase
      .from("products")
      .select("*, product_images(id), product_360_frames(id), product_hotspots(id, title, position)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setProduct(null);
          return;
        }
        const row = data as Record<string, unknown>;
        setProduct({
          id: row.id as string,
          name: row.name as string,
          slug: row.slug as string,
          shortDescription: (row.short_description as string) ?? "",
          description: (row.description as string) ?? "",
          brandName: "-",
          brandId: row.brand_id as string | null,
          categoryId: row.category_id as string | null,
          categorySlug: "",
          sku: row.sku as string,
          basePrice: Number(row.base_price),
          compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : null,
          stockQuantity: Number(row.stock_quantity),
          lowStockThreshold: Number(row.low_stock_threshold),
          status: row.status as string,
          supports3d: !!row.supports_3d,
          supports360: !!row.supports_360,
          supportsAr: !!row.supports_ar,
          modelGlbUrl: row.model_glb_url as string | null,
          imageCount: (row.product_images as unknown[])?.length ?? 0,
          frameCount: (row.product_360_frames as unknown[])?.length ?? 0,
          hotspots: (row.product_hotspots as { id: string; title: string; position: { x: number; y: number; z: number } }[]) ?? [],
        });
      });
  }, [id]);

  return product;
}
