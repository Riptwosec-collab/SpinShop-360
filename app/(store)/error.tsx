"use client";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function StoreError({ reset }: { reset: () => void }) {
  return <div role="alert" className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-5 px-6 text-center">
    <RefreshCw className="h-12 w-12 text-accent" />
    <h1 className="text-2xl font-semibold">โหลดข้อมูลไม่สำเร็จ</h1>
    <p className="text-muted">กรุณาลองอีกครั้ง / Unable to load this page. Please try again.</p>
    <button onClick={reset} className="primary-action">ลองอีกครั้ง / Retry</button>
    <Link href="/" className="text-sm text-muted">กลับหน้าแรก / Home</Link>
  </div>;
}
