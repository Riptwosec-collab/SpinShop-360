"use client";

import { useState } from "react";
import { z } from "zod";
import { useToastStore } from "@/lib/stores/toast-store";

const schema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  email: z.string().trim().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  message: z.string().trim().min(10, "กรุณากรอกข้อความอย่างน้อย 10 ตัวอักษร").max(5000, "ข้อความยาวเกินไป"),
});

export function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const pushToast = useToastStore((state) => state.push);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const payload = await response.json().catch(() => ({ ok: false, message: "ส่งข้อความไม่สำเร็จ" }));

      if (!response.ok || !payload.ok) {
        pushToast(payload.message ?? "ส่งข้อความไม่สำเร็จ กรุณาลองใหม่", "error");
        return;
      }

      setSent(true);
      setValues({ name: "", email: "", message: "" });
      pushToast(payload.message, "success");
    } catch {
      pushToast("ไม่สามารถเชื่อมต่อระบบส่งข้อความได้ กรุณาลองใหม่", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-success/40 bg-success/10 p-4" role="status">
        <p className="text-sm text-success">ขอบคุณสำหรับข้อความ ทีมงานได้รับข้อมูลแล้ว</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="focus-ring mt-3 rounded-lg border border-success/40 px-3 py-1.5 text-xs text-success hover:bg-success/10"
        >
          ส่งข้อความอีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">ชื่อ</span>
        <input
          autoComplete="name"
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          className="input"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
        />
        {errors.name && <span id="contact-name-error" className="text-xs text-danger">{errors.name}</span>}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">อีเมล</span>
        <input
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          className="input"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
        />
        {errors.email && <span id="contact-email-error" className="text-xs text-danger">{errors.email}</span>}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">ข้อความ</span>
        <textarea
          value={values.message}
          onChange={(event) => setValues((current) => ({ ...current, message: event.target.value }))}
          className="input min-h-28"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
        />
        {errors.message && <span id="contact-message-error" className="text-xs text-danger">{errors.message}</span>}
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="focus-ring self-start rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-wait disabled:opacity-50"
      >
        {submitting ? "กำลังส่ง..." : "ส่งข้อความ"}
      </button>
    </form>
  );
}
