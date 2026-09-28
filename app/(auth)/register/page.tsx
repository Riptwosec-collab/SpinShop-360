"use client";

import { Localized } from "@/lib/i18n/localized";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useToastStore } from "@/lib/stores/toast-store";

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const pushToast = useToastStore((s) => s.push);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setError("กรุณากรอกชื่อ"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("กรุณากรอกอีเมลให้ถูกต้อง"); return; }
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    setSubmitting(true);

    setError(null);
    const result = await register(email, password, fullName);
    setSubmitting(false);
    if (!result.ok) { setError(result.message); return; }
    pushToast(result.message, "success");
    router.push(result.needsConfirmation ? "/login" : "/account");
    router.refresh();
  }

  return (
    <Localized><div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-1 text-2xl font-semibold text-foreground">สมัครสมาชิก</h1>
      <p className="mb-6 text-sm text-muted">สร้างบัญชีเพื่อรับสิทธิพิเศษและติดตามคำสั่งซื้อ</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">ชื่อ-นามสกุล</span>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">อีเมล</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">รหัสผ่าน</span>
          <input
            type="password"
            required
            minLength={8}
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
          {submitting ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="focus-ring text-primary hover:text-primary-hover">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div></Localized>
  );
}
