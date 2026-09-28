"use client";

import { Localized } from "@/lib/i18n/localized";


import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Heart, ShoppingCart, User, Sun, Moon, Menu, X, Rotate3d, Languages, ArrowUpRight } from "lucide-react";
import { MAIN_NAV, APP_NAME } from "@/lib/constants";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { useCartStore } from "@/lib/stores/cart-store";
import { useTheme } from "@/components/shared/theme-provider";
import { useTranslation } from "@/lib/i18n/locale-provider";
import { SearchBar } from "./search-bar";
import { Modal } from "@/components/shared/modal";
import { cn } from "@/lib/utils";

const NAV_KEYS = ["home", "products", "products3d", "promotions", "compare"] as const;

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const params = useSearchParams();
  const wishlistCount = useWishlistStore((s) => s.count());
  const cartCount = useCartStore((s) => s.itemCount());
  const openCart = useCartStore((s) => s.openDrawer);
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useTranslation();
  const en = locale === "en";
  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [pathname, params]);
  function active(href: string) {
    const [path, query] = href.split("?");
    if (path !== pathname) return false;
    if (query) return Array.from(new URLSearchParams(query)).every(([key, value]) => params.get(key) === value);
    return path !== "/products" || !(params.get("supports3d") === "true" || params.get("onSale") === "true");
  }
  const nav = MAIN_NAV.map((item, i) => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
    aria-current={active(item.href) ? "page" : undefined}
    className={cn("focus-ring rounded-xl px-4 py-3 text-sm transition-colors", active(item.href) ? "bg-primary/15 font-semibold text-foreground" : "text-muted hover:bg-surface-secondary hover:text-foreground")}>
    {t.nav[NAV_KEYS[i]]}
  </Link>);

  return <Localized><>
    <a href="#main-content" className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xl bg-primary p-3 text-white focus:translate-y-0">{en ? "Skip to content" : "ข้ามไปเนื้อหา"}</a>
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-glass">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <button className="icon-action lg:hidden" onClick={() => setMobileOpen(true)} aria-label={en ? "Open menu" : "เปิดเมนู"} aria-expanded={mobileOpen}><Menu className="h-5 w-5" /></button>
        <Link href="/" className="focus-ring flex shrink-0 items-center gap-2.5 rounded-xl" aria-label={APP_NAME}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-primary/15 text-accent"><Rotate3d className="h-6 w-6" /></span>
          <span className="text-base font-semibold tracking-tight max-[359px]:hidden sm:text-lg">SpinShop <span className="text-accent">360</span><span className="hidden text-[9px] font-normal tracking-[.25em] text-muted sm:block">SEE EVERY ANGLE</span></span>
        </Link>
        <div className="mx-auto hidden w-full max-w-md min-w-0 md:block"><SearchBar /></div>
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <button className="icon-action md:hidden" onClick={() => setSearchOpen(!searchOpen)} aria-expanded={searchOpen} aria-label={t.common.search}>{searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}</button>
          <Link href="/wishlist" className="icon-action relative hidden sm:flex" aria-label={t.common.wishlist}><Heart className="h-5 w-5" />{wishlistCount > 0 && <CountBadge count={wishlistCount} />}</Link>
          <Link href="/account" className="icon-action hidden lg:flex" aria-label={t.account.title}><User className="h-5 w-5" /></Link>
          <button onClick={() => setLocale(en ? "th" : "en")} className="icon-action hidden gap-1 sm:flex" aria-label="สลับภาษา / Switch language"><Languages className="h-4 w-4" /><span className="text-xs uppercase">{locale}</span></button>
          <button onClick={toggleTheme} className="icon-action hidden sm:flex" aria-label="สลับธีมสว่าง/มืด">{theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
          <button onClick={openCart} className="icon-action relative bg-primary/10 text-foreground" aria-label={t.common.cart}><ShoppingCart className="h-5 w-5" />{cartCount > 0 && <CountBadge count={cartCount} />}</button>
        </div>
      </div>
      {searchOpen && <div className="border-t border-border px-4 py-3 md:hidden"><SearchBar autoFocus /></div>}
      <div className="hidden border-t border-border/60 lg:block"><div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-1.5">
        <nav aria-label={en ? "Main navigation" : "เมนูหลัก"} className="flex gap-1">{nav}</nav>
        <Link href="/how-to-order" className="flex items-center gap-1 text-xs text-muted hover:text-accent">{en ? "Your first 360° experience" : "เริ่มช้อปแบบ 360°"}<ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div></div>
    </header>
    <Modal open={mobileOpen} onClose={() => setMobileOpen(false)} label={en ? "Main menu" : "เมนูหลัก"} className="h-full w-[min(85vw,360px)] border-r p-5">
      <div className="mb-6 flex items-center justify-between"><span className="font-semibold">{APP_NAME}</span><button className="icon-action" onClick={() => setMobileOpen(false)} aria-label={en ? "Close menu" : "ปิดเมนู"}><X className="h-5 w-5" /></button></div>
      <nav className="flex flex-col gap-2">{nav}<Link className="rounded-xl px-4 py-3 text-sm text-muted" href="/account">{t.account.title}</Link></nav>
      <div className="mt-auto space-y-3 border-t border-border pt-5">
        <button onClick={() => setLocale(en ? "th" : "en")} className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-surface p-3 text-sm"><Languages className="h-5 w-5" />{en ? "เปลี่ยนเป็นภาษาไทย" : "Switch to English"}</button>
        <button onClick={toggleTheme} className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-surface p-3 text-sm" aria-label="สลับธีมสว่าง/มืด"><Sun className="h-5 w-5" />{en ? "Switch light / dark theme" : "สลับธีมสว่าง / มืด"}</button>
      </div>
    </Modal>
  </></Localized>;
}

function CountBadge({ count }: { count: number }) {
  return <Localized><span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">{count > 99 ? "99+" : count}</span></Localized>;
}
