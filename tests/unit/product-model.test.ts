import { expect, it } from 'vitest';
import { resolveProductModelUrl } from '@/lib/product-model';
it('replaces only known legacy demo models with the corresponding bundled product shape', () => {
  expect(resolveProductModelUrl('https://modelviewer.dev/shared-assets/models/RobotExpressive.glb', 'throne-elite-gaming-chair')).toBe('/models/demo/chair.glb');
  expect(resolveProductModelUrl('https://shop.example/product.glb', 'throne-elite-gaming-chair')).toBe('https://shop.example/product.glb');
  expect(resolveProductModelUrl(null, 'throne-elite-gaming-chair')).toBeNull();
});
