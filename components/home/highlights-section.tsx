import { RotateCcw, RotateCw, ShieldCheck, Truck } from "lucide-react";

const HIGHLIGHTS = [
  { icon: RotateCw, title: "360° Product Views", desc: "เห็นสินค้าครบทุกมุม" },
  { icon: Truck, title: "Free Shipping", desc: "ฟรีเมื่อครบยอดที่กำหนด" },
  { icon: RotateCcw, title: "Easy Returns", desc: "คืนสินค้าได้ตามเงื่อนไข" },
  { icon: ShieldCheck, title: "Secure Payments", desc: "ชำระเงินอย่างปลอดภัย" },
];

export function HighlightsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
        {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-3 bg-surface px-4 py-4 sm:px-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-secondary text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-xs font-semibold text-foreground">{title}</h3>
              <p className="mt-0.5 line-clamp-1 text-[10px] text-muted sm:text-[11px]">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
