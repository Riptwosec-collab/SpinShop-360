import Link from "next/link";
import { ArrowRight } from "lucide-react";
import * as Icons from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

export function CategorySection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-[-0.025em] text-foreground sm:text-xl">เลือกซื้อตามหมวดหมู่</h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">ค้นหาสินค้าที่สนใจได้เร็วขึ้น</p>
        </div>
        <Link href="/products" className="focus-ring flex shrink-0 items-center gap-1 rounded-lg text-xs font-semibold text-primary hover:text-primary-hover">
          ดูทั้งหมด <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-9 lg:overflow-visible lg:pb-0">
        {CATEGORIES.map((cat) => {
          const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[cat.icon] ?? Icons.Package;
          return (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="focus-ring group flex min-w-[108px] snap-start flex-col items-center gap-2.5 rounded-2xl border border-border bg-surface px-3 py-4 text-center shadow-[0_8px_28px_-22px_rgba(15,23,42,0.35)] transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_14px_30px_-20px_rgba(17,108,255,0.32)] lg:min-w-0"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary text-foreground transition-all group-hover:bg-primary/8 group-hover:text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="line-clamp-2 text-[11px] font-medium leading-4 text-foreground">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
