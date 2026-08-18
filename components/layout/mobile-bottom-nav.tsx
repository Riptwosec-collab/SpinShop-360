"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Categories", href: "/products", icon: LayoutGrid },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
  { label: "Account", href: "/account", icon: User },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((state) => state.itemCount());
  const openCart = useCartStore((state) => state.openDrawer);

  if (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/order-confirmation")
  ) {
    return null;
  }

  return (
    <nav
      aria-label="เมนูมือถือ"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),0.4rem)] pt-1.5 shadow-[0_-12px_32px_-24px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map(({ label, href, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-ring flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[9px] font-medium transition-colors",
                active ? "text-primary" : "text-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", active && "stroke-[2.4]")} />
              {label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={openCart}
          className="focus-ring relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[9px] font-medium text-muted transition-colors hover:text-foreground"
          aria-label="เปิดตะกร้าสินค้า"
        >
          <span className="relative">
            <ShoppingCart className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[8px] font-bold text-white ring-2 ring-surface">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </span>
          Cart
        </button>
      </div>
    </nav>
  );
}
