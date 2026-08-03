import type { Metadata } from "next";
import { QrCode, CreditCard, Landmark, Truck } from "lucide-react";
import { InfoPageLayout, InfoSection } from "@/components/shared/info-page-layout";

export const metadata: Metadata = { title: "วิธีชำระเงิน" };

const METHODS = [
  { icon: QrCode, title: "พร้อมเพย์ (PromptPay)", desc: "สแกน QR Code ชำระเงินผ่านแอปธนาคารได้ทันที ยืนยันอัตโนมัติภายในไม่กี่วินาที" },
  { icon: CreditCard, title: "บัตรเครดิต/เดบิต", desc: "รองรับบัตร Visa, Mastercard, JCB ชำระเงินอย่างปลอดภัยผ่านระบบเข้ารหัสมาตรฐาน PCI-DSS" },
  { icon: Landmark, title: "โอนเงินผ่านธนาคาร", desc: "โอนเงินเข้าบัญชีธนาคารที่ระบุ แล้วแจ้งหลักฐานการโอนผ่านระบบ ใช้เวลาตรวจสอบ 1-2 ชั่วโมงทำการ" },
  { icon: Truck, title: "เก็บเงินปลายทาง (COD)", desc: "ชำระเงินสดกับพนักงานจัดส่งเมื่อได้รับสินค้า รองรับคำสั่งซื้อไม่เกิน 5,000 บาท" },
];

export default function PaymentMethodsPage() {
  return (
    <InfoPageLayout title="วิธีชำระเงิน" subtitle="เลือกวิธีชำระเงินที่สะดวกสำหรับคุณ">
      <InfoSection heading="ช่องทางการชำระเงินที่รองรับ">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {METHODS.map((m) => (
            <div key={m.title} className="rounded-xl border border-border bg-surface p-4">
              <m.icon className="mb-2 h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-foreground">{m.title}</p>
              <p className="mt-1 text-xs text-muted">{m.desc}</p>
            </div>
          ))}
        </div>
      </InfoSection>

      <InfoSection heading="ความปลอดภัยในการชำระเงิน">
        <p>
          ระบบชำระเงินของเราไม่มีการเก็บข้อมูลบัตรเครดิตไว้บนเซิร์ฟเวอร์ของเรา
          การทำรายการบัตรทั้งหมดดำเนินการผ่านผู้ให้บริการชำระเงินที่ได้มาตรฐาน PCI-DSS
        </p>
      </InfoSection>
    </InfoPageLayout>
  );
}
