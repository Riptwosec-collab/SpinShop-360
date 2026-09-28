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

/** Shared locale for all client and server-rendered display boundaries.
 * Preferences persist between visits; initial rendering remains hydration-safe.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "th" || stored === "en") { setLocaleState(stored); document.documentElement.lang = stored; }
    } catch { /* Storage is optional. */ }
    setMounted(true);
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* Storage is optional. */ }
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
