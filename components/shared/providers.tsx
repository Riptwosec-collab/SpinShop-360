"use client";

import { PwaRegister } from "@/components/shared/pwa-register";
import { AuthInit } from "@/components/shared/auth-init";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/shared/toaster";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { AnalyticsInit } from "@/components/shared/analytics-init";
import { LocaleProvider } from "@/lib/i18n/locale-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthInit />
        <PwaRegister />
        <AnalyticsInit />
        {children}
        <CartDrawer />
        <Toaster />
      </LocaleProvider>
    </ThemeProvider>
  );
}
