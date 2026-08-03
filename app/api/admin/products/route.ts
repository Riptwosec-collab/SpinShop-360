import { NextResponse, type NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { adminProductSchema } from "@/lib/validators/admin-product";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit-log";

/**
 * POST /api/admin/products
 * Creates a new product. Requires an admin/staff session (verified
 * server-side via `requireAdminSession`, never trusting a client-sent
 * role). Uses the service-role client to write past RLS since the write
 * policies already gate on `is_staff_or_admin()` — this route is the
 * trusted chokepoint that proved that check before reaching here.
 */
export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "ต้องเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลจึงจะเพิ่มสินค้าได้ (ต้องเชื่อมต่อ Supabase)" },
      { status: 401 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = adminProductSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "ข้อมูลสินค้าไม่ถูกต้อง", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" }, { status: 500 });
  }

  const input = parsed.data;
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      slug: input.slug,
      short_description: input.shortDescription,
      description: input.description,
      brand_id: input.brandId,
      category_id: input.categoryId,
      status: input.status,
      base_price: input.basePrice,
      compare_at_price: input.compareAtPrice,
      sku: input.sku,
      stock_quantity: input.stockQuantity,
      low_stock_threshold: input.lowStockThreshold,
      is_featured: input.isFeatured,
      is_bestseller: input.isBestseller,
      supports_3d: input.supports3d,
      supports_360: input.supports360,
      supports_ar: input.supportsAr,
      model_glb_url: input.modelGlbUrl,
      model_usdz_url: input.modelUsdzUrl,
      fallback_image_url: input.fallbackImageUrl,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
      published_at: input.status === "active" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    const message = error.code === "23505" ? "SKU หรือ Slug นี้มีอยู่ในระบบแล้ว" : "ไม่สามารถบันทึกสินค้าได้";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }

  await writeAuditLog({
    userId: session.userId,
    action: "product.create",
    entityType: "product",
    entityId: data.id,
    metadata: { name: data.name, sku: data.sku },
  });

  return NextResponse.json({ ok: true, message: "เพิ่มสินค้าสำเร็จ", product: data });
}
