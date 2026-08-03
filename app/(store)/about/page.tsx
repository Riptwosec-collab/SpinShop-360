import type { Metadata } from "next";
import { InfoPageLayout, InfoSection } from "@/components/shared/info-page-layout";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "เกี่ยวกับเรา" };

export default function AboutPage() {
  return (
    <InfoPageLayout title="เกี่ยวกับ SpinShop 360" subtitle="หมุนดูก่อนซื้อ เห็นสินค้าครบทุกมุม">
      <InfoSection heading="เราคือใคร">
        <p>
          {APP_NAME} คือร้านค้าออนไลน์ที่เชื่อว่าการเลือกซื้อสินค้าออนไลน์ควรมั่นใจได้เหมือนได้จับสินค้าจริงในมือ
          เราจึงพัฒนาระบบดูสินค้าแบบ 3D และภาพหมุน 360 องศา ให้ลูกค้าสามารถหมุนดู ซูม
          และสำรวจทุกรายละเอียดของสินค้าได้ก่อนตัดสินใจซื้อ ลดความกังวลเรื่อง &ldquo;ของไม่ตรงปก&rdquo;
          ที่มักเกิดขึ้นกับการช้อปปิ้งออนไลน์ทั่วไป
        </p>
      </InfoSection>

      <InfoSection heading="สิ่งที่เราให้ความสำคัญ">
        <ul className="list-disc pl-5">
          <li>ความโปร่งใสของข้อมูลสินค้า — รูปภาพ สเปก และรีวิวต้องตรงกับของจริง</li>
          <li>ประสบการณ์การเลือกซื้อที่ลื่นไหลบนทุกอุปกรณ์ ตั้งแต่มือถือไปจนถึงเดสก์ท็อป</li>
          <li>การจัดส่งที่รวดเร็วและบรรจุภัณฑ์ที่ปลอดภัยต่อสินค้า</li>
          <li>บริการหลังการขายที่ตอบสนองไว และนโยบายคืนสินค้าที่เป็นธรรม</li>
        </ul>
      </InfoSection>

      <InfoSection heading="ติดต่อเรา">
        <p>
          หากมีคำถามเกี่ยวกับสินค้าหรือบริการ สามารถดูช่องทางการติดต่อทั้งหมดได้ที่หน้า{" "}
          <a href="/contact" className="text-primary hover:text-primary-hover">
            ติดต่อเรา
          </a>
        </p>
      </InfoSection>
    </InfoPageLayout>
  );
}
