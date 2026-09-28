"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/locale-provider";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaRegister() {
  const { locale } = useTranslation();
  const en = locale === "en";
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        // Browsers may disable workers; normal online shopping remains available.
      });
    }
    const offerInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    const installed = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", offerInstall);
    window.addEventListener("appinstalled", installed);
    return () => { window.removeEventListener("beforeinstallprompt", offerInstall); window.removeEventListener("appinstalled", installed); };
  }, []);

  if (!installPrompt || dismissed) return null;
  return <aside aria-label={en ? "Install app" : "ติดตั้งแอป"} className="fixed bottom-24 left-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-2xl border border-primary/30 bg-surface p-2 shadow-soft sm:bottom-6">
    <button type="button" disabled={installing} onClick={async () => {
      setInstalling(true);
      try { await installPrompt.prompt(); await installPrompt.userChoice; }
      catch { /* A browser may withdraw install eligibility. */ }
      finally { setInstalling(false); setInstallPrompt(null); }
    }} className="focus-ring flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-primary disabled:opacity-50"><Download className="h-4 w-4" />{en ? "Install SpinShop" : "ติดตั้ง SpinShop"}</button>
    <button type="button" onClick={() => setDismissed(true)} aria-label={en ? "Dismiss install suggestion" : "ปิดคำแนะนำการติดตั้ง"} className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
  </aside>;
}
