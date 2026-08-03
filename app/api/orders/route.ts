import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { createOrder as createOrderMock } from "@/lib/services/orders";
import { writeAuditLog } from "@/lib/audit-log";
import { generateOrderNumber, formatCurrency } from "@/lib/utils";
import { addressSchema } from "@/lib/validators/checkout";
import { getActiveEmailAdapter, orderConfirmationEmail } from "@/lib/email";
import { createCheckoutToken } from "@/lib/checkout-token";

const bodySchema = z.object({
  email: z.string().email().max(320),
  phone: z.string().min(8).max(30),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1),
        quantity: z.number().int().positive().max(99),
        productName: z.string().optional(),
        variantLabel: z.string().optional(),
        slug: z.string().optional(),
        imageUrl: z.string().optional(),
        unitPrice: z.number().optional(),
        compareAtPrice: z.number().nullable().optional(),
        stockQuantity: z.number().optional(),
        id: z.string().optional(),
      })
    )
    .min(1)
    .max(100),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(["promptpay", "credit_card", "debit_card", "bank_transfer", "cod"]),
  shippingMethod: z.enum(["standard", "express"]),
  couponCode: z.string().trim().max(50).nullable().optional(),
  customerNote: z.string().max(1000).optional(),
});

function orderErrorMessage(message: string) {
  if (message.includes("empty_cart")) return "ตะกร้าสินค้าว่างเปล่า";
  if (message.includes("insufficient_stock")) return "สินค้าบางรายการมีไม่เพียงพอในสต็อก กรุณาลองใหม่";
  if (message.includes("variant_not_found") || message.includes("product_not_available")) {
    return "ไม่พบสินค้าบางรายการ หรือสินค้าถูกปิดการขายแล้ว";
  }
  if (message.includes("coupon_invalid")) return "ไม่พบคูปองนี้ หรือคูปองถูกปิดใช้งานแล้ว";
  if (message.includes("coupon_not_started")) return "คูปองยังไม่เริ่มใช้งาน";
  if (message.includes("coupon_expired")) return "คูปองหมดอายุแล้ว";
  if (message.includes("coupon_minimum_not_met")) return "ยอดสั่งซื้อไม่ถึงขั้นต่ำของคูปอง";
  if (message.includes("coupon_usage_limit") || message.includes("coupon_user_limit")) {
    return "คูปองถูกใช้ครบจำนวนที่กำหนดแล้ว";
  }
  return "ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่";
}

function checkoutCookieName(orderId: string) {
  return `spinshop_checkout_${orderId}`;
}

function orderViewCookieName(orderNumber: string) {
  return `spinshop_order_${orderNumber}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

/** Creates an order from canonical database prices and stock. */
export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "ข้อมูลคำสั่งซื้อไม่ถูกต้อง" }, { status: 400 });
  }

  const supabaseAuth = createSupabaseServerClient();
  const serviceClient = createSupabaseServiceClient();

  if (!serviceClient) {
    const result = await createOrderMock({
      email: parsed.data.email,
      phone: parsed.data.phone,
      items: parsed.data.items as never,
      shippingAddress: parsed.data.shippingAddress,
      paymentMethod: parsed.data.paymentMethod,
      shippingMethod: parsed.data.shippingMethod,
      couponCode: parsed.data.couponCode,
      customerNote: parsed.data.customerNote,
    });
    return NextResponse.json(result, {
      status: result.ok ? 200 : 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const userId = supabaseAuth ? (await supabaseAuth.auth.getUser()).data.user?.id ?? null : null;
  let data: unknown = null;
  let rpcError: { message: string } | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const orderNumber = generateOrderNumber();
    const result = await serviceClient.rpc("create_order_with_stock_check", {
      p_order_number: orderNumber,
      p_user_id: userId,
      p_email: parsed.data.email,
      p_phone: parsed.data.phone,
      p_items: parsed.data.items.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
      p_shipping_address: parsed.data.shippingAddress,
      p_payment_method: parsed.data.paymentMethod,
      p_shipping_method: parsed.data.shippingMethod,
      p_shipping_fee: 0,
      p_discount_amount: 0,
      p_coupon_code: parsed.data.couponCode ?? null,
      p_customer_note: parsed.data.customerNote ?? null,
    });

    data = result.data;
    rpcError = result.error;
    if (!rpcError || !rpcError.message.includes("orders_order_number_key")) break;
  }

  if (rpcError) {
    const expectedPrefixes = [
      "empty_cart",
      "insufficient_stock",
      "variant_not_found",
      "product_not_available",
      "coupon_",
      "invalid_shipping_method",
      "invalid_payment_method",
    ];
    if (!expectedPrefixes.some((prefix) => rpcError!.message.includes(prefix))) {
      Sentry.captureException(new Error(`create_order_with_stock_check failed: ${rpcError.message}`));
    }
    return NextResponse.json({ ok: false, message: orderErrorMessage(rpcError.message) }, { status: 400 });
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result || typeof result !== "object" || !("order_id" in result)) {
    Sentry.captureMessage("Order RPC returned an invalid response");
    return NextResponse.json({ ok: false, message: "ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่" }, { status: 500 });
  }

  const order = result as { order_id: string; order_number: string; grand_total: number };
  const paymentToken = parsed.data.paymentMethod === "cod"
    ? null
    : createCheckoutToken(order.order_id, order.order_number);
  const orderViewToken = createCheckoutToken(order.order_id, order.order_number, 7 * 24 * 60 * 60);

  await writeAuditLog({
    userId,
    action: "order.create",
    entityType: "order",
    entityId: order.order_id,
    metadata: { orderNumber: order.order_number, grandTotal: order.grand_total },
  });

  const { data: canonicalItems } = await serviceClient
    .from("order_items")
    .select("product_name, quantity, line_total")
    .eq("order_id", order.order_id);

  const itemsHtml = (canonicalItems ?? [])
    .map((item) => `<p>${escapeHtml(item.product_name)} x${item.quantity} — ${formatCurrency(item.line_total)}</p>`)
    .join("");

  await getActiveEmailAdapter()
    .send({
      to: parsed.data.email,
      subject: `ยืนยันคำสั่งซื้อ ${order.order_number} — SpinShop 360`,
      html: orderConfirmationEmail({
        orderNumber: order.order_number,
        itemsHtml,
        grandTotal: formatCurrency(order.grand_total),
      }),
    })
    .catch(() => undefined);

  const response = NextResponse.json(
    {
      ok: true,
      message: "สร้างคำสั่งซื้อสำเร็จ",
      order: {
        id: order.order_id,
        orderNumber: order.order_number,
        grandTotal: order.grand_total,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );

  const cookieBase = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
  };

  response.cookies.set({
    ...cookieBase,
    name: orderViewCookieName(order.order_number),
    value: orderViewToken,
    path: "/api/orders",
    maxAge: 7 * 24 * 60 * 60,
  });

  if (paymentToken) {
    response.cookies.set({
      ...cookieBase,
      name: checkoutCookieName(order.order_id),
      value: paymentToken,
      path: "/api/payments",
      maxAge: 30 * 60,
    });
  }

  return response;
}
