const COUPONS = [
  { code: "SPIN10", type: "เปอร์เซ็นต์", value: "10%", minOrder: "500 บาท", status: "ใช้งานอยู่" },
  { code: "SAVE100", type: "จำนวนเงิน", value: "100 บาท", minOrder: "1,000 บาท", status: "ใช้งานอยู่" },
  { code: "FREESHIP", type: "ส่งฟรี", value: "-", minOrder: "ไม่มีขั้นต่ำ", status: "ใช้งานอยู่" },
];

export default function AdminCouponsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">คูปองส่วนลด</h1>
          <p className="text-sm text-muted">คูปองทั้งหมด {COUPONS.length} รายการ</p>
        </div>
        <button className="focus-ring rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover">
          สร้างคูปองใหม่
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3">โค้ด</th>
              <th className="px-4 py-3">ประเภท</th>
              <th className="px-4 py-3">มูลค่าส่วนลด</th>
              <th className="px-4 py-3">ยอดขั้นต่ำ</th>
              <th className="px-4 py-3">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {COUPONS.map((c) => (
              <tr key={c.code}>
                <td className="px-4 py-3 font-medium text-foreground">{c.code}</td>
                <td className="px-4 py-3 text-muted">{c.type}</td>
                <td className="px-4 py-3">{c.value}</td>
                <td className="px-4 py-3 text-muted">{c.minOrder}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
