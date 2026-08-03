import { BadgeCheck, ThumbsUp } from "lucide-react";
import type { Review } from "@/types/review";
import { RatingStars } from "./rating-stars";
import { formatOrderDate } from "@/lib/utils";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-secondary text-sm font-medium text-foreground">
            {review.userName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">{review.userName}</p>
              {review.isVerifiedPurchase && (
                <span className="flex items-center gap-0.5 text-[10px] text-success">
                  <BadgeCheck className="h-3 w-3" /> ซื้อสินค้าแล้ว
                </span>
              )}
            </div>
            <p className="text-xs text-muted">{formatOrderDate(review.createdAt)}</p>
          </div>
        </div>
        <RatingStars rating={review.rating} />
      </div>
      <h4 className="mt-3 text-sm font-medium text-foreground">{review.title}</h4>
      <p className="mt-1 text-sm leading-relaxed text-muted">{review.content}</p>
      {review.variantLabel && (
        <p className="mt-2 text-xs text-muted">ตัวเลือกที่ซื้อ: {review.variantLabel}</p>
      )}
      <button className="focus-ring mt-3 flex items-center gap-1.5 text-xs text-muted hover:text-foreground">
        <ThumbsUp className="h-3.5 w-3.5" />
        มีประโยชน์ ({review.helpfulCount})
      </button>
    </div>
  );
}
