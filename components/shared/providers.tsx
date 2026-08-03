"use client";

import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/shared/toaster";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { AnalyticsInit } from "@/components/shared/analytics-init";
import { LocaleProvider } from "@/lib/i18n/locale-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AnalyticsInit />
        {children}
        <CartDrawer />
        <Toaster />
      </LocaleProvider>
    </ThemeProvider>
  );
}
