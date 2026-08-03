"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/lib/stores/toast-store";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { USE_MOCK_DATA } from "@/lib/constants";

export default function ResetPasswordPage() {
  const router = useRouter();
  const pushToast = useToastStore((s) => s.push);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    setError(null);
    setSubmitting(true);

    if (USE_MOCK_DATA) {
      await new Promise((r) => setTimeout(r, 500));
      setSubmitting(false);
      pushToast("ตั้งรหัสผ่านใหม่สำเร็จ (จำลอง)", "success");
      router.push("/login");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setSubmitting(false);
      setError("ไม่สามารถเชื่อมต่อระบบยืนยันตัวตนได้");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    pushToast("ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง", "success");
    router.push("/login");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-1 text-2xl font-semibold text-foreground">ตั้งรหัสผ่านใหม่</h1>
      <p className="mb-6 text-sm text-muted">กรอกรหัสผ่านใหม่ของคุณ (ลิงก์นี้ใช้ได้ครั้งเดียว)</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">รหัสผ่านใหม่</span>
          <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">ยืนยันรหัสผ่านใหม่</span>
          <input type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" />
        </label>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="focus-ring rounded-lg bg-primary py-3 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {submitting ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
        </button>
      </form>
    </div>
  );
}
