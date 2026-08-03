const ANALYTICS = [
  { label: "เข้าชมหน้าสินค้า", value: "24,830" },
  { label: "เปิดดูโมเดล 3D", value: "1,842" },
  { label: "เปิดดูภาพหมุน 360°", value: "3,210" },
  { label: "เปิดใช้งาน AR", value: "356" },
  { label: "อัตราการเพิ่มลงตะกร้า", value: "6.4%" },
  { label: "อัตราการสั่งซื้อสำเร็จ", value: "2.1%" },
];

export default function AdminAnalyticsPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-foreground">วิเคราะห์ข้อมูล</h1>
      <p className="mb-6 text-sm text-muted">
        ข้อมูลตัวอย่างสำหรับสาธิต Dashboard — เชื่อมต่อ PostHog หรือ Google Analytics ผ่าน{" "}
        <code className="rounded bg-surface-secondary px-1 py-0.5 text-xs">lib/analytics</code> เพื่อดูข้อมูลจริง
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {ANALYTICS.map((a) => (
          <div key={a.label} className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xl font-semibold text-foreground">{a.value}</p>
            <p className="mt-1 text-xs text-muted">{a.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
