import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { useProductSelection } from "@/components/product-viewer/product-selection";
import { MOCK_PRODUCTS } from "@/lib/mock-data/products";

afterEach(cleanup);

it("selects an available optionless variant instead of an earlier sold-out variant", () => {
  const base = MOCK_PRODUCTS[0];
  const product = { ...base, options: [], variants: [
    { ...base.variants[0], id: "sold", optionValueIds: [], stockQuantity: 0 },
    { ...base.variants[1], id: "available", optionValueIds: [], stockQuantity: 2 },
  ] };
  const { result } = renderHook(() => useProductSelection(product));
  expect(result.current.activeVariant?.id).toBe("available");
});
