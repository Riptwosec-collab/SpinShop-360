import { RatingStars } from "@/components/product/rating-stars";
import { MOCK_REVIEWS } from "@/lib/mock-data/reviews";
import { MOCK_PRODUCTS } from "@/lib/mock-data/products";

export function TestimonialsSection() {
  const featured = MOCK_REVIEWS.slice(0, 3);

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <h2 className="mb-6 text-xl font-semibold text-foreground sm:text-2xl">รีวิวจากลูกค้า</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {featured.map((review) => {
          const product = MOCK_PRODUCTS.find((p) => p.id === review.productId);
          return (
            <div key={review.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary text-sm font-medium">
                  {review.userName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{review.userName}</p>
                  <RatingStars rating={review.rating} />
                </div>
              </div>
              <p className="line-clamp-4 text-sm text-muted">{review.content}</p>
              {product && (
                <p className="mt-3 text-xs text-primary">ซื้อสินค้า: {product.name}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
