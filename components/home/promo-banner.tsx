import Link from "next/link";
import { ArrowRight, Headphones, Sparkles } from "lucide-react";

export function PromoBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#08182b] px-6 py-6 text-white shadow-[0_20px_60px_-40px_rgba(37,99,235,0.7)] sm:px-8">
        <div className="pointer-events-none absolute -right-12 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-20 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border border-cyan-300/20" />
        <div className="relative flex items-center justify-between gap-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              Featured Deal
            </div>
            <h2 className="text-xl font-bold tracking-[-0.03em] sm:text-2xl">โปรพิเศษ ลดสูงสุด 30%</h2>
            <p className="mt-1 text-sm text-slate-300">สินค้าที่รองรับ 3D และ 360° ที่ร่วมรายการ</p>
            <Link
              href="/products?onSale=true"
              className="focus-ring mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
            >
              ดูโปรโมชัน <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="hidden h-28 w-40 items-center justify-center sm:flex">
            <span className="flex h-24 w-24 rotate-[-10deg] items-center justify-center rounded-[28px] border border-white/10 bg-white/5 shadow-[0_0_50px_rgba(0,153,255,0.25)]">
              <Headphones className="h-12 w-12 text-cyan-200" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
