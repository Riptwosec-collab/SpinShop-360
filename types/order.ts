export type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

export type PaymentMethod =
  | "promptpay"
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "cod";

export interface OrderItemSnapshot {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  variantName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  email: string;
  phone: string;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  grandTotal: number;
  couponCode?: string | null;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  shippingMethod: string;
  customerNote?: string;
  createdAt: string;
}
