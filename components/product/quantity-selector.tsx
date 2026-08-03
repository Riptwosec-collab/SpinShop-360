"use client";

import { Minus, Plus } from "lucide-react";

export function QuantitySelector({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="ลดจำนวน"
        className="focus-ring flex h-10 w-10 items-center justify-center text-foreground transition-colors hover:bg-surface disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        value={value}
        min={1}
        max={max}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v)) onChange(Math.min(Math.max(1, v), max));
        }}
        aria-label="จำนวนสินค้า"
        className="h-10 w-12 border-x border-border bg-transparent text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="เพิ่มจำนวน"
        className="focus-ring flex h-10 w-10 items-center justify-center text-foreground transition-colors hover:bg-surface disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
