import { describe, it, expect } from "vitest";
import { getProducts, searchProducts } from "@/lib/services/products";

describe("catalog search", () => {
  it("ignores surrounding whitespace in suggestions and the full results page", async () => {
    const suggestions = await searchProducts("  Vertex  ");
    expect(suggestions.length).toBeGreaterThan(0);
    const results = await getProducts({ search: "  Vertex  " });
    expect(results.total).toBeGreaterThan(0);
    expect(results.items.every((p) => p.name.includes("Vertex") || p.brand.includes("Vertex"))).toBe(true);
  });

  it("does not return a negative slice for invalid page numbers", async () => {
    const results = await getProducts({ page: -2 });
    expect(results.page).toBe(1);
    expect(results.items.length).toBeGreaterThan(0);
  });
});
