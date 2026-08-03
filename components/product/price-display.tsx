import { formatCurrency, calcDiscountPercent } from "@/lib/utils";

export function PriceDisplay({
  price,
  compareAtPrice,
  size = "md",
}: {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const discount = calcDiscountPercent(price, compareAtPrice);
  const priceSize = { sm: "text-base", md: "text-xl", lg: "text-3xl" }[size];

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-semibold text-foreground ${priceSize}`}>
        {formatCurrency(price)}
      </span>
      {discount > 0 && compareAtPrice && (
        <>
          <span className="text-sm text-muted line-through">
            {formatCurrency(compareAtPrice)}
          </span>
          <span className="rounded-md bg-danger/15 px-1.5 py-0.5 text-xs font-medium text-danger">
            -{discount}%
          </span>
        </>
      )}
    </div>
  );
}
