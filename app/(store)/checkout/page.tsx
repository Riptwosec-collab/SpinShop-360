import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export const metadata: Metadata = { title: "ชำระเงิน" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">ชำระเงิน</h1>
      <CheckoutFlow />
    </div>
  );
}
