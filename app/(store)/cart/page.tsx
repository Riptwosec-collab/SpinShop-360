import type { Metadata } from "next";
import { CartPageContent } from "@/components/cart/cart-page-content";
import { CartPageHeading } from "@/components/cart/cart-page-heading";

export const metadata: Metadata = { title: "ตะกร้าสินค้า" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <CartPageHeading />
      <CartPageContent />
    </div>
  );
}
