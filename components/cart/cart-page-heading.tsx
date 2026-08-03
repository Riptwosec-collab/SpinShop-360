"use client";

import { useTranslation } from "@/lib/i18n/locale-provider";

export function CartPageHeading() {
  const { t } = useTranslation();
  return <h1 className="mb-6 text-2xl font-semibold text-foreground">{t.cart.title}</h1>;
}
