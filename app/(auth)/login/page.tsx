"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MOCK_ADMIN_ACCOUNT, MOCK_CUSTOMER_ACCOUNT, USE_MOCK_DATA } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const pushToast = useToastStore((s) => s.push);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    if (USE_MOCK_DATA) {
      const result = login(email, password);
      setSubmitting(false);
      if (result.ok) {
        pushToast(result.message, "success");
        router.push("/account");
      } else {
        setError(result.message);
      }
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setSubmitting(false);
      setError("ไม่สามารถเชื่อมต่อระบบยืนยันตัวตนได้ กรุณาตรวจสอบการตั้งค่า Supabase");
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (authError) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }

    pushToast("เข้าสู่ระบบสำเร็จ", "success");
    router.push("/account");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-1 text-2xl font-semibold text-foreground">เข้าสู่ระบบ</h1>
      <p className="mb-6 text-sm text-muted">เข้าสู่ระบบเพื่อดูประวัติคำสั่งซื้อและรายการโปรด</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">อีเมล</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">รหัสผ่าน</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </label>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="focus-ring rounded-lg bg-primary py-3 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>

      {USE_MOCK_DATA && (
        <div className="mt-4 rounded-lg border border-border bg-surface p-3 text-xs text-muted">
          <p className="mb-1 font-medium text-foreground">บัญชีทดสอบ (Mock Mode)</p>
          <p>ผู้ดูแล: {MOCK_ADMIN_ACCOUNT.email} / {MOCK_ADMIN_ACCOUNT.password}</p>
          <p>ลูกค้า: {MOCK_CUSTOMER_ACCOUNT.email} / {MOCK_CUSTOMER_ACCOUNT.password}</p>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        ยังไม่มีบัญชี?{" "}
        <Link href="/register" className="focus-ring text-primary hover:text-primary-hover">
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  );
}
