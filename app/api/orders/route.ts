import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { createOrder as createOrderMock } from "@/lib/services/orders";
import { writeAuditLog } from "@/lib/audit-log";
import { generateOrderNumber, formatCurrency } from "@/lib/utils";
import { addressSchema } from "@/lib/validators/checkout";
import { getActiveEmailAdapter, orderConfirmationEmail } from "@/lib/email";

const bodySchema = z.object({
  email: z.string().email(),
  phone: z.string(),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string(),
      quantity: z.number().int().positive(),
      productName: z.string(),
      variantLabel: z.string(),
      slug: z.string(),
      imageUrl: z.string(),
      unitPrice: z.number(),
      compareAtPrice: z.number().nullable().optional(),
      stockQuantity: z.number(),
      id: z.string(),
    })
  ),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(["promptpay", "credit_card", "debit_card", "bank_transfer", "cod"]),
  shippingMethod: z.enum(["standard", "express"]),
  couponCode: z.string().nullable().optional(),
  discount: z.number().nonnegative().optional(),
  customerNote: z.string().optional(),
  shippingFee: z.number().nonnegative(),
});

/**
 * POST /api/orders
 *
 * This is the ONLY place an order is ever created. It re-derives price and
 * stock from the database (never the client's cached cart values) and, in
 * Supabase mode, wraps stock-decrement + order-insert in a single Postgres
 * transaction (`create_order_with_stock_check`) via row locking so
 * concurrent checkouts cannot oversell the last unit of a variant.
 *
 * Falls back to the in-memory Mock order service when Supabase isn't
 * configured, so local development keeps working without a database.
 */
export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "ข้อมูลคำสั่งซื้อไม่ถูกต้อง" }, { status: 400 });
  }

  const supabaseAuth = createSupabaseServerClient();
  const serviceClient = createSupabaseServiceClient();

  if (!serviceClient) {
    // Mock Mode fallback — mirrors the same validation logic client-side.
    const result = await createOrderMock({
      email: parsed.data.email,
      phone: parsed.data.phone,
      items: parsed.data.items,
      shippingAddress: parsed.data.shippingAddress,
      paymentMethod: parsed.data.paymentMethod,
      shippingMethod: parsed.data.shippingMethod,
      couponCode: parsed.data.couponCode,
      discount: parsed.data.discount,
      customerNote: parsed.data.customerNote,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  const userId = supabaseAuth ? (await supabaseAuth.auth.getUser()).data.user?.id ?? null : null;
  const orderNumber = generateOrderNumber();

  const { data, error } = await serviceClient.rpc("create_order_with_stock_check", {
    p_order_number: orderNumber,
    p_user_id: userId,
    p_email: parsed.data.email,
    p_phone: parsed.data.phone,
    p_items: parsed.data.items.map((i) => ({
      product_id: i.productId,
      variant_id: i.variantId,
      quantity: i.quantity,
    })),
    p_shipping_address: parsed.data.shippingAddress,
    p_payment_method: parsed.data.paymentMethod,
    p_shipping_method: parsed.data.shippingMethod,
    p_shipping_fee: parsed.data.shippingFee,
    p_discount_amount: parsed.data.discount ?? 0,
    p_coupon_code: parsed.data.couponCode ?? null,
    p_customer_note: parsed.data.customerNote ?? null,
  });

  if (error) {
    const isExpectedError = error.message.includes("insufficient_stock") || error.message.includes("variant_not_found");
    if (!isExpectedError) {
      Sentry.captureException(new Error(`create_order_with_stock_check failed: ${error.message}`));
    }
    const message = error.message.includes("insufficient_stock")
      ? "สินค้าบางรายการมีไม่เพียงพอในสต็อก กรุณาลองใหม่"
      : error.message.includes("variant_not_found")
        ? "ไม่พบสินค้าบางรายการในระบบ"
        : "ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }

  const result = Array.isArray(data) ? data[0] : data;

  await writeAuditLog({
    userId,
    action: "order.create",
    entityType: "order",
    entityId: result.order_id,
    metadata: { orderNumber: result.order_number, grandTotal: result.grand_total },
  });

  // Fire-and-forget — a failed confirmation email should never block the
  // checkout response the customer is waiting on.
  const itemsHtml = parsed.data.items
    .map((i) => `<p>${i.productName} x${i.quantity} — ${formatCurrency(i.unitPrice * i.quantity)}</p>`)
    .join("");
  getActiveEmailAdapter()
    .send({
      to: parsed.data.email,
      subject: `ยืนยันคำสั่งซื้อ ${result.order_number} — SpinShop 360`,
      html: orderConfirmationEmail({
        orderNumber: result.order_number,
        itemsHtml,
        grandTotal: formatCurrency(result.grand_total),
      }),
    })
    .catch(() => undefined);

  return NextResponse.json({
    ok: true,
    message: "สร้างคำสั่งซื้อสำเร็จ",
    order: { id: result.order_id, orderNumber: result.order_number, grandTotal: result.grand_total },
  });
}
