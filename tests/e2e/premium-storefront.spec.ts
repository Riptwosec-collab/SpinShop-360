import { test, expect } from "@playwright/test";

test("clearing a selected price range removes both bounds", async ({ page }) => {
  await page.goto("/products?minPrice=1000&maxPrice=5000&brand=Vertex");
  await page.getByRole("checkbox", { name: "1,000 - 5,000 บาท", exact: true }).click();
  await expect(page).not.toHaveURL(/minPrice|maxPrice/);
  await expect(page).toHaveURL(/brand=Vertex/);
});

test("search suggestions can be opened with the keyboard", async ({ page }) => {
  await page.goto("/products");
  const search = page.getByRole("combobox", { name: "ค้นหาสินค้า" });
  await search.fill("  Vertex  ");
  await expect(page.getByRole("listbox", { name: "ผลการค้นหา" }).getByRole("option").first()).toBeVisible();
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/products\/vertex/);
});

test("a product with options links directly to variant selection", async ({ page }) => {
  await page.goto("/products");
  await page.getByRole("link", { name: "เลือกตัวเลือก" }).first().click();
  await expect(page).toHaveURL(/\/products\/.+/);
  await expect(page.getByRole("button", { name: "เพิ่มลงตะกร้า", exact: true })).toBeEnabled();
});

test("mobile navigation fits and yields to product purchase controls", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/products");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("link", { name: "เลือกตัวเลือก" }).first().click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "ใส่ตะกร้า", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("mobile menu closes on Escape and returns focus", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "เปิดเมนู" });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "เมนูหลัก" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "เมนูหลัก" })).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

for (const width of [320, 393, 768]) {
  test(`storefront fits a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 852 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto("/products");
    await expect(page.locator("article").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("homepage content is rendered before JavaScript runs", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("หมุนดูก่อนซื้อ");
  await expect(page.locator("article").first()).toBeVisible();
  await context.close();
});
