import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyOrderViewToken } from "@/lib/checkout-token";

function orderViewCookieName(orderNumber: string) {
  return `spinshop_order_${orderNumber}`;
}

/**
 * Returns an order to its signed-in owner, staff, or the guest browser that
 * holds the signed confirmation cookie issued when the order was created.
 */
export async function GET(request: NextRequest, { params }: { params: { orderNumber: string } }) {
  const orderNumber = params.orderNumber.trim();
  if (!/^SS\d{6}-\d{4,}$/.test(orderNumber)) {
    return NextResponse.json({ ok: false, message: "เลขที่คำสั่งซื้อไม่ถูกต้อง" }, { status: 400 });
  }

  const userClient = createSupabaseServerClient();
  if (userClient) {
    const { data: ownedOrder } = await userClient
      .from("orders")
      .select("*, order_items(*)")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (ownedOrder) {
      return NextResponse.json(
        { ok: true, order: ownedOrder },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }
  }

  const tokenValue = request.cookies.get(orderViewCookieName(orderNumber))?.value;
  const token = tokenValue ? verifyOrderViewToken(tokenValue, orderNumber) : null;
  if (!token) {
    return NextResponse.json({ ok: false, message: "ไม่พบคำสั่งซื้อนี้ หรือไม่มีสิทธิ์เข้าถึง" }, { status: 404 });
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return NextResponse.json({ ok: false, message: "Supabase not configured" }, { status: 501 });
  }

  const { data: order, error } = await serviceClient
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", token.orderId)
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ ok: false, message: "ไม่พบคำสั่งซื้อนี้" }, { status: 404 });
  }

  return NextResponse.json(
    { ok: true, order },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
