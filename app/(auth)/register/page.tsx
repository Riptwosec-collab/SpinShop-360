"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { USE_MOCK_DATA } from "@/lib/constants";

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
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    setSubmitting(true);

    if (USE_MOCK_DATA) {
      const result = register(email, password, fullName);
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

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.session) {
      pushToast("สมัครสมาชิกสำเร็จ", "success");
      router.push("/account");
      router.refresh();
    } else {
      pushToast("สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ", "success");
      router.push("/login");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
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
    </div>
  );
}
