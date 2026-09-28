import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { fireEvent, render, screen } from "@testing-library/react";
import { vi, expect, it } from "vitest";
import { ProductFilters } from "@/components/product/product-filters";
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams("minPrice=1000&maxPrice=5000&brand=Vertex"),
}));
it("clears both price bounds in one navigation while preserving the brand", () => {
  render(<LocaleProvider><ProductFilters brands={["Vertex"]} /></LocaleProvider>);
  fireEvent.click(screen.getAllByRole("checkbox", { name: "1,000 - 5,000 บาท" })[0]);
  expect(push).toHaveBeenCalledTimes(1);
  expect(push).toHaveBeenCalledWith("/products?brand=Vertex");
});
