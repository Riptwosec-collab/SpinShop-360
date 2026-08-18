import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCheckoutToken, verifyCheckoutToken } from "@/lib/checkout-token";

describe("checkout token", () => {
  beforeEach(() => {
    process.env.CHECKOUT_SIGNING_SECRET = "test-secret-that-is-long-enough-for-signing";
  });

  afterEach(() => {
    delete process.env.CHECKOUT_SIGNING_SECRET;
  });

  it("verifies a valid token for the expected order", () => {
    const token = createCheckoutToken("order-1", "SS260803-1234", 60);
    expect(verifyCheckoutToken(token, "order-1")).toMatchObject({
      orderId: "order-1",
      orderNumber: "SS260803-1234",
    });
  });

  it("rejects a token used for another order", () => {
    const token = createCheckoutToken("order-1", "SS260803-1234", 60);
    expect(verifyCheckoutToken(token, "order-2")).toBeNull();
  });

  it("rejects a modified token", () => {
    const token = createCheckoutToken("order-1", "SS260803-1234", 60);
    const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
    expect(verifyCheckoutToken(tampered, "order-1")).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = createCheckoutToken("order-1", "SS260803-1234", -1);
    expect(verifyCheckoutToken(token, "order-1")).toBeNull();
  });
});
