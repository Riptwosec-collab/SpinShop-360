"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "./locale-provider";

export function LocaleSwitcher() {
  const { locale, setLocale } = useTranslation();
  return <button type="button" onClick={() => setLocale(locale === "th" ? "en" : "th")}
    className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm"
    aria-label={locale === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}>
    <Languages className="h-4 w-4" />{locale === "th" ? "English" : "ไทย"}
  </button>;
}
