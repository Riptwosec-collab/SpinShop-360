"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import type { Review } from "@/types/review";
import { ReviewCard } from "./review-card";
import { RatingStars } from "./rating-stars";
import { cn } from "@/lib/utils";

const TABS = ["รายละเอียด", "คุณสมบัติ", "การจัดส่ง", "รีวิว", "คำถามที่พบบ่อย"] as const;

const FAQ = [
  { q: "สินค้ามีประกันกี่ปี", a: "สินค้าทุกชิ้นรับประกันความเสียหายจากการผลิต 1 ปี นับจากวันที่ได้รับสินค้า" },
  { q: "เปลี่ยนหรือคืนสินค้าได้ไหม", a: "คืนสินค้าได้ภายใน 7 วันหากสินค้ายังไม่ผ่านการใช้งานและบรรจุภัณฑ์ครบถ้วน" },
  { q: "จัดส่งใช้เวลากี่วัน", a: "โดยทั่วไปจัดส่งภายใน 1-4 วันทำการ ขึ้นอยู่กับพื้นที่ปลายทาง" },
];

export function ProductTabs({ product, reviews }: { product: Product; reviews: Review[] }) {
  const [active, setActive] = useState<(typeof TABS)[number]>("รายละเอียด");

  return (
    <div className="mt-12">
      <div className="scrollbar-none flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={active === tab}
            onClick={() => setActive(tab)}
            className={cn(
              "focus-ring shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              active === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {tab === "รีวิว" ? `รีวิว (${reviews.length})` : tab}
          </button>
        ))}
      </div>

      <div className="py-6">
        {active === "รายละเอียด" && (
          <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted">
            {product.description}
          </p>
        )}

        {active === "คุณสมบัติ" && (
          <div className="max-w-2xl overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <tbody>
                {product.specs.map((spec, i) => (
                  <tr key={spec.label} className={cn(i % 2 === 0 ? "bg-surface" : "bg-transparent")}>
                    <td className="w-1/3 px-4 py-3 text-muted">{spec.label}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{spec.value}</td>
                  </tr>
                ))}
                {product.dimensions && (
                  <tr className={cn(product.specs.length % 2 === 0 ? "bg-surface" : "bg-transparent")}>
                    <td className="px-4 py-3 text-muted">ขนาด (กว้าง x สูง x ลึก)</td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {product.dimensions.widthCm} x {product.dimensions.heightCm} x {product.dimensions.depthCm} ซม. / น้ำหนัก {product.dimensions.weightKg} กก.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {active === "การจัดส่ง" && (
          <div className="max-w-2xl space-y-3 text-sm text-muted">
            <p>จัดส่งโดยขนส่งชั้นนำทั่วประเทศ ใช้เวลา {product.shippingEtaDays[0]}-{product.shippingEtaDays[1]} วันทำการ</p>
            <p>ตรวจสอบสินค้าก่อนเซ็นรับ หากพบความเสียหายสามารถแจ้งเปลี่ยนได้ภายใน 24 ชั่วโมง</p>
            <p>รองรับการชำระเงินปลายทาง (COD) สำหรับคำสั่งซื้อไม่เกิน 5,000 บาท</p>
          </div>
        )}

        {active === "รีวิว" && (
          <div>
            <div className="mb-6 flex items-center gap-4 rounded-xl border border-border bg-surface p-5">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{product.reviewSummary.average.toFixed(1)}</p>
                <RatingStars rating={product.reviewSummary.average} />
              </div>
              <div className="text-sm text-muted">จากรีวิวทั้งหมด {product.reviewSummary.count} รายการ</div>
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted">ยังไม่มีรีวิวสำหรับสินค้านี้</p>
            ) : (
              <div className="flex flex-col gap-4">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            )}
          </div>
        )}

        {active === "คำถามที่พบบ่อย" && (
          <div className="max-w-2xl divide-y divide-border">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-3">
                <summary className="focus-ring cursor-pointer list-none text-sm font-medium text-foreground">
                  {item.q}
                </summary>
                <p className="mt-2 text-sm text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
