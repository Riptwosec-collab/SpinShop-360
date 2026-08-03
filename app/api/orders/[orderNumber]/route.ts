import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/orders/[orderNumber]
 * Used by the order-success and account pages in Supabase mode. RLS
 * (`orders_owner_or_staff_read`) ensures a signed-in user can only fetch
 * their own orders even if they guess another order number; guest orders
 * (no user_id) are matched by order_number + email verification would be
 * added here for a guest-checkout confirmation flow.
 */
export async function GET(_request: Request, { params }: { params: { orderNumber: string } }) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase not configured" }, { status: 501 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_number", params.orderNumber)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ ok: false, message: "ไม่พบคำสั่งซื้อนี้" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order });
}
