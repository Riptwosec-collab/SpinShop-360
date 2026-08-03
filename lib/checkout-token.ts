import { createHmac, timingSafeEqual } from "node:crypto";

interface CheckoutTokenPayload {
  orderId: string;
  orderNumber: string;
  exp: number;
}

function signingSecret() {
  const secret = process.env.CHECKOUT_SIGNING_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("Checkout signing secret is not configured");
  }
  return secret;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function signature(encodedPayload: string) {
  return createHmac("sha256", signingSecret()).update(encodedPayload).digest("base64url");
}

export function createCheckoutToken(orderId: string, orderNumber: string, ttlSeconds = 30 * 60) {
  const payload: CheckoutTokenPayload = {
    orderId,
    orderNumber,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${signature(encodedPayload)}`;
}

export function verifyCheckoutToken(token: string, expectedOrderId: string): CheckoutTokenPayload | null {
  const [encodedPayload, suppliedSignature] = token.split(".");
  if (!encodedPayload || !suppliedSignature) return null;

  const expectedSignature = signature(encodedPayload);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as CheckoutTokenPayload;
    if (payload.orderId !== expectedOrderId) return null;
    if (!payload.orderNumber || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
