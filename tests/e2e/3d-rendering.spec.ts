import { test, expect } from '@playwright/test';
for (const slug of ['aurora-mechanical-keyboard-75', 'halo-x13-smartphone', 'throne-elite-gaming-chair', 'guardian-mecha-collectible-figure']) {
  test(`renders and rotates ${slug} without external model services or AR`, async ({ page }) => {
    await page.route('https://modelviewer.dev/**', route => route.abort());
    await page.goto(`/products/${slug}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('tab', { name: /AR/ })).toHaveCount(0);
    await page.getByRole('tab', { name: 'สตูดิโอ 3D', exact: true }).click();
    const viewer = page.locator('model-viewer');
    await expect(page.getByRole('button', { name: 'หมุนอัตโนมัติ', exact: true })).toBeEnabled({ timeout: 20000 });
    await expect(viewer).not.toHaveAttribute('ar');
    const before = await viewer.evaluate((element: any) => ({ loaded: element.loaded, theta: element.getCameraOrbit().theta, materials: element.model.materials.length, image: element.toDataURL().length, height: element.getBoundingClientRect().height }));
    expect(before.loaded).toBe(true);
    expect(before.materials).toBeGreaterThan(0);
    expect(before.image).toBeGreaterThan(5000);
    expect(before.height).toBeGreaterThan(200);
    const box = (await viewer.boundingBox())!;
    await page.mouse.move(box.x + box.width * .7, box.y + box.height * .5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .3, box.y + box.height * .5, { steps: 10 });
    await page.mouse.up();
    await expect.poll(() => viewer.evaluate((element: any) => element.getCameraOrbit().theta)).not.toBe(before.theta);
    if (slug === 'aurora-mechanical-keyboard-75') await page.screenshot({ path: '.work/3d-fix/keyboard-rendered.png' });
  });
}

test('home preview renders its bundled model without the external sample host', async ({ page }) => {
  await page.route('https://modelviewer.dev/**', route => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'เปิดประสบการณ์ 3D' }).click();
  const viewer = page.locator('model-viewer');
  await expect.poll(() => viewer.evaluate((element: any) => element.loaded), { timeout: 20000 }).toBe(true);
  await expect(page.getByText('กำลังโหลดโมเดล 3D…', { exact: true })).toHaveCount(0);
  expect(await viewer.evaluate((element: any) => element.toDataURL().length)).toBeGreaterThan(5000);
});
