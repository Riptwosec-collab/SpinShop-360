"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Star,
  Ticket,
  Image as ImageIcon,
  BarChart3,
  Settings,
  Rotate3d,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/admin/products", label: "สินค้า", icon: Package },
  { href: "/admin/orders", label: "คำสั่งซื้อ", icon: ShoppingCart },
  { href: "/admin/categories", label: "หมวดหมู่", icon: Tag },
  { href: "/admin/reviews", label: "รีวิว", icon: Star },
  { href: "/admin/coupons", label: "คูปอง", icon: Ticket },
  { href: "/admin/media", label: "สื่อและโมเดล 3D", icon: ImageIcon },
  { href: "/admin/analytics", label: "วิเคราะห์ข้อมูล", icon: BarChart3 },
  { href: "/admin/settings", label: "ตั้งค่า", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      <div className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center gap-2 px-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Rotate3d className="h-4 w-4 text-white" />
          </span>
          <span className="text-sm font-semibold">SpinShop Admin</span>
        </div>
        <nav aria-label="เมนูผู้ดูแลบนมือถือ" className="flex gap-1 overflow-x-auto px-3 pb-3">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-ring flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors",
                  active
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border bg-surface text-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface/50 lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Rotate3d className="h-4 w-4 text-white" />
          </span>
          <span className="text-sm font-semibold">SpinShop Admin</span>
        </div>
        <nav aria-label="เมนูผู้ดูแล" className="flex flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-ring flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active ? "bg-primary/15 text-primary" : "text-muted hover:bg-surface hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
