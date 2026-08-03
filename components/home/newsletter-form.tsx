"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { z } from "zod";
import { useToastStore } from "@/lib/stores/toast-store";
import { useTranslation } from "@/lib/i18n/locale-provider";

const emailSchema = z.string().email("กรุณากรอกอีเมลให้ถูกต้อง");

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pushToast = useToastStore((s) => s.push);
  const { t } = useTranslation();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setError(null);
    pushToast("สมัครรับข่าวสารสำเร็จ ขอบคุณค่ะ", "success");
    setEmail("");
  }

  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h4 className="text-sm font-medium text-foreground">{t.footer.newsletterTitle}</h4>
        <p className="text-xs text-muted">{t.footer.newsletterDesc}</p>
      </div>
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2 sm:w-auto" noValidate>
        <div className="flex-1">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
            <Mail className="h-4 w-4 text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="อีเมลของคุณ"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              aria-invalid={!!error}
              aria-describedby={error ? "newsletter-error" : undefined}
            />
          </div>
          {error && (
            <p id="newsletter-error" className="mt-1 text-xs text-danger" role="alert">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="focus-ring shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          {t.footer.subscribe}
        </button>
      </form>
    </div>
  );
}
