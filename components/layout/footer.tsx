"use client";

import Link from "next/link";
import { Facebook, Instagram, MessageCircle, Rotate3d } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { useTranslation } from "@/lib/i18n/locale-provider";

export function Footer() {
  const { t } = useTranslation();

  const FOOTER_LINKS = {
    [t.footer.aboutStore]: [
      { label: t.footer.aboutUs, href: "/about" },
      { label: t.footer.howToOrder, href: "/how-to-order" },
      { label: t.footer.contactUs, href: "/contact" },
    ],
    [t.footer.customerService]: [
      { label: t.footer.paymentMethods, href: "/payment-methods" },
      { label: t.footer.shipping, href: "/shipping" },
      { label: t.footer.returns, href: "/returns" },
    ],
    [t.footer.legal]: [
      { label: t.footer.privacy, href: "/privacy" },
      { label: t.footer.terms, href: "/terms" },
    ],
  };
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                <Rotate3d className="h-5 w-5 text-white" />
              </span>
              <span className="text-lg font-semibold">{APP_NAME}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted">
              หมุนดูก่อนซื้อ เห็นสินค้าครบทุกมุม เลือกซื้อสินค้าเทคโนโลยีและไลฟ์สไตล์พร้อมระบบดูสินค้า 3D และ 360 องศา
            </p>
            <div className="mt-4 flex gap-3">
              {[Facebook, Instagram, MessageCircle].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-primary/40 hover:text-primary"
                  aria-label="ช่องทางโซเชียลมีเดีย"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-3 text-sm font-medium text-foreground">{title}</h4>
              <ul className="flex flex-col gap-2">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="focus-ring rounded text-sm text-muted hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <NewsletterForm />
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} {APP_NAME}. {t.footer.rightsReserved}</p>
          <p>ออกแบบด้วยแนวคิด Dark Premium Technology</p>
        </div>
      </div>
    </footer>
  );
}
