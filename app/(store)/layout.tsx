import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="store-shell flex min-h-screen flex-col">
      <Suspense fallback={<div aria-hidden className="h-[73px] border-b border-border bg-background lg:h-[135px]" />}><Header /></Suspense>
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">{children}</main>
      <Footer />
      <MobileNav />
    </div>
  );
}
