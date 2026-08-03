import { MOCK_REVIEWS } from "@/lib/mock-data/reviews";
import { MOCK_PRODUCTS } from "@/lib/mock-data/products";
import { RatingStars } from "@/components/product/rating-stars";

export default function AdminReviewsPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-foreground">จัดการรีวิว</h1>
      <p className="mb-6 text-sm text-muted">รีวิวทั้งหมด {MOCK_REVIEWS.length} รายการ</p>
      <ul className="flex flex-col gap-3">
        {MOCK_REVIEWS.map((r) => {
          const product = MOCK_PRODUCTS.find((p) => p.id === r.productId);
          return (
            <li key={r.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.userName}</p>
                  <p className="text-xs text-muted">สินค้า: {product?.name}</p>
                </div>
                <RatingStars rating={r.rating} />
              </div>
              <p className="mt-2 text-sm text-muted">{r.content}</p>
              <div className="mt-3 flex gap-2">
                <button className="focus-ring rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40">
                  ตอบกลับ
                </button>
                <button className="focus-ring rounded-lg border border-danger/40 px-3 py-1.5 text-xs text-danger hover:bg-danger/10">
                  ซ่อนรีวิว
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
