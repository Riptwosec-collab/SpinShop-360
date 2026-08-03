"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/constants";

export interface OptionRow {
  id: string;
  name: string;
}

/**
 * Loads real {id, name} rows from Supabase for admin `<select>` dropdowns
 * so the form can submit a genuine foreign key (`category_id`/`brand_id`)
 * instead of a display-only slug. Falls back to the static category list
 * (with slugs standing in for ids) in Mock Mode, where the value never
 * actually reaches a database anyway.
 */
export function useAdminCategoriesAndBrands() {
  const [categories, setCategories] = useState<OptionRow[]>(
    CATEGORIES.map((c) => ({ id: c.slug, name: c.name }))
  );
  const [brands, setBrands] = useState<OptionRow[]>([]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) setCategories(data);
      });

    supabase
      .from("brands")
      .select("id, name")
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) setBrands(data);
      });
  }, []);

  return { categories, brands };
}
