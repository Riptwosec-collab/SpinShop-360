export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  slug: string;
  imageUrl: string;
  unitPrice: number;
  compareAtPrice?: number | null;
  quantity: number;
  stockQuantity: number;
}

export interface CartCoupon {
  code: string;
  discountType: "percentage" | "fixed" | "free_shipping";
  discountValue: number;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  freeShippingThreshold: number;
}
