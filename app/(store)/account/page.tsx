"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Package, Heart, LogOut, MapPin, Star, Ticket } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { getMockOrder } from "@/lib/services/orders";
import { ORDER_STATUS_LABEL, USE_MOCK_DATA } from "@/lib/constants";
import { formatCurrency, formatOrderDate } from "@/lib/utils";
import type { Order } from "@/types/order";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/locale-provider";

const NAV_ITEMS = [
  { key: "profile", icon: User },
  { key: "orders", icon: Package },
  { key: "wishlist", icon: Heart },
  { key: "addresses", icon: MapPin },
  { key: "reviews", icon: Star },
  { key: "coupons", icon: Ticket },
] as const;

export default function AccountPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const mockUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const wishlistCount = useWishlistStore((s) => s.count());
  const [tab, setTab] = useState<(typeof NAV_ITEMS)[number]["key"]>("profile");
  const [orders, setOrders] = useState<Order[]>([]);
  const [supabaseUser, setSupabaseUser] = useState<{ email: string; fullName: string; role: string } | null | undefined>(
    USE_MOCK_DATA ? null : undefined
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = JSON.parse(window.localStorage.getItem("spinshop360-orders") ?? "[]");
      setOrders(stored);
    }
  }, []);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setSupabaseUser(null);
      return;
    }
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setSupabaseUser(null);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", data.user.id)
        .maybeSingle();
      setSupabaseUser({
        email: data.user.email ?? "",
        fullName: profile?.full_name ?? data.user.email ?? "",
        role: profile?.role ?? "customer",
      });
    });
  }, []);

  const user = USE_MOCK_DATA ? mockUser : supabaseUser;

  function navLabel(key: (typeof NAV_ITEMS)[number]["key"]): string {
    const map: Record<(typeof NAV_ITEMS)[number]["key"], string> = {
      profile: t.account.profile,
      orders: t.account.orders,
      wishlist: t.common.wishlist,
      addresses: t.account.addresses,
      reviews: t.account.myReviews,
      coupons: t.account.myCoupons,
    };
    return map[key];
  }

  async function handleLogout() {
    if (USE_MOCK_DATA) {
      logout();
      router.push("/");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (user === undefined) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted">กำลังโหลด...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="mb-4 text-sm text-muted">กรุณาเข้าสู่ระบบเพื่อดูข้อมูลบัญชีของคุณ</p>
        <Link href="/login" className="focus-ring rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">{t.account.title}</h1>
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-56">
          <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`focus-ring flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  tab === item.key ? "bg-primary/15 text-primary" : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {navLabel(item.key)}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="focus-ring flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-danger hover:bg-danger/10"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </button>
          </nav>
        </aside>

        <div className="flex-1 rounded-2xl border border-border bg-surface p-6">
          {tab === "profile" && (
            <div>
              <h2 className="mb-4 text-base font-semibold text-foreground">ข้อมูลส่วนตัว</h2>
              <dl className="flex flex-col gap-3 text-sm">
                <Row label="ชื่อ" value={user.fullName} />
                <Row label="อีเมล" value={user.email} />
                <Row label="สิทธิ์การใช้งาน" value={user.role} />
              </dl>
            </div>
          )}

          {tab === "orders" && (
            <div>
              <h2 className="mb-4 text-base font-semibold text-foreground">ประวัติคำสั่งซื้อ</h2>
              {orders.length === 0 ? (
                <p className="text-sm text-muted">ยังไม่มีคำสั่งซื้อ (คำสั่งซื้อที่ทำในโหมดทดสอบจะแสดงที่นี่)</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {orders.map((o) => (
                    <li key={o.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{o.orderNumber}</span>
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                          {ORDER_STATUS_LABEL[o.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">{formatOrderDate(o.createdAt)}</p>
                      <p className="mt-1 text-sm font-medium">{formatCurrency(o.grandTotal)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "wishlist" && (
            <div>
              <h2 className="mb-4 text-base font-semibold text-foreground">รายการโปรด</h2>
              <p className="text-sm text-muted">
                คุณมีสินค้าในรายการโปรด {wishlistCount} รายการ —{" "}
                <Link href="/wishlist" className="text-primary hover:text-primary-hover">
                  ไปที่หน้ารายการโปรด
                </Link>
              </p>
            </div>
          )}

          {tab === "addresses" && (
            <div>
              <h2 className="mb-4 text-base font-semibold text-foreground">ที่อยู่จัดส่ง</h2>
              <p className="text-sm text-muted">ยังไม่มีที่อยู่ที่บันทึกไว้ ที่อยู่จากคำสั่งซื้อล่าสุดจะถูกใช้เป็นค่าเริ่มต้นในการชำระเงินครั้งถัดไป</p>
            </div>
          )}

          {tab === "reviews" && (
            <div>
              <h2 className="mb-4 text-base font-semibold text-foreground">รีวิวของฉัน</h2>
              <p className="text-sm text-muted">คุณสามารถรีวิวสินค้าได้หลังจากคำสั่งซื้อมีสถานะ &ldquo;จัดส่งสำเร็จ&rdquo; หรือ &ldquo;สำเร็จ&rdquo;</p>
            </div>
          )}

          {tab === "coupons" && (
            <div>
              <h2 className="mb-4 text-base font-semibold text-foreground">คูปองของฉัน</h2>
              <ul className="flex flex-col gap-2 text-sm">
                <li className="rounded-lg border border-border p-3">SPIN10 — ลด 10% (ยอดขั้นต่ำ 500 บาท)</li>
                <li className="rounded-lg border border-border p-3">SAVE100 — ลด 100 บาท (ยอดขั้นต่ำ 1,000 บาท)</li>
                <li className="rounded-lg border border-border p-3">FREESHIP — จัดส่งฟรี</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
