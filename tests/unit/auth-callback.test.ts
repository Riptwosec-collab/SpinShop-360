// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const { exchange, verify, reset } = vi.hoisted(() => ({
  exchange: vi.fn(),
  verify: vi.fn(),
  reset: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({
    auth: {
      exchangeCodeForSession: exchange,
      verifyOtp: verify,
      resetPasswordForEmail: reset,
    },
  }),
}));
vi.mock("@/lib/constants", () => ({ USE_MOCK_DATA: false }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => ({ success: true }) }));
import { GET as callback } from "@/app/api/auth/callback/route";
import { GET as confirm } from "@/app/api/auth/confirm/route";
import { POST as forgot } from "@/app/api/auth/forgot-password/route";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shop.example");
  exchange.mockResolvedValue({ error: null });
  verify.mockResolvedValue({ error: null });
  reset.mockResolvedValue({ error: null });
});
describe("authentication endpoints", () => {
  it("exchanges the PKCE code and preserves recovery destination", async () => {
    const response = await callback(
      new NextRequest(
        "https://shop.example/api/auth/callback?code=one-use&next=/reset-password",
      ),
    );
    expect(exchange).toHaveBeenCalledWith("one-use");
    expect(response.headers.get("location")).toBe(
      "https://shop.example/reset-password",
    );
  });
  it("does not follow arbitrary redirects", async () => {
    const response = await callback(
      new NextRequest(
        "https://shop.example/api/auth/callback?code=one-use&next=https://evil.example",
      ),
    );
    expect(response.headers.get("location")).toBe(
      "https://shop.example/account",
    );
  });
  it("rejects expired codes and does not forward them", async () => {
    exchange.mockResolvedValue({ error: { message: "expired" } });
    const response = await callback(
      new NextRequest("https://shop.example/api/auth/callback?code=expired"),
    );
    expect(response.headers.get("location")).toBe(
      "https://shop.example/login?error=auth-link",
    );
  });
  it("verifies a recovery token hash before showing reset password", async () => {
    const response = await confirm(
      new NextRequest(
        "https://shop.example/api/auth/confirm?token_hash=hash&type=recovery",
      ),
    );
    expect(verify).toHaveBeenCalledWith({
      token_hash: "hash",
      type: "recovery",
    });
    expect(response.headers.get("location")).toBe(
      "https://shop.example/reset-password",
    );
  });
  it("requests real recovery with a same-site PKCE callback", async () => {
    const response = await forgot(
      new NextRequest("https://shop.example/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "a@example.com" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(reset).toHaveBeenCalledWith("a@example.com", {
      redirectTo: "https://shop.example/api/auth/callback?next=/reset-password",
    });
  });
  it("reports delivery service failure without claiming an email was sent", async () => {
    reset.mockResolvedValue({ error: { message: "SMTP unavailable" } });
    const response = await forgot(
      new NextRequest("https://shop.example/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "a@example.com" }),
      }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false });
  });
});
