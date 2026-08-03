import Link from "next/link";
import * as Icons from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

export function CategorySection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">หมวดหมู่สินค้า</h2>
          <p className="mt-1 text-sm text-muted">เลือกดูสินค้าตามหมวดหมู่ที่คุณสนใจ</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-9">
        {CATEGORIES.map((cat) => {
          const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[cat.icon] ?? Icons.Package;
          return (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="focus-ring group flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs text-foreground">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
