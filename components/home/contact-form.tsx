"use client";

import { useState } from "react";
import { z } from "zod";
import { useToastStore } from "@/lib/stores/toast-store";

const schema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  message: z.string().min(10, "กรุณากรอกข้อความอย่างน้อย 10 ตัวอักษร"),
});

export function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const pushToast = useToastStore((s) => s.push);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setSent(true);
    pushToast("ส่งข้อความสำเร็จ ทีมงานจะติดต่อกลับโดยเร็วที่สุด", "success");
  }

  if (sent) {
    return (
      <p className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm text-success">
        ขอบคุณสำหรับข้อความ ทีมงานจะติดต่อกลับภายใน 1-2 วันทำการ
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">ชื่อ</span>
        <input
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          className="input"
        />
        {errors.name && <span className="text-xs text-danger">{errors.name}</span>}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">อีเมล</span>
        <input
          type="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          className="input"
        />
        {errors.email && <span className="text-xs text-danger">{errors.email}</span>}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">ข้อความ</span>
        <textarea
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          className="input min-h-28"
        />
        {errors.message && <span className="text-xs text-danger">{errors.message}</span>}
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="focus-ring self-start rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {submitting ? "กำลังส่ง..." : "ส่งข้อความ"}
      </button>
    </form>
  );
}
