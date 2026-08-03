"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { dictionaries, DEFAULT_LOCALE, type Locale } from "./dictionaries";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (typeof dictionaries)["th"];
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "spinshop360-locale";

/**
 * Lightweight client-side i18n: swaps a dictionary object rather than
 * routing through `/[locale]/...` segments. This keeps every existing route
 * working unchanged while still proving out real language switching for the
 * (currently Thai-only) UI strings that have been wired up so far.
 *
 * For a production rollout covering the entire UI, migrate to next-intl
 * with locale-prefixed routing — this provider's `Locale`/`dictionaries`
 * shape is intentionally compatible with that migration path.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && stored in dictionaries) setLocaleState(stored);
    setMounted(true);
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: dictionaries[mounted ? locale : DEFAULT_LOCALE] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useTranslation must be used within LocaleProvider");
  return ctx;
}
