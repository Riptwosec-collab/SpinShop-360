"use client";

import { Localized } from "@/lib/i18n/localized";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useToastStore } from "@/lib/stores/toast-store";

const schema = z.string().email("กรุณากรอกอีเมลให้ถูกต้อง");

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const pushToast = useToastStore((s) => s.push);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse(email);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const response=await fetch("/api/auth/forgot-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
      const data=await response.json();
      if(!response.ok || !data.ok){setError(data.message || "ส่งคำขอไม่สำเร็จ / Request failed");return;}
      setMessage(data.message);setSent(true);pushToast(data.message,"success");
    }catch{setError("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่ / Connection failed; try again");}
    finally{setSubmitting(false);}
  }

  return (
    <Localized><div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-1 text-2xl font-semibold text-foreground">ลืมรหัสผ่าน</h1>
      <p className="mb-6 text-sm text-muted">กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ</p>

      {sent ? (
        <p className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm text-success">
          {message}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">อีเมล</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </label>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={submitting} className="focus-ring rounded-lg bg-primary py-3 text-sm font-medium text-white hover:bg-primary-hover">
            ส่งลิงก์รีเซ็ตรหัสผ่าน
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="focus-ring text-primary hover:text-primary-hover">
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </p>
    </div></Localized>
  );
}
