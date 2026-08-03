import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { InfoPageLayout, InfoSection } from "@/components/shared/info-page-layout";
import { ContactForm } from "@/components/home/contact-form";

export const metadata: Metadata = { title: "ติดต่อเรา" };

export default function ContactPage() {
  return (
    <InfoPageLayout title="ติดต่อเรา" subtitle="ทีมงานพร้อมช่วยเหลือคุณทุกวัน">
      <InfoSection heading="ช่องทางการติดต่อ">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ContactItem icon={Mail} label="อีเมล" value="support@spinshop360.local" />
          <ContactItem icon={Phone} label="โทรศัพท์" value="02-123-4567" />
          <ContactItem icon={MapPin} label="ที่อยู่" value="กรุงเทพมหานคร ประเทศไทย" />
          <ContactItem icon={Clock} label="เวลาทำการ" value="จันทร์–ศุกร์ 9:00–18:00 น." />
        </div>
      </InfoSection>

      <InfoSection heading="ส่งข้อความถึงเรา">
        <ContactForm />
      </InfoSection>
    </InfoPageLayout>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
