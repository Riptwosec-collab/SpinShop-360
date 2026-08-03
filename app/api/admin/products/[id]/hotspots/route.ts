import { NextResponse, type NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { hotspotsPayloadSchema } from "@/lib/validators/admin-product";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit-log";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
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

  const { error: deleteError } = await supabase.from("product_hotspots").delete().eq("product_id", id);
  if (deleteError) {
    return NextResponse.json({ ok: false, message: "ไม่สามารถบันทึก Hotspot ได้" }, { status: 400 });
  }

  if (parsed.data.hotspots.length > 0) {
    const { error: insertError } = await supabase.from("product_hotspots").insert(
      parsed.data.hotspots.map((hotspot, index) => ({
        product_id: id,
        title: hotspot.title,
        description: hotspot.description,
        position: hotspot.position,
        normal: hotspot.normal,
        is_active: hotspot.isActive,
        sort_order: hotspot.sortOrder ?? index,
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
    entityId: id,
    metadata: { count: parsed.data.hotspots.length },
  });

  return NextResponse.json({ ok: true, message: "บันทึก Hotspot สำเร็จ" });
}
