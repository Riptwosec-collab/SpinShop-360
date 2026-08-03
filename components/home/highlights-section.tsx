import { RotateCw, ShieldCheck, Truck, RotateCcw } from "lucide-react";

const HIGHLIGHTS = [
  { icon: RotateCw, title: "ดูสินค้าได้ทุกมุม", desc: "ระบบ 3D และ 360° ให้เห็นสินค้าจริงก่อนตัดสินใจซื้อ" },
  { icon: ShieldCheck, title: "รับประกันสินค้า", desc: "สินค้าทุกชิ้นรับประกันความเสียหายจากการผลิต 1 ปี" },
  { icon: Truck, title: "จัดส่งรวดเร็ว", desc: "จัดส่งทั่วประเทศ ภายใน 1-4 วันทำการ" },
  { icon: RotateCcw, title: "คืนสินค้าได้ตามเงื่อนไข", desc: "เปลี่ยนหรือคืนสินค้าได้ภายใน 7 วัน" },
];

export function HighlightsSection() {
  return (
    <section className="border-y border-border bg-surface/40">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex flex-col items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs leading-relaxed text-muted">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
