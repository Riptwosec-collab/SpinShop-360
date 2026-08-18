"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Sun,
  Moon,
  Menu,
  X,
  Rotate3d,
  Languages,
  LayoutGrid,
  Tag,
} from "lucide-react";
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

  const brandBase = APP_NAME.replace(/\s*360$/i, "");

  return (
    <header className="sticky top-0 z-50 bg-surface/95 shadow-[0_1px_0_rgb(var(--border))] backdrop-blur-glass">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          ref={menuButtonRef}
          type="button"
          className="focus-ring rounded-xl p-2 text-foreground lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="เปิดเมนู"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="focus-ring flex shrink-0 items-center gap-2 rounded-xl" aria-label={APP_NAME}>
          <span className="hidden h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-[0_8px_20px_-10px_rgb(var(--primary))] sm:flex">
            <Rotate3d className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-[-0.04em] text-foreground sm:text-xl">
            {brandBase}<span className="ml-1 text-primary">360</span>
          </span>
        </Link>

        <div className="mx-auto hidden w-full max-w-xl md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            className="focus-ring rounded-xl p-2 text-foreground md:hidden"
            onClick={() => setSearchOpen((value) => !value)}
            aria-label={searchOpen ? "ปิดการค้นหา" : "ค้นหาสินค้า"}
            aria-expanded={searchOpen}
            aria-controls="mobile-search"
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          <Link
            href="/account"
            className="focus-ring hidden items-center gap-2 rounded-xl px-2.5 py-2 text-foreground transition-colors hover:bg-surface-secondary sm:flex"
            aria-label="บัญชีผู้ใช้"
          >
            <User className="h-5 w-5" />
            <span className="hidden text-left text-[11px] leading-tight xl:block">
              <span className="block text-muted">Account</span>
              <span className="font-semibold">Sign in</span>
            </span>
          </Link>

          <Link
            href="/wishlist"
            className="focus-ring relative flex items-center gap-2 rounded-xl px-2.5 py-2 text-foreground transition-colors hover:bg-surface-secondary"
            aria-label="รายการโปรด"
          >
            <Heart className="h-5 w-5" />
            <span className="hidden text-xs font-medium xl:inline">Wishlist</span>
            {wishlistCount > 0 && <CountBadge count={wishlistCount} />}
          </Link>

          <button
            type="button"
            onClick={openCart}
            className="focus-ring relative flex items-center gap-2 rounded-xl px-2.5 py-2 text-foreground transition-colors hover:bg-surface-secondary"
            aria-label="ตะกร้าสินค้า"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden text-xs font-medium xl:inline">Cart</span>
            {cartCount > 0 && <CountBadge count={cartCount} />}
          </button>

          <button
            type="button"
            onClick={() => setLocale(locale === "th" ? "en" : "th")}
            className="focus-ring hidden items-center gap-1 rounded-xl p-2 text-foreground transition-colors hover:bg-surface-secondary lg:flex"
            aria-label={locale === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
            title={locale === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
          >
            <Languages className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase">{locale}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="focus-ring hidden rounded-xl p-2 text-foreground transition-colors hover:bg-surface-secondary lg:block"
            aria-label="สลับธีมสว่าง/มืด"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="hidden border-t border-border/80 lg:block">
        <div className="mx-auto flex h-11 max-w-7xl items-center gap-1 px-8">
          <Link
            href="/products"
            className="focus-ring mr-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-secondary"
          >
            <LayoutGrid className="h-4 w-4" />
            Categories
          </Link>
          {MAIN_NAV.slice(1).map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring rounded-lg px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
            >
              {t.nav[NAV_KEYS[index + 1]] ?? item.label}
            </Link>
          ))}
          <Link
            href="/products?onSale=true"
            className="focus-ring ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/5"
          >
            <Tag className="h-3.5 w-3.5" />
            Deals
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div id="mobile-search" className="border-t border-border bg-surface p-3 md:hidden">
          <SearchBar autoFocus />
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-slate-950/55 backdrop-blur-sm"
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
            className="animate-fade-in absolute inset-y-0 left-0 w-[86vw] max-w-80 border-r border-border bg-surface p-5 shadow-2xl"
          >
            <div className="mb-7 flex items-center justify-between">
              <Link href="/" onClick={() => setMobileOpen(false)} className="text-xl font-bold tracking-[-0.04em]">
                {brandBase}<span className="ml-1 text-primary">360</span>
              </Link>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                className="focus-ring rounded-xl border border-border p-2 text-muted"
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
                  className="focus-ring rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-surface-secondary"
                >
                  {t.nav[NAV_KEYS[index]] ?? item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 grid grid-cols-2 gap-2 border-t border-border pt-5">
              <button
                type="button"
                onClick={() => setLocale(locale === "th" ? "en" : "th")}
                className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold"
              >
                <Languages className="h-4 w-4" /> {locale.toUpperCase()}
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white ring-2 ring-surface">
      {count > 99 ? "99+" : count}
    </span>
  );
}
