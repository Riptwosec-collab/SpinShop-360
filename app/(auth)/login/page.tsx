"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MOCK_ADMIN_ACCOUNT, MOCK_CUSTOMER_ACCOUNT, USE_MOCK_DATA } from "@/lib/constants";

function safeNextPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const pushToast = useToastStore((state) => state.push);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nextPath = safeNextPath(searchParams.get("next"));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    if (USE_MOCK_DATA) {
      const result = login(email, password);
      setSubmitting(false);
      if (result.ok) {
        pushToast(result.message, "success");
        router.push(nextPath);
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
    router.replace(nextPath);
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
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">รหัสผ่าน</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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

      {USE_MOCK_DATA && process.env.NODE_ENV !== "production" && (
        <div className="mt-4 rounded-lg border border-border bg-surface p-3 text-xs text-muted">
          <p className="mb-1 font-medium text-foreground">บัญชีทดสอบ (Mock Mode)</p>
          <p>ผู้ดูแล: {MOCK_ADMIN_ACCOUNT.email} / {MOCK_ADMIN_ACCOUNT.password}</p>
          <p>ลูกค้า: {MOCK_CUSTOMER_ACCOUNT.email} / {MOCK_CUSTOMER_ACCOUNT.password}</p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 text-center text-sm text-muted">
        <Link href="/forgot-password" className="focus-ring text-primary hover:text-primary-hover">
          ลืมรหัสผ่าน?
        </Link>
        <p>
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="focus-ring text-primary hover:text-primary-hover">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md animate-pulse flex-col justify-center px-4 py-12" aria-label="กำลังโหลดแบบฟอร์มเข้าสู่ระบบ">
      <div className="h-8 w-36 rounded bg-surface-secondary" />
      <div className="mt-2 h-4 w-72 rounded bg-surface-secondary" />
      <div className="mt-8 h-11 rounded-lg bg-surface-secondary" />
      <div className="mt-4 h-11 rounded-lg bg-surface-secondary" />
      <div className="mt-4 h-12 rounded-lg bg-primary/20" />
    </div>
  );
}
