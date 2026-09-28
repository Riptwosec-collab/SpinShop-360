"use client";

import { createContext, useContext, useState, type Dispatch, type SetStateAction } from "react";
import type { Product, ProductVariant } from "@/types/product";

interface Selection {
  productId: string;
  selected: Record<string, string>;
  setSelected: Dispatch<SetStateAction<Record<string, string>>>;
  activeVariant: ProductVariant | undefined;
}
const SelectionContext = createContext<Selection | null>(null);

function useSelectionState(product: Product): Selection {
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const first = product.variants.find((variant) => variant.isActive && variant.stockQuantity > 0)
      ?? product.variants.find((variant) => variant.isActive);
    return Object.fromEntries(product.options.flatMap((option) => {
      const value = option.values.find((entry) => first?.optionValueIds.includes(entry.id));
      return value ? [[option.id, value.id]] : [];
    }));
  });
  const ids = Object.values(selected);
  const matches = product.variants.filter((variant) => variant.isActive &&
    variant.optionValueIds.length === ids.length && ids.every((id) => variant.optionValueIds.includes(id)));
  const activeVariant = matches.find((variant) => variant.stockQuantity > 0) ?? matches[0];
  return { productId: product.id, selected, setSelected, activeVariant };
}

export function ProductSelectionProvider({ product, children }: { product: Product; children: React.ReactNode }) {
  const selection = useSelectionState(product);
  return <SelectionContext.Provider value={selection}>{children}</SelectionContext.Provider>;
}

export function useProductSelection(product: Product) {
  const shared = useContext(SelectionContext);
  const local = useSelectionState(product);
  return shared?.productId === product.id ? shared : local;
}
