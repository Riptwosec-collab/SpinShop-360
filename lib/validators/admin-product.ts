import { z } from "zod";

export const adminProductSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อสินค้า"),
  slug: z
    .string()
    .min(1, "กรุณากรอก Slug")
    .regex(/^[a-z0-9-]+$/, "Slug ต้องเป็นตัวอักษรภาษาอังกฤษพิมพ์เล็ก ตัวเลข และขีดกลางเท่านั้น"),
  shortDescription: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  brandId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  status: z.enum(["draft", "active", "out_of_stock", "archived"]).default("draft"),
  basePrice: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional().nullable(),
  sku: z.string().min(1, "กรุณากรอก SKU"),
  stockQuantity: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative().default(10),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  supports3d: z.boolean().default(false),
  supports360: z.boolean().default(false),
  supportsAr: z.boolean().default(false),
  modelGlbUrl: z.string().url().optional().nullable(),
  modelUsdzUrl: z.string().url().optional().nullable(),
  fallbackImageUrl: z.string().url().optional().nullable(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(300).optional(),
});

export type AdminProductInput = z.infer<typeof adminProductSchema>;

export const hotspotSchema = z.object({
  id: z.string().optional(), // absent/draft-prefixed = new row to insert
  title: z.string().min(1),
  description: z.string().optional().default(""),
  position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  normal: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const hotspotsPayloadSchema = z.object({
  hotspots: z.array(hotspotSchema),
});
