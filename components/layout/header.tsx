"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Heart, ShoppingCart, User, Sun, Moon, Menu, X, Rotate3d, Languages } from "lucide-react";
import { MAIN_NAV, APP_NAME } from "@/lib/constants";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { useCartStore } from "@/lib/stores/cart-store";
import { useTheme } from "@/components/shared/theme-provider";
import { useTranslation } from "@/lib/i18n/locale-provider";
import { SearchBar } from "@/components/layout/search-bar";
import { cn } from "@/lib/utils";

const NAV_KEYS = ["home", "products", "products3d", "promotions", "compare"] as const;

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const wishlistCount = useWishlistStore((s) => s.count());
  const cartCount = useCartStore((s) => s.itemCount());
  const openCart = useCartStore((s) => s.openDrawer);
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          className="focus-ring rounded-lg p-2 text-foreground lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="เปิดเมนู"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="focus-ring flex shrink-0 items-center gap-2 rounded-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <Rotate3d className="h-5 w-5 text-white" />
          </span>
          <span className="hidden text-lg font-semibold tracking-tight sm:inline">
            {APP_NAME}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {MAIN_NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              {t.nav[NAV_KEYS[i]] ?? item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:block">
            <SearchBar />
          </div>
          <button
            className="focus-ring rounded-lg p-2 text-foreground sm:hidden"
            onClick={() => setSearchOpen(true)}
            aria-label="ค้นหาสินค้า"
          >
            <Search className="h-5 w-5" />
          </button>

          <Link
            href="/wishlist"
            className="focus-ring relative rounded-lg p-2 text-foreground hover:bg-surface"
            aria-label="รายการโปรด"
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && <CountBadge count={wishlistCount} />}
          </Link>

          <button
            onClick={openCart}
            className="focus-ring relative rounded-lg p-2 text-foreground hover:bg-surface"
            aria-label="ตะกร้าสินค้า"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && <CountBadge count={cartCount} />}
          </button>

          <Link
            href="/account"
            className="focus-ring rounded-lg p-2 text-foreground hover:bg-surface"
            aria-label="บัญชีผู้ใช้"
          >
            <User className="h-5 w-5" />
          </Link>

          <button
            onClick={() => setLocale(locale === "th" ? "en" : "th")}
            className="focus-ring flex items-center gap-1 rounded-lg p-2 text-foreground hover:bg-surface"
            aria-label="สลับภาษา / Switch language"
            title={locale === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
          >
            <Languages className="h-5 w-5" />
            <span className="text-xs font-medium uppercase">{locale}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="focus-ring rounded-lg p-2 text-foreground hover:bg-surface"
            aria-label="สลับธีมสว่าง/มืด"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border p-3 sm:hidden">
          <div className="flex items-center gap-2">
            <SearchBar autoFocus />
            <button
              onClick={() => setSearchOpen(false)}
              className="focus-ring rounded-lg p-2 text-muted"
              aria-label="ปิดการค้นหา"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-72 border-r border-border bg-background p-4 transition-transform",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <span className="text-lg font-semibold">{APP_NAME}</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="focus-ring rounded-lg p-2 text-muted"
              aria-label="ปิดเมนู"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {MAIN_NAV.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="focus-ring rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-surface"
              >
                {t.nav[NAV_KEYS[i]] ?? item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
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
