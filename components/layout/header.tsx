"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search, Heart, ShoppingCart, User, Sun, Moon, Menu, X, Rotate3d, Languages } from "lucide-react";
import { MAIN_NAV, APP_NAME } from "@/lib/constants";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { useCartStore } from "@/lib/stores/cart-store";
import { useTheme } from "@/components/shared/theme-provider";
import { useTranslation } from "@/lib/i18n/locale-provider";
import { SearchBar } from "@/components/layout/search-bar";

const NAV_KEYS = ["home", "products", "products3d", "promotions", "compare"] as const;

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const wishlistCount = useWishlistStore((state) => state.count());
  const cartCount = useCartStore((state) => state.itemCount());
  const openCart = useCartStore((state) => state.openDrawer);
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useTranslation();

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          ref={menuButtonRef}
          type="button"
          className="focus-ring rounded-lg p-2 text-foreground lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="เปิดเมนู"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="focus-ring flex shrink-0 items-center gap-2 rounded-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <Rotate3d className="h-5 w-5 text-white" />
          </span>
          <span className="hidden text-lg font-semibold tracking-tight sm:inline">{APP_NAME}</span>
        </Link>

        <nav aria-label="เมนูหลัก" className="hidden items-center gap-1 lg:flex">
          {MAIN_NAV.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              {t.nav[NAV_KEYS[index]] ?? item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:block"><SearchBar /></div>
          <button
            type="button"
            className="focus-ring rounded-lg p-2 text-foreground sm:hidden"
            onClick={() => setSearchOpen((value) => !value)}
            aria-label={searchOpen ? "ปิดการค้นหา" : "ค้นหาสินค้า"}
            aria-expanded={searchOpen}
            aria-controls="mobile-search"
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          <Link href="/wishlist" className="focus-ring relative rounded-lg p-2 text-foreground hover:bg-surface" aria-label="รายการโปรด">
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && <CountBadge count={wishlistCount} />}
          </Link>

          <button type="button" onClick={openCart} className="focus-ring relative rounded-lg p-2 text-foreground hover:bg-surface" aria-label="ตะกร้าสินค้า">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && <CountBadge count={cartCount} />}
          </button>

          <Link href="/account" className="focus-ring rounded-lg p-2 text-foreground hover:bg-surface" aria-label="บัญชีผู้ใช้">
            <User className="h-5 w-5" />
          </Link>

          <button
            type="button"
            onClick={() => setLocale(locale === "th" ? "en" : "th")}
            className="focus-ring flex items-center gap-1 rounded-lg p-2 text-foreground hover:bg-surface"
            aria-label={locale === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
            title={locale === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
          >
            <Languages className="h-5 w-5" />
            <span className="text-xs font-medium uppercase">{locale}</span>
          </button>

          <button type="button" onClick={toggleTheme} className="focus-ring rounded-lg p-2 text-foreground hover:bg-surface" aria-label="สลับธีมสว่าง/มืด">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div id="mobile-search" className="border-t border-border p-3 sm:hidden">
          <SearchBar autoFocus />
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-label="ปิดเมนู"
            tabIndex={-1}
          />
          <div
            id="mobile-navigation"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="เมนูหลัก"
            className="animate-fade-in absolute inset-y-0 left-0 w-72 border-r border-border bg-background p-4 shadow-soft"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-semibold">{APP_NAME}</span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                className="focus-ring rounded-lg p-2 text-muted"
                aria-label="ปิดเมนู"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {MAIN_NAV.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="focus-ring rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-surface"
                >
                  {t.nav[NAV_KEYS[index]] ?? item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
