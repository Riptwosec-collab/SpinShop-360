"use client";
import { useEffect, useState } from "react";
import { getProductsByIds } from "@/lib/services/products";
import type { Product } from "@/types/product";

/** Reload current stock and prices when the saved product selection changes. */
export function useCatalogProducts(ids: string[]) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    getProductsByIds(ids)
      .then((items) => {
        if (alive) setProducts(items);
      })
      .catch(() => {
        if (alive) {
          setError(true);
          setProducts([]);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [ids]);
  return { products, loading, error };
}
