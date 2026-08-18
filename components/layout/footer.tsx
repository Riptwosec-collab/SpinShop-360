"use client";

import Link from "next/link";
import { Facebook, Instagram, MessageCircle, Rotate3d } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { useTranslation } from "@/lib/i18n/locale-provider";

export function Footer() {
  const { t } = useTranslation();

  const FOOTER_LINKS = {
    Shop: [
      { label: "สินค้าทั้งหมด", href: "/products" },
      { label: "สินค้า 3D", href: "/products?supports3d=true" },
      { label: "โปรโมชัน", href: "/products?onSale=true" },
    ],
    [t.footer.customerService]: [
      { label: t.footer.paymentMethods, href: "/payment-methods" },
      { label: t.footer.shipping, href: "/shipping" },
      { label: t.footer.returns, href: "/returns" },
      { label: t.footer.contactUs, href: "/contact" },
    ],
    Company: [
      { label: t.footer.aboutUs, href: "/about" },
      { label: t.footer.howToOrder, href: "/how-to-order" },
    ],
    [t.footer.legal]: [
      { label: t.footer.privacy, href: "/privacy" },
      { label: t.footer.terms, href: "/terms" },
    ],
  };

  const brandBase = APP_NAME.replace(/\s*360$/i, "");

  return (
    <footer className="mt-8 border-t border-slate-800 bg-[#0a111c] text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                <Rotate3d className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-[-0.04em] text-white">
                {brandBase}<span className="ml-1 text-[#2e8cff]">360</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">
              Immersive shopping. หมุนดูสินค้าแบบ 360° และ 3D ก่อนตัดสินใจซื้อ เพื่อให้เห็นรายละเอียดได้ใกล้เคียงสินค้าจริง
            </p>
            <div className="mt-5 flex gap-2.5">
              {[Facebook, Instagram, MessageCircle].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition-colors hover:border-blue-400/50 hover:text-blue-300"
                  aria-label="ช่องทางโซเชียลมีเดีย"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-white">{title}</h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="focus-ring rounded text-xs text-slate-400 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-9 rounded-2xl border border-slate-800 bg-white/[0.03] p-4 sm:p-5">
          <NewsletterForm />
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-[11px] text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {APP_NAME}. {t.footer.rightsReserved}</p>
          <div className="flex items-center gap-2">
            {['VISA', 'Mastercard', 'PromptPay', 'Stripe'].map((method) => (
              <span key={method} className="rounded-md border border-slate-700 px-2 py-1 text-[9px] font-semibold text-slate-400">
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
