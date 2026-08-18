"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/product";

export function ImageGallery({ images, alt }: { images: ProductImage[]; alt: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-[70px_minmax(0,1fr)]">
      {images.length > 1 && (
        <div className="order-2 flex gap-2 overflow-x-auto pb-1 sm:order-1 sm:max-h-[560px] sm:flex-col sm:overflow-y-auto sm:overflow-x-visible sm:pr-1">
          {images.slice(0, 7).map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActive(index)}
              className={cn(
                "focus-ring relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-surface transition-all",
                index === active
                  ? "border-primary ring-2 ring-primary/10"
                  : "border-border hover:border-primary/35"
              )}
              aria-label={`ดูรูปที่ ${index + 1}`}
              aria-current={index === active}
            >
              <Image src={image.url} alt="" fill sizes="64px" className="object-contain p-1.5" />
            </button>
          ))}
          {images.length > 7 && (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-xs font-semibold text-muted">
              +{images.length - 7}
            </span>
          )}
        </div>
      )}

      <div className={cn("order-1 sm:order-2", images.length <= 1 && "sm:col-span-2")}>
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border bg-surface-secondary/70 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)]">
          <Image
            src={images[active].url}
            alt={images[active].altText || alt}
            fill
            sizes="(max-width: 1024px) 100vw, 52vw"
            className="object-contain p-[7%]"
            priority
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <span className="rounded-full border border-border bg-surface/85 px-3 py-1.5 text-[10px] font-medium text-muted shadow-sm backdrop-blur-xl">
              เลือกรูปด้านข้างเพื่อดูรายละเอียด
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
