import { type NextRequest } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrder as createOrderMock } from "@/lib/services/orders";
import { writeAuditLog } from "@/lib/audit-log";
import { generateOrderNumber, formatCurrency } from "@/lib/utils";
import { addressSchema } from "@/lib/validators/checkout";
import { getActiveEmailAdapter, orderConfirmationEmail } from "@/lib/email";
import { paymentDatabase, paymentResponse, sameOriginRequest, guestTokenForCheckout, setGuestOrderCookie } from "@/lib/payments/server";
import { hashGuestToken } from "@/lib/payments/security";

const bodySchema = z.object({
  email: z.string().email(),
  phone: z.string(),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string(),
      quantity: z.number().int().positive().max(999),
      productName: z.string(),
      variantLabel: z.string(),
      slug: z.string(),
      imageUrl: z.string(),
      unitPrice: z.number(),
      compareAtPrice: z.number().nullable().optional(),
      stockQuantity: z.number(),
      id: z.string(),
    })
  ).min(1).max(100),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(["promptpay", "credit_card", "debit_card", "bank_transfer", "cod"]),
  shippingMethod: z.enum(["standard", "express"]),
  couponCode: z.string().nullable().optional(),
  discount: z.number().nonnegative().optional(),
  customerNote: z.string().optional(),
  shippingFee: z.number().nonnegative().optional(),
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
 * Mock fallback is allowed only in explicit demo mode. Real mode fails closed.
 */
export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request)) return paymentResponse({ ok: false, code: "FORBIDDEN", message: "ไม่อนุญาตคำขอจากเว็บไซต์นี้" }, 403);
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return paymentResponse({ ok: false, code: "INVALID_REQUEST", message: "ข้อมูลคำสั่งซื้อไม่ถูกต้อง" }, 400);
  }

  const supabaseAuth = createSupabaseServerClient();
  const serviceClient = paymentDatabase();

  if (!serviceClient) {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") return paymentResponse({ ok: false, code: "ORDER_UNAVAILABLE", message: "ระบบคำสั่งซื้อยังไม่พร้อมใช้งาน" }, 503);
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
    return paymentResponse(result, result.ok ? 200 : 400);
  }

  if (parsed.data.paymentMethod === "bank_transfer") return paymentResponse({ ok: false, code: "UNSUPPORTED_PAYMENT_METHOD", message: "กรุณาเลือกช่องทางชำระเงินอื่น" }, 400);

  const userId = supabaseAuth ? (await supabaseAuth.auth.getUser()).data.user?.id ?? null : null;
  const suppliedKey = request.headers.get("idempotency-key");
  if (suppliedKey && !z.string().uuid().safeParse(suppliedKey).success) return paymentResponse({ ok: false, code: "INVALID_REQUEST", message: "ข้อมูลคำขอไม่ถูกต้อง" }, 400);
  const requestKey = suppliedKey || randomUUID();
  const guestToken = userId ? null : guestTokenForCheckout(requestKey);
  const requestHash = createHash("sha256").update(JSON.stringify(parsed.data)).digest("hex");
  const { data, error } = await serviceClient.rpc("create_order_once", {
    p_request_key: requestKey,
    p_request_hash: requestHash,
    p_user_id: userId,
    p_guest_token_hash: guestToken ? hashGuestToken(guestToken) : null,
    p_request: { ...parsed.data, orderNumber: generateOrderNumber() },
  });

  if (error) {
    const isExpectedError = error.message.includes("insufficient_stock") || error.message.includes("variant_not_found");
    if (!isExpectedError) {
      Sentry.captureException(new Error(`create_order_once failed: ${error.message}`));
    }
    const message = error.message.includes("insufficient_stock")
      ? "สินค้าบางรายการมีไม่เพียงพอในสต็อก กรุณาลองใหม่"
      : error.message.includes("variant_not_found")
        ? "ไม่พบสินค้าบางรายการในระบบ"
        : "ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่";
    return paymentResponse({ ok: false, code: error.message.includes("idempotency_conflict") ? "IDEMPOTENCY_CONFLICT" : "ORDER_CREATE_FAILED", message }, error.message.includes("idempotency_conflict") ? 409 : 400);
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result.replayed) await writeAuditLog({
    userId,
    action: "order.create",
    entityType: "order",
    entityId: result.order_id,
    metadata: { orderNumber: result.order_number, grandTotal: result.grand_total },
  });

  // Use the immutable database snapshot for email content, never cart prices or
  // unescaped user-supplied names. A replay does not send another confirmation.
  if (!result.replayed) {
    const { data: storedItems } = await serviceClient.from("order_items").select("product_name,quantity,line_total").eq("order_id", result.order_id);
    const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
    const itemsHtml = (storedItems ?? []).map((item) => `<p>${escapeHtml(item.product_name)} x${item.quantity} — ${formatCurrency(Number(item.line_total))}</p>`).join("");
    getActiveEmailAdapter().send({
      to: parsed.data.email,
      subject: `ยืนยันคำสั่งซื้อ ${result.order_number} — SpinShop 360`,
      html: orderConfirmationEmail({ orderNumber: result.order_number, itemsHtml, grandTotal: formatCurrency(Number(result.grand_total)) }),
    }).catch(() => undefined);
  }

  const response = paymentResponse({
    ok: true,
    message: "สร้างคำสั่งซื้อสำเร็จ",
    order: { id: result.order_id, orderNumber: result.order_number, grandTotal: Number(result.grand_total) },
  });
  if (guestToken) setGuestOrderCookie(response, result.order_id, guestToken);
  return response;
}
