import type { Metadata } from "next";
import { InfoPageLayout, InfoSection } from "@/components/shared/info-page-layout";
import { FREE_SHIPPING_THRESHOLD, DEFAULT_SHIPPING_FEE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "การจัดส่ง" };

export default function ShippingPage() {
  return (
    <InfoPageLayout title="นโยบายการจัดส่ง" subtitle="จัดส่งทั่วประเทศไทยผ่านขนส่งชั้นนำ">
      <InfoSection heading="ระยะเวลาจัดส่ง">
        <ul className="list-disc pl-5">
          <li>จัดส่งมาตรฐาน: 2-4 วันทำการ</li>
          <li>จัดส่งด่วน: 1-2 วันทำการ</li>
          <li>พื้นที่ห่างไกลอาจใช้เวลาเพิ่มเติม 1-3 วันทำการ</li>
        </ul>
      </InfoSection>

      <InfoSection heading="ค่าจัดส่ง">
        <p>
          ค่าจัดส่งมาตรฐานอยู่ที่ {formatCurrency(DEFAULT_SHIPPING_FEE)} ต่อคำสั่งซื้อ และ{" "}
          <span className="font-medium text-foreground">จัดส่งฟรี</span> เมื่อยอดสั่งซื้อถึง{" "}
          {formatCurrency(FREE_SHIPPING_THRESHOLD)} ขึ้นไป
        </p>
      </InfoSection>

      <InfoSection heading="การติดตามสถานะ">
        <p>
          หลังจากสินค้าถูกจัดส่งแล้ว คุณจะได้รับหมายเลขติดตามพัสดุทางอีเมล และสามารถตรวจสอบสถานะคำสั่งซื้อได้ที่หน้า
          &ldquo;บัญชีของฉัน &gt; ประวัติคำสั่งซื้อ&rdquo; ตลอดเวลา
        </p>
      </InfoSection>

      <InfoSection heading="หากสินค้าเสียหายระหว่างจัดส่ง">
        <p>
          กรุณาตรวจสอบสภาพสินค้าก่อนเซ็นรับ หากพบความเสียหายจากการขนส่ง สามารถแจ้งเปลี่ยนสินค้าได้ภายใน 24 ชั่วโมง
          หลังได้รับสินค้า ผ่านหน้า{" "}
          <a href="/contact" className="text-primary hover:text-primary-hover">
            ติดต่อเรา
          </a>
        </p>
      </InfoSection>
    </InfoPageLayout>
  );
}
