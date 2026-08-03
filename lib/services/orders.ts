import type { CartItem } from "@/types/cart";
import type { Order, PaymentMethod, ShippingAddress } from "@/types/order";
import { MOCK_PRODUCTS } from "@/lib/mock-data/products";
import { generateOrderNumber } from "@/lib/utils";
import { DEFAULT_SHIPPING_FEE, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

interface CreateOrderInput {
  email: string;
  phone: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  shippingMethod: string;
  couponCode?: string | null;
  discount?: number;
  customerNote?: string;
}

/**
 * Mock order creation that mirrors what a real Server Action would do:
 * 1. Re-check price + stock against the source of truth (never trust the
 *    client's cached price/stock).
 * 2. Recompute totals server-side.
 * 3. Persist the order with a line-item price/variant *snapshot* so future
 *    catalog price changes never retroactively alter historical orders.
 *
 * In Supabase mode this becomes a Postgres transaction (see
 * supabase/migrations) that decrements `product_variants.stock_quantity`
 * and inserts into `orders` / `order_items` atomically.
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<{ ok: boolean; message: string; order?: Order }> {
  await new Promise((r) => setTimeout(r, 600));

  // Server-side re-verification
  for (const item of input.items) {
    const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    if (!product || !variant) {
      return { ok: false, message: `ไม่พบสินค้า ${item.productName} ในระบบ` };
    }
    if (variant.stockQuantity < item.quantity) {
      return { ok: false, message: `สินค้า ${item.productName} มีไม่เพียงพอในสต็อก` };
    }
    if (variant.price !== item.unitPrice) {
      // Price changed since it was added to cart — in production, block and
      // notify; here we proceed using the current server price to keep the
      // mock flow simple.
      item.unitPrice = variant.price;
    }
  }

  const subtotal = input.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discount = input.discount ?? 0;
  const shippingFee =
    input.shippingMethod === "express" ? DEFAULT_SHIPPING_FEE * 2 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
  const grandTotal = Math.max(0, subtotal + shippingFee - discount);

  const order: Order = {
    id: `order-${Date.now()}`,
    orderNumber: generateOrderNumber(),
    email: input.email,
    phone: input.phone,
    status: input.paymentMethod === "cod" ? "processing" : "pending",
    items: input.items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      productName: i.productName,
      sku: i.variantId,
      variantName: i.variantLabel,
      imageUrl: i.imageUrl,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.unitPrice * i.quantity,
    })),
    subtotal,
    discountAmount: discount,
    shippingFee,
    taxAmount: 0,
    grandTotal,
    couponCode: input.couponCode,
    shippingAddress: input.shippingAddress,
    paymentMethod: input.paymentMethod,
    shippingMethod: input.shippingMethod,
    customerNote: input.customerNote,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const stored = JSON.parse(window.localStorage.getItem("spinshop360-orders") ?? "[]");
    window.localStorage.setItem("spinshop360-orders", JSON.stringify([order, ...stored]));
  }

  return { ok: true, message: "สร้างคำสั่งซื้อสำเร็จ", order };
}

export function getMockOrder(orderNumber: string): Order | null {
  if (typeof window === "undefined") return null;
  const stored: Order[] = JSON.parse(window.localStorage.getItem("spinshop360-orders") ?? "[]");
  return stored.find((o) => o.orderNumber === orderNumber) ?? null;
}
