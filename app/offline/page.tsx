"use client";

import Link from "next/link";
import { WifiOff } from "lucide-react";
import { useTranslation } from "@/lib/i18n/locale-provider";

export default function OfflinePage() {
  const { locale } = useTranslation();
  const en = locale === "en";
  return <main className="flex min-h-[70vh] items-center justify-center px-4 py-16"><div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-8"><WifiOff className="h-10 w-10 text-primary" /><p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary">SpinShop 360</p><h1 className="mt-3 text-3xl font-semibold text-foreground">{en ? "You are offline" : "ขณะนี้คุณออฟไลน์"}</h1><p className="mt-4 text-sm leading-relaxed text-muted">{en ? "Reconnect to browse products and continue shopping. Your account, orders and checkout require an internet connection." : "เชื่อมต่ออินเทอร์เน็ตอีกครั้งเพื่อดูสินค้าและดำเนินการต่อ บัญชี คำสั่งซื้อ และการชำระเงินต้องเชื่อมต่ออินเทอร์เน็ต"}</p><Link href="/" className="focus-ring mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-white">{en ? "Try again" : "ลองอีกครั้ง"}</Link></div></main>;
}
