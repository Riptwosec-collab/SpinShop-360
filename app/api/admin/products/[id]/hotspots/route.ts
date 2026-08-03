import { NextResponse, type NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { hotspotsPayloadSchema } from "@/lib/validators/admin-product";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit-log";

/**
 * PUT /api/admin/products/[id]/hotspots
 * Replaces the full set of hotspots for a product in one call — simplest
 * correct semantics for a "save" button in the editor (delete rows the
 * editor removed, insert new ones, update the rest) rather than diffing
 * individual add/remove/update calls from the client.
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "ต้องเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลจึงจะบันทึก Hotspot ได้ (ต้องเชื่อมต่อ Supabase)" },
      { status: 401 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = hotspotsPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "ข้อมูล Hotspot ไม่ถูกต้อง" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" }, { status: 500 });
  }

  // Replace-all: delete existing rows for this product, then bulk-insert
  // the editor's current set. Simpler and less error-prone than diffing,
  // and hotspot counts are small (single digits) so this is cheap.
  const { error: deleteError } = await supabase.from("product_hotspots").delete().eq("product_id", params.id);
  if (deleteError) {
    return NextResponse.json({ ok: false, message: "ไม่สามารถบันทึก Hotspot ได้" }, { status: 400 });
  }

  if (parsed.data.hotspots.length > 0) {
    const { error: insertError } = await supabase.from("product_hotspots").insert(
      parsed.data.hotspots.map((h, index) => ({
        product_id: params.id,
        title: h.title,
        description: h.description,
        position: h.position,
        normal: h.normal,
        is_active: h.isActive,
        sort_order: h.sortOrder ?? index,
      }))
    );
    if (insertError) {
      return NextResponse.json({ ok: false, message: "ไม่สามารถบันทึก Hotspot ได้" }, { status: 400 });
    }
  }

  await writeAuditLog({
    userId: session.userId,
    action: "product.hotspots.save",
    entityType: "product",
    entityId: params.id,
    metadata: { count: parsed.data.hotspots.length },
  });

  return NextResponse.json({ ok: true, message: "บันทึก Hotspot สำเร็จ" });
}
