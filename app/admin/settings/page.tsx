"use client";

import { useToastStore } from "@/lib/stores/toast-store";
import { APP_NAME } from "@/lib/constants";

export default function AdminSettingsPage() {
  const pushToast = useToastStore((s) => s.push);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-foreground">ตั้งค่าร้านค้า</h1>
      <p className="mb-6 text-sm text-muted">ตั้งค่าทั่วไปของร้าน (โหมดทดสอบ — การเปลี่ยนแปลงจะไม่ถูกบันทึกถาวร)</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          pushToast("บันทึกการตั้งค่าแล้ว (โหมดทดสอบ)", "success");
        }}
        className="flex max-w-lg flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">ชื่อร้าน</span>
          <input defaultValue={APP_NAME} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">อีเมลติดต่อ</span>
          <input type="email" defaultValue="support@spinshop360.local" className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">สกุลเงิน</span>
          <select defaultValue="THB" className="input">
            <option value="THB">บาทไทย (THB)</option>
            <option value="USD">ดอลลาร์สหรัฐ (USD)</option>
          </select>
        </label>
        <button type="submit" className="focus-ring rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-hover">
          บันทึกการตั้งค่า
        </button>
      </form>
    </div>
  );
}
