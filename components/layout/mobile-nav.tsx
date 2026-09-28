"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Heart, User } from "lucide-react";
import { useTranslation } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const path = usePathname();
  const { t } = useTranslation();
  // Product details own the purchase bar; checkout keeps attention on the current step.
  if (path.startsWith("/products/") || path === "/checkout") return null;
  const links = [{ href: "/", icon: Home, label: t.nav.home }, { href: "/products", icon: LayoutGrid, label: t.nav.products }, { href: "/wishlist", icon: Heart, label: t.common.wishlist }, { href: "/account", icon: User, label: t.account.title }];
  return <nav aria-label="Mobile navigation" className="mobile-safe fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-background/95 px-2 pt-2 backdrop-blur-glass sm:hidden">
    {links.map(({ href, icon: Icon, label }) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={cn("focus-ring flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px]", path === href ? "bg-primary/15 text-accent" : "text-muted")}><Icon className="h-5 w-5" /><span>{label}</span></Link>)}
  </nav>;
}
