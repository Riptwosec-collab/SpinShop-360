import { test, expect } from "@playwright/test";

test("Studio selection updates the purchasable variant and dimensions stay explicit", async ({ page }) => {
  await page.goto("/products/vertex-pro-gaming-mouse");
  await page.getByRole("button", { name: "สีในสตูดิโอ: ขาว", exact: true }).click();
  await expect(page.getByRole("button", { name: "สี ขาว", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("SKU: VTX-MSE-001-WHT", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "ขนาดสินค้า", exact: true }).click();
  await expect(page.getByText("6.2 × 3.8 × 11.8 cm", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "in", exact: true }).click();
  await expect(page.getByText("2.44 × 1.5 × 4.65 in", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "สี ดำ", exact: true }).click();
  await expect(page.getByRole("button", { name: "สีในสตูดิโอ: ดำ", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test.describe("production PWA", () => {
  test.skip(!process.env.PLAYWRIGHT_USE_BUILD, "Service workers are registered only in a production build.");

  test("manifest serves installable icons and standalone configuration", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBe(true);
    const manifest = await response.json();
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192", type: "image/png" }),
      expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
    ]));
    for (const icon of manifest.icons) {
      const image = await request.get(icon.src);
      expect(image.ok()).toBe(true);
      expect(image.headers()["content-type"]).toContain("image/png");
    }
  });

  test("real service worker falls back offline while keeping sensitive pages out of Cache Storage", async ({ page, context }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
      }
    });
    for (const route of ["/products", "/account", "/checkout", "/login"]) {
      await page.goto(route);
    }
    const cachedPaths = await page.evaluate(async () => {
      const names = await caches.keys();
      const entries = await Promise.all(names.map(async (name) => (await (await caches.open(name)).keys()).map((request) => new URL(request.url).pathname)));
      return entries.flat();
    });
    expect(cachedPaths).toContain("/offline.html");
    expect(cachedPaths.every((path) => path === "/offline.html" || path.startsWith("/icons/"))).toBe(true);
    await context.setOffline(true);
    await page.goto("/products/offline-check");
    await expect(page.getByRole("heading", { name: "ขณะนี้คุณออฟไลน์" })).toBeVisible();
    await expect(page.getByText("You are offline", { exact: true })).toBeVisible();
    // Sensitive navigations must fail at the network boundary, never receive an offline cached page.
    const sensitive = await context.newPage();
    await expect(sensitive.goto("/checkout")).rejects.toThrow();
    await context.setOffline(false);
    await sensitive.close();
  });
});

test("English forms preserve input on failure and show success only after persistence succeeds", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "สลับภาษา / Switch language" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Test Customer");
  await page.getByLabel("Email", { exact: true }).fill("test@example.com");
  await page.getByRole("textbox", { name: "Message", exact: true }).fill("Please help with my order.");
  await page.route("**/api/contact", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, code: "save_failed" }) }));
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Could not save" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Message", exact: true })).toHaveValue("Please help with my order.");
  await expect(page.getByText("Your message has been saved.", { exact: true })).not.toBeVisible();
  await page.unroute("**/api/contact");
  await page.route("**/api/contact", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("Your message has been saved.", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Message", exact: true })).toHaveValue("");
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "เปลี่ยนเป็นภาษาไทย" })).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});
