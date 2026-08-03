import { test, expect } from "@playwright/test";

test("ค้นหาสินค้าแล้วแสดงผลลัพธ์ที่เกี่ยวข้อง", async ({ page }) => {
  await page.goto("/products?search=Vertex");
  await expect(page.getByRole("heading", { name: /Vertex/ })).toBeVisible();
});

test("กรองสินค้าตามหมวดหมู่ผ่าน URL query แล้วอัปเดต URL ถูกต้อง", async ({ page }) => {
  await page.goto("/products");
  await page.getByRole("checkbox", { name: "อุปกรณ์เกมมิง" }).check();
  await expect(page).toHaveURL(/category=gaming/);
});

test("ปิดกั้นผู้ใช้ที่ยังไม่เข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลจากหน้า Admin", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByText("ต้องเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล")).toBeVisible();
});

test("หน้าไม่พบ (404) แสดง Empty State ที่เหมาะสม", async ({ page }) => {
  await page.goto("/products/this-product-does-not-exist");
  await expect(page.getByText("ไม่พบหน้าที่คุณต้องการ")).toBeVisible();
});

test("สลับธีมสว่าง/มืดได้และค่าที่เลือกยังคงอยู่หลังโหลดหน้าใหม่", async ({ page }) => {
  await page.goto("/");
  const themeToggle = page.getByRole("button", { name: "สลับธีมสว่าง/มืด" });
  await themeToggle.click();
  const isLight = await page.evaluate(() => document.documentElement.classList.contains("light"));
  await page.reload();
  const stillLight = await page.evaluate(() => document.documentElement.classList.contains("light"));
  expect(stillLight).toBe(isLight);
});
