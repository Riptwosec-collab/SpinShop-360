const legacyDemoModels = new Set([
  'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
  'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb',
  'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
]);
const demoBySlug: Record<string, string> = {
  'aurora-mechanical-keyboard-75': 'keyboard',
  'halo-x13-smartphone': 'phone',
  'throne-elite-gaming-chair': 'chair',
  'guardian-mecha-collectible-figure': 'robot',
};
// Existing seeded databases can retain legacy demo URLs. Replace only those
// known demo assets, never a merchant's uploaded product model.
export function resolveProductModelUrl(url: string | null | undefined, slug: string) {
  return url && legacyDemoModels.has(url) && demoBySlug[slug]
    ? `/models/demo/${demoBySlug[slug]}.glb` : url;
}
