import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ProductViewer } from "@/components/product-viewer/product-viewer";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { MOCK_PRODUCTS } from "@/lib/mock-data/products";
import type { Product } from "@/types/product";

// The browser's GPU renderer is external; keep our controls, DOM and event wiring real.
vi.mock("@google/model-viewer", () => ({}));
class TestModelViewer extends HTMLElement {
  canActivateAR = false;
  activateAR = vi.fn().mockResolvedValue(undefined);
  cameraOrbit = "";
  jumpCameraToGoal = vi.fn();
}
if (!customElements.get("model-viewer")) customElements.define("model-viewer", TestModelViewer);

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem("spinshop360-locale", "en"); });
afterEach(cleanup);
const base = MOCK_PRODUCTS[0];
function show(product: Product) { return render(<LocaleProvider><ProductViewer product={product} /></LocaleProvider>); }

it("shows supplied dimensions with unit conversion and never fabricates missing dimensions", () => {
  const { unmount } = show({ ...base, dimensions: { widthCm: 2.54, heightCm: 5.08, depthCm: 7.62, weightKg: 1 } });
  fireEvent.click(screen.getByRole("button", { name: "Dimensions" }));
  expect(screen.getByText("2.54 × 5.08 × 7.62 cm")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "in" }));
  expect(screen.getByText("1 × 2 × 3 in")).toBeInTheDocument();
  unmount();
  show({ ...base, dimensions: null });
  fireEvent.click(screen.getByRole("button", { name: "Dimensions" }));
  expect(screen.getByText("Dimensions are not available for this product.")).toBeInTheDocument();
});

it("keeps selected variant image and model synchronized from Studio color controls", async () => {
  show({ ...base, supports3d: true, modelGlbUrl: "/default.glb", variants: [
    { ...base.variants[0], modelUrl: "/black.glb", imageUrl: "/black.jpg" },
    { ...base.variants[1], modelUrl: "/white.glb", imageUrl: "/white.jpg" },
  ] });
  fireEvent.click(screen.getByRole("button", { name: "Studio color: ขาว" }));
  expect(screen.getByRole("img", { name: base.name })).toHaveAttribute("src", expect.stringContaining("white.jpg"));
  fireEvent.click(screen.getByRole("tab", { name: "3D Studio" }));
  await waitFor(() => expect(document.querySelector("model-viewer")).toHaveAttribute("src", "/white.glb"));
});

it("renders the product photograph when a 3D load fails", async () => {
  show({ ...base, supports3d: true, modelGlbUrl: "/missing.glb" });
  fireEvent.click(screen.getByRole("tab", { name: "3D Studio" }));
  const viewer = await waitFor(() => { const node = document.querySelector("model-viewer"); expect(node).not.toBeNull(); return node!; });
  act(() => viewer.dispatchEvent(new Event("error")));
  expect(screen.getByRole("img", { name: base.name })).toHaveAttribute("src", base.fallbackImageUrl);
  expect(screen.getByText("3D could not load. Showing the product image.")).toBeInTheDocument();
});

it("only enables AR when the loaded viewer confirms device support and preserves the iOS asset", async () => {
  show({ ...base, supports3d: true, supportsAr: true, modelGlbUrl: "/real.glb", modelUsdzUrl: "/real.usdz" });
  fireEvent.click(screen.getByRole("tab", { name: "AR preview" }));
  const viewer = await waitFor(() => { const node = document.querySelector("model-viewer") as unknown as TestModelViewer; expect(node).not.toBeNull(); return node; });
  expect(viewer).toHaveAttribute("ios-src", "/real.usdz");
  act(() => viewer.dispatchEvent(new Event("load")));
  expect(screen.getByRole("button", { name: "View in your space" })).toBeDisabled();
  viewer.canActivateAR = true;
  act(() => viewer.dispatchEvent(new Event("ar-status")));
  expect(screen.getByRole("button", { name: "View in your space" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "View in your space" }));
  expect(viewer.activateAR).toHaveBeenCalledOnce();
});

it("retains a loaded model past the loading deadline and falls back on a later rendering error", async () => {
  show({ ...base, supports3d: true, modelGlbUrl: "/real.glb" });
  fireEvent.click(screen.getByRole("tab", { name: "3D Studio" }));
  const viewer = await waitFor(() => { const node = document.querySelector("model-viewer"); expect(node).not.toBeNull(); return node!; });
  act(() => viewer.dispatchEvent(new Event("load")));
  fireEvent.click(screen.getByRole("button", { name: "Auto rotate" }));
  expect(viewer).toHaveAttribute("auto-rotate");
  fireEvent.change(screen.getByRole("slider", { name: "Lighting" }), { target: { value: "1.4" } });
  expect(viewer).toHaveAttribute("exposure", "1.4");
  vi.useFakeTimers();
  act(() => vi.advanceTimersByTime(30000));
  vi.useRealTimers();
  expect(screen.getByRole("button", { name: "Pause rotation" })).toBeEnabled();
  act(() => viewer.dispatchEvent(new Event("error")));
  expect(screen.getByText("3D could not load. Showing the product image.")).toBeInTheDocument();
});
