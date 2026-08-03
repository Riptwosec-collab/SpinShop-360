"use client";

import { cn } from "@/lib/utils";
import type { ProductOption } from "@/types/product";

interface VariantSelectorProps {
  options: ProductOption[];
  selected: Record<string, string>;
  onSelect: (optionId: string, valueId: string) => void;
  isValueAvailable: (optionId: string, valueId: string) => boolean;
}

export function VariantSelector({
  options,
  selected,
  onSelect,
  isValueAvailable,
}: VariantSelectorProps) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {options.map((option) => (
        <div key={option.id}>
          <p className="mb-2 text-sm font-medium text-foreground">
            {option.name}
            {selected[option.id] && (
              <span className="ml-1.5 font-normal text-muted">
                : {option.values.find((v) => v.id === selected[option.id])?.value}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const available = isValueAvailable(option.id, value.id);
              const isSelected = selected[option.id] === value.id;

              if (option.displayType === "color") {
                return (
                  <button
                    key={value.id}
                    onClick={() => available && onSelect(option.id, value.id)}
                    disabled={!available}
                    aria-label={`สี ${value.value}${!available ? " (สินค้าหมด)" : ""}`}
                    aria-pressed={isSelected}
                    title={value.value}
                    className={cn(
                      "focus-ring relative h-9 w-9 rounded-full border-2 transition-transform",
                      isSelected ? "scale-110 border-primary" : "border-border hover:border-primary/50",
                      !available && "cursor-not-allowed opacity-40"
                    )}
                    style={{ backgroundColor: value.colorHex ?? "#888" }}
                  >
                    {!available && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="h-full w-0.5 rotate-45 bg-danger" />
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={value.id}
                  onClick={() => available && onSelect(option.id, value.id)}
                  disabled={!available}
                  aria-pressed={isSelected}
                  className={cn(
                    "focus-ring rounded-lg border px-3.5 py-2 text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-surface text-foreground hover:border-primary/40",
                    !available && "cursor-not-allowed border-border/50 text-muted line-through opacity-50"
                  )}
                >
                  {value.value}
                  {!available && <span className="ml-1 text-[10px]">(หมด)</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
