"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";

export function AdminGuard({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const user = useAuthStore((state) => state.user);

  // In Supabase mode authorization is enforced by the server layout before
  // any admin UI renders. This client guard is only for local Mock Mode.
  if (!enabled) return <>{children}</>;

  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <ShieldAlert className="h-10 w-10 text-warning" />
        <h1 className="text-lg font-semibold text-foreground">ต้องเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล</h1>
        <p className="max-w-sm text-sm text-muted">
          หน้านี้จำกัดสิทธิ์เฉพาะผู้ใช้ที่มีบทบาท admin หรือ staff เท่านั้น กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแล
        </p>
        <Link
          href="/login?next=/admin"
          className="focus-ring rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
