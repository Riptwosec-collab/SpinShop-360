import { test, expect } from "@playwright/test";

/**
 * End-to-end happy path, matching spec Section 53:
 * homepage -> product listing -> product detail -> select variant ->
 * add to cart -> checkout -> mock payment -> order success
 */
test("ผู้ใช้สามารถเลือกซื้อสินค้าจนถึงหน้ายืนยันคำสั่งซื้อได้สำเร็จ", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("หมุนดูก่อนซื้อ");

  await page.getByRole("link", { name: "เลือกซื้อสินค้า" }).first().click();
  await expect(page).toHaveURL(/\/products/);

  // Open the first product's detail page from the grid.
  await page.locator('a[href^="/products/"]').first().click();
  await expect(page).toHaveURL(/\/products\/.+/);

  // If the product has variants, select the first available option so
  // "Add to Cart" is enabled.
  const colorSwatch = page.locator("button[aria-label^='สี']").first();
  if (await colorSwatch.count()) {
    await colorSwatch.click();
  }

  // Add to cart from the product detail page (desktop button).
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();

  // Cart drawer should open with at least one item.
  await expect(page.getByRole("dialog", { name: "ตะกร้าสินค้า" })).toBeVisible();

  await page.getByRole("link", { name: "ไปที่ตะกร้าสินค้า" }).click();
  await expect(page).toHaveURL(/\/cart/);

  await page.getByRole("button", { name: "ดำเนินการชำระเงิน" }).click();
  await expect(page).toHaveURL(/\/checkout/);

  // Step 1: buyer info
  await page.getByLabel("อีเมล").fill("e2e-test@example.com");
  await page.getByLabel("เบอร์โทรศัพท์").fill("0812345678");
  await page.getByRole("button", { name: "ถัดไป" }).click();

  // Step 2: shipping address
  await page.getByLabel("ชื่อผู้รับ").fill("ทดสอบ ระบบ");
  await page.getByLabel("เบอร์โทรศัพท์ผู้รับ").fill("0812345678");
  await page.getByLabel("ที่อยู่").fill("123 ถนนทดสอบ");
  await page.getByLabel("แขวง/ตำบล").fill("แขวงทดสอบ");
  await page.getByLabel("เขต/อำเภอ").fill("เขตทดสอบ");
  await page.getByLabel("จังหวัด").fill("กรุงเทพมหานคร");
  await page.getByLabel("รหัสไปรษณีย์").fill("10110");
  await page.getByRole("button", { name: "ถัดไป" }).click();

  // Step 3: shipping + payment method (defaults are fine — PromptPay/standard)
  await page.getByRole("button", { name: "ถัดไป" }).click();

  // Step 4: review + confirm
  await page.getByRole("button", { name: "ยืนยันการสั่งซื้อ" }).click();

  await expect(page).toHaveURL(/\/order-success\/.+/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "สั่งซื้อสำเร็จ!" })).toBeVisible();
});
