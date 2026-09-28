import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { loadCheckoutSession, saveCheckoutSession, clearCheckoutSession, type CheckoutSession } from "@/lib/services/checkout-session";
import { useCartStore } from "@/lib/stores/cart-store";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/constants", async importOriginal => ({ ...await importOriginal<object>(), USE_MOCK_DATA: false }));
vi.mock("@/lib/i18n/locale-provider", () => ({ useTranslation: () => ({ locale: "en" }) }));
vi.mock("@/lib/i18n/localized", () => ({ Localized: ({ children }: { children: React.ReactNode }) => children }));
const item = { id: "cart-1", productId: "p1", variantId: "v1", productName: "Mouse", variantLabel: "Black", slug: "mouse", imageUrl: "", unitPrice: 100, stockQuantity: 5, quantity: 1 };
const snapshot: CheckoutSession = {
  key: "70ec6d55-934d-43b9-9ea8-e572867e7eaa",
  request: { email: "guest@example.com", phone: "0812345678", items: [item],
    shippingAddress: { recipientName: "Guest Name", phone: "0812345678", addressLine1: "123 Test Road", subdistrict: "Test", district: "Test", province: "Bangkok", postalCode: "10110" },
    paymentMethod: "promptpay", shippingMethod: "standard", couponCode: null },
};
const order = { id: "order-1", orderNumber: "SP-001", grandTotal: 250 };
beforeEach(() => { sessionStorage.clear(); useCartStore.getState().clearCart(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("recovers the exact nonce/payload after a lost response and requires a second confirmation of the server total", async () => {
  saveCheckoutSession(snapshot);
  const fetcher = vi.fn().mockRejectedValueOnce(new Error("lost response"))
    .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, order }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, qrCodeData: "https://gateway.example/qr" }) });
  vi.stubGlobal("fetch", fetcher);
  const view = render(<CheckoutFlow/>);
  fireEvent.click(await screen.findByRole("button", { name: "Recover saved order" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  view.unmount();
  render(<CheckoutFlow/>);
  fireEvent.click(await screen.findByRole("button", { name: "Recover saved order" }));
  expect(await screen.findByTestId("server-order-total")).toHaveTextContent("250");
  expect(fetcher).toHaveBeenCalledTimes(2);
  for (const call of fetcher.mock.calls) {
    expect(call[0]).toBe("/api/orders");
    expect(call[1].headers["Idempotency-Key"]).toBe(snapshot.key);
    expect(JSON.parse(call[1].body)).toEqual(snapshot.request);
  }
  fireEvent.click(screen.getByRole("button", { name: /Confirm.*250/ }));
  await screen.findByRole("link", { name: "Open payment QR code" });
  expect(fetcher.mock.calls[2][0]).toBe("/api/payments/create");
  expect(JSON.parse(fetcher.mock.calls[2][1].body)).toEqual({ orderId: "order-1" });
});

it("resumes the saved order with an empty cart without creating another order", async () => {
  saveCheckoutSession({ ...snapshot, order });
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, qrCodeData: "https://gateway.example/qr" }) });
  vi.stubGlobal("fetch", fetcher);
  render(<CheckoutFlow/>);
  fireEvent.click(await screen.findByRole("button", { name: /Confirm.*250/ }));
  await screen.findByRole("link", { name: "Open payment QR code" });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][0]).toBe("/api/payments/create");
});

it("removes ordered quantities on handoff once, preserving items added afterward", async () => {
  useCartStore.setState({ items: [{ ...item, quantity: 3 }, { ...item, id: "cart-2", variantId: "v2" }] });
  saveCheckoutSession({ ...snapshot, order });
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, qrCodeData: "https://gateway.example/qr" }) });
  vi.stubGlobal("fetch", fetcher);
  const view = render(<CheckoutFlow/>);
  fireEvent.click(await screen.findByRole("button", { name: /Confirm.*250/ }));
  await screen.findByRole("link", { name: "Open payment QR code" });
  expect(useCartStore.getState().items.map(i => i.quantity)).toEqual([2, 1]);
  view.unmount(); render(<CheckoutFlow/>);
  fireEvent.click(await screen.findByRole("button", { name: /Confirm.*250/ }));
  await screen.findByRole("link", { name: "Open payment QR code" });
  expect(useCartStore.getState().items.map(i => i.quantity)).toEqual([2, 1]);
});

it("keeps another order's recovery data when viewing a completed order", () => {
  saveCheckoutSession({ ...snapshot, order });
  clearCheckoutSession("OTHER");
  expect(loadCheckoutSession()?.order).toEqual(order);
  clearCheckoutSession("SP-001");
  expect(loadCheckoutSession()).toBeNull();
});

it("does not send a request if recovery storage is corrupt", async () => {
  sessionStorage.setItem("spinshop360-pending-checkout", "broken");
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  render(<CheckoutFlow/>);
  expect(screen.queryByRole("button")).toBeNull();
  expect(fetcher).not.toHaveBeenCalled();
});

it("unlocks editing only after the server explicitly rejects the order transaction", async () => {
  saveCheckoutSession(snapshot);
  useCartStore.setState({ items: [item] });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ ok: false, code: "ORDER_CREATE_FAILED" }) }));
  render(<CheckoutFlow/>);
  fireEvent.click(await screen.findByRole("button", { name: "Recover saved order" }));
  await waitFor(() => expect(loadCheckoutSession()).toBeNull());
  expect(useCartStore.getState().items).toHaveLength(1);
  expect(screen.queryByRole("button", { name: "Recover saved order" })).toBeNull();
});
