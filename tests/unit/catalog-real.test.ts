import { beforeEach, describe, expect, it, vi } from "vitest";
const { from, query } = vi.hoisted(() => {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const name of ["select", "eq", "is", "in", "order", "range", "limit"])
    query[name] = vi.fn(() => query);
  query.then = vi.fn();
  return { from: vi.fn(() => query), query };
});
vi.mock("@/lib/constants", () => ({
  USE_MOCK_DATA: false,
  PRODUCTS_PER_PAGE: 12,
}));
vi.mock("@/lib/supabase/catalog", () => ({
  createCatalogClient: () => ({ from }),
}));
import {
  getProducts,
  getProductBySlug,
  getFeaturedProducts,
  searchProducts,
  getProductReviews,
  getAllBrands,
  getProductsByIds,
  getCategories,
  getFeaturedReviews,
} from "@/lib/services/products";
const row = {
  id: "real-1",
  name: "Real chair",
  slug: "real-chair",
  sku: "REAL",
  status: "active",
  base_price: 190,
  stock_quantity: 5,
  is_featured: true,
  created_at: "2026-01-01",
  brands: { name: "RealBrand" },
  categories: { name: "Furniture", slug: "furniture" },
  product_images: [],
  product_options: [
    {
      id: "option",
      product_id: "real-1",
      name: "Color",
      display_type: "color",
      sort_order: 0,
      product_option_values: [
        { id: "red", option_id: "option", value: "Red", sort_order: 0 },
      ],
    },
  ],
  product_variants: [
    {
      id: "variant",
      product_id: "real-1",
      sku: "REAL-RED",
      price: 200,
      stock_quantity: 2,
      is_active: true,
      variant_option_values: [{ option_value_id: "red" }],
    },
  ],
  product_hotspots: [],
  product_360_frames: [],
  reviews: [
    { rating: 4, status: "approved" },
    { rating: 1, status: "pending" },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
  query.then.mockImplementation((resolve: (r: unknown) => unknown) =>
    Promise.resolve(resolve({ data: [row], error: null })),
  );
});
describe("real catalog", () => {
  it("maps database inventory, options, relationships and approved review summaries", async () => {
    const result = await getProducts();
    expect(result.items[0]).toMatchObject({
      id: "real-1",
      brand: "RealBrand",
      categorySlug: "furniture",
      stockQuantity: 5,
      reviewSummary: { average: 4, count: 1 },
      variants: [{ stockQuantity: 2, optionValueIds: ["red"] }],
      options: [{ values: [{ id: "red" }] }],
    });
  });
  it("uses the real source for details, home rails, brands and search", async () => {
    expect((await getProductBySlug("real-chair"))?.id).toBe("real-1");
    expect((await getFeaturedProducts())[0].id).toBe("real-1");
    expect(await getAllBrands()).toEqual(["RealBrand"]);
    expect((await searchProducts(" RealBrand "))[0].id).toBe("real-1");
    expect(await searchProducts("Vertex")).toEqual([]);
  });
  it("propagates backend errors instead of quietly showing mock products", async () => {
    query.then.mockImplementation((resolve: (r: unknown) => unknown) =>
      Promise.resolve(resolve({ data: null, error: { message: "offline" } })),
    );
    await expect(getProducts()).rejects.toThrow();
  });
  it("returns approved reviews without reading private profile data", async () => {
    query.then.mockImplementation((resolve: (r: unknown) => unknown) =>
      Promise.resolve(
        resolve({
          data: [
            {
              id: "review",
              product_id: "real-1",
              rating: 5,
              status: "approved",
              content: "Great",
              review_images: [{ image_url: "/review.png" }],
            },
          ],
          error: null,
        }),
      ),
    );
    const reviews = await getProductReviews("real-1");
    expect(reviews[0]).toMatchObject({
      id: "review",
      images: ["/review.png"],
      rating: 5,
    });
    expect(from).toHaveBeenCalledWith("reviews");
    expect(query.eq).toHaveBeenCalledWith("status", "approved");
  });
  it("loads real saved selections and real category choices",async()=>{
    expect((await getProductsByIds(["real-1"]))[0].id).toBe("real-1");
    expect(query.in).toHaveBeenCalledWith("id",["real-1"]);
    query.then.mockImplementation((resolve:(r:unknown)=>unknown)=>Promise.resolve(resolve({data:[{name:"Furniture",slug:"furniture",sort_order:0}],error:null})));
    expect(await getCategories()).toEqual([{name:"Furniture",slug:"furniture",icon:"Package"}]);
    expect(from).toHaveBeenCalledWith("categories");
  });
  it("loads featured reviews from reviews then matches real products",async()=>{
    query.then.mockImplementationOnce((resolve:(r:unknown)=>unknown)=>Promise.resolve(resolve({data:[{id:"review",product_id:"real-1",rating:5,status:"approved",created_at:"2026-01-01",content:"Great",review_images:[]}],error:null})));
    const items=await getFeaturedReviews();
    expect(items[0].product.id).toBe("real-1");expect(items[0].review.id).toBe("review");
    expect(query.limit).toHaveBeenCalledWith(3);
  });
  it("continues catalog pagination past the API batch boundary",async()=>{
    query.then.mockImplementationOnce((resolve:(r:unknown)=>unknown)=>Promise.resolve(resolve({data:Array.from({length:200},(_,i)=>({...row,id:`real-${i}`})),error:null})));
    const result=await getProducts();
    expect(result.total).toBe(201);expect(query.range).toHaveBeenNthCalledWith(2,200,399);
  });

});
