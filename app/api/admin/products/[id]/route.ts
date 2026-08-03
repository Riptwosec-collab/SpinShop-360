import { NextResponse, type NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { adminProductSchema } from "@/lib/validators/admin-product";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit-log";
import type { Database } from "@/types/database";

type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "ต้องเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลจึงจะแก้ไขสินค้าได้ (ต้องเชื่อมต่อ Supabase)" },
      { status: 401 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = adminProductSchema.partial().safeParse(json);
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
  const patch: ProductUpdate = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.shortDescription !== undefined) patch.short_description = input.shortDescription;
  if (input.description !== undefined) patch.description = input.description;
  if (input.brandId !== undefined) patch.brand_id = input.brandId;
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;
  if (input.status !== undefined) patch.status = input.status;
  if (input.basePrice !== undefined) patch.base_price = input.basePrice;
  if (input.compareAtPrice !== undefined) patch.compare_at_price = input.compareAtPrice;
  if (input.sku !== undefined) patch.sku = input.sku;
  if (input.stockQuantity !== undefined) patch.stock_quantity = input.stockQuantity;
  if (input.lowStockThreshold !== undefined) patch.low_stock_threshold = input.lowStockThreshold;
  if (input.isFeatured !== undefined) patch.is_featured = input.isFeatured;
  if (input.isBestseller !== undefined) patch.is_bestseller = input.isBestseller;
  if (input.supports3d !== undefined) patch.supports_3d = input.supports3d;
  if (input.supports360 !== undefined) patch.supports_360 = input.supports360;
  if (input.supportsAr !== undefined) patch.supports_ar = input.supportsAr;
  if (input.modelGlbUrl !== undefined) patch.model_glb_url = input.modelGlbUrl;
  if (input.modelUsdzUrl !== undefined) patch.model_usdz_url = input.modelUsdzUrl;
  if (input.fallbackImageUrl !== undefined) patch.fallback_image_url = input.fallbackImageUrl;
  if (input.seoTitle !== undefined) patch.seo_title = input.seoTitle;
  if (input.seoDescription !== undefined) patch.seo_description = input.seoDescription;

  const { data, error } = await supabase.from("products").update(patch).eq("id", id).select().single();

  if (error) {
    const message = error.code === "23505" ? "SKU หรือ Slug นี้มีอยู่ในระบบแล้ว" : "ไม่สามารถบันทึกการเปลี่ยนแปลงได้";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }

  await writeAuditLog({
    userId: session.userId,
    action: "product.update",
    entityType: "product",
    entityId: id,
    metadata: { changedFields: Object.keys(patch) },
  });

  return NextResponse.json({ ok: true, message: "บันทึกการเปลี่ยนแปลงสำเร็จ", product: data });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "ต้องเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" }, { status: 500 });
  }

  const { error } = await supabase
    .from("products")
    .update({ status: "archived", deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, message: "ไม่สามารถลบสินค้าได้" }, { status: 400 });
  }

  await writeAuditLog({ userId: session.userId, action: "product.delete", entityType: "product", entityId: id });

  return NextResponse.json({ ok: true, message: "ลบสินค้าสำเร็จ (Soft Delete)" });
}
