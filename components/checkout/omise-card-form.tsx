"use client";

import { useEffect, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

declare global {
  interface Window {
    Omise?: {
      setPublicKey: (key: string) => void;
      createToken: (
        type: "card",
        card: { name: string; number: string; expiration_month: number; expiration_year: number; security_code: string },
        callback: (statusCode: number, response: { id: string; message?: string }) => void
      ) => void;
    };
  }
}

interface OmiseCardFormProps {
  /** Called with the Omise card token (`tokn_...`) once tokenization succeeds. */
  onToken: (token: string) => void;
  disabled?: boolean;
}

/**
 * Loads Omise.js client-side and tokenizes the card in the browser —
 * raw card numbers are sent directly from the browser to Omise's servers
 * and never touch our backend, satisfying PCI-DSS SAQ-A-EP. Our server
 * only ever sees the resulting single-use token (`tokn_...`), which it
 * exchanges for a charge via `/api/payments/omise/charge-card`.
 */
export function OmiseCardForm({ onToken, disabled }: OmiseCardFormProps) {
  const [scriptReady, setScriptReady] = useState(false);
  const [tokenizing, setTokenizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", number: "", exp: "", cvc: "" });

  const publicKey = process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY;

  useEffect(() => {
    if (!publicKey) return;
    const script = document.createElement("script");
    script.src = "https://cdn.omise.co/omise.js";
    script.async = true;
    script.onload = () => {
      window.Omise?.setPublicKey(publicKey);
      setScriptReady(true);
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [publicKey]);

  if (!publicKey) {
    return (
      <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
        ยังไม่ได้ตั้งค่า NEXT_PUBLIC_OMISE_PUBLIC_KEY — ไม่สามารถใช้บัตรเครดิตผ่าน Omise ได้ในขณะนี้
      </p>
    );
  }

  function handleTokenize(e: React.FormEvent) {
    e.preventDefault();
    if (!window.Omise) return;

    const [expMonth, expYear] = form.exp.split("/").map((s) => s.trim());
    if (!expMonth || !expYear || !form.number || !form.name || !form.cvc) {
      setError("กรุณากรอกข้อมูลบัตรให้ครบถ้วน");
      return;
    }

    setError(null);
    setTokenizing(true);

    window.Omise.createToken(
      "card",
      {
        name: form.name,
        number: form.number.replace(/\s/g, ""),
        expiration_month: Number(expMonth),
        expiration_year: 2000 + Number(expYear.length === 2 ? expYear : expYear.slice(-2)),
        security_code: form.cvc,
      },
      (statusCode, response) => {
        setTokenizing(false);
        if (statusCode !== 200) {
          setError(response.message ?? "ไม่สามารถตรวจสอบบัตรได้ กรุณาตรวจสอบข้อมูลอีกครั้ง");
          return;
        }
        onToken(response.id);
      }
    );
  }

  return (
    <form onSubmit={handleTokenize} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <CreditCard className="h-3.5 w-3.5" />
        ข้อมูลบัตรถูกส่งตรงไปยัง Omise อย่างปลอดภัย ไม่ผ่านเซิร์ฟเวอร์ของเรา
      </p>
      <input
        placeholder="ชื่อบนบัตร"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        className="input"
        autoComplete="cc-name"
      />
      <input
        placeholder="หมายเลขบัตร"
        value={form.number}
        onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
        className="input"
        inputMode="numeric"
        autoComplete="cc-number"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="MM/YY"
          value={form.exp}
          onChange={(e) => setForm((f) => ({ ...f, exp: e.target.value }))}
          className="input"
          autoComplete="cc-exp"
        />
        <input
          placeholder="CVC"
          value={form.cvc}
          onChange={(e) => setForm((f) => ({ ...f, cvc: e.target.value }))}
          className="input"
          inputMode="numeric"
          autoComplete="cc-csc"
        />
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!scriptReady || tokenizing || disabled}
        className="focus-ring flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {tokenizing && <Loader2 className="h-4 w-4 animate-spin" />}
        {!scriptReady ? "กำลังโหลด..." : tokenizing ? "กำลังตรวจสอบบัตร..." : "ยืนยันบัตร"}
      </button>
    </form>
  );
}
