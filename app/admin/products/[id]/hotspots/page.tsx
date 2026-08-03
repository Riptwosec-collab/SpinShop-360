"use client";

import { useRouter } from "next/navigation";
import { HotspotEditor, type HotspotDraft } from "@/components/admin/hotspot-editor";
import { useToastStore } from "@/lib/stores/toast-store";
import { useAdminProduct } from "@/lib/hooks/use-admin-products";
import { USE_MOCK_DATA } from "@/lib/constants";
import type { ProductHotspot } from "@/types/product";

export default function ProductHotspotsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const pushToast = useToastStore((s) => s.push);
  const product = useAdminProduct(params.id);

  if (product === undefined) {
    return <div className="p-12 text-center text-sm text-muted">กำลังโหลด...</div>;
  }
  if (product === null) {
    return <div className="p-12 text-center text-sm text-muted">ไม่พบสินค้านี้</div>;
  }
  if (!product.modelGlbUrl) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted">
        สินค้านี้ยังไม่มีโมเดล 3D — อัปโหลดโมเดลก่อนจึงจะตั้งค่า Hotspot ได้
      </div>
    );
  }

  async function handleSave(hotspots: HotspotDraft[]) {
    if (USE_MOCK_DATA) {
      pushToast(`บันทึก Hotspot ${hotspots.length} จุดแล้ว (โหมดทดสอบ ยังไม่บันทึกลงฐานข้อมูลจริง)`, "success");
      router.push(`/admin/products/${params.id}`);
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${params.id}/hotspots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotspots: hotspots.map((h, i) => ({
            id: h.id.startsWith("draft-") ? undefined : h.id,
            title: h.title,
            description: h.description,
            position: h.position,
            normal: h.normal,
            isActive: h.isActive,
            sortOrder: i,
          })),
        }),
      });
      const result = await res.json();
      pushToast(result.message, result.ok ? "success" : "error");
      if (result.ok) router.push(`/admin/products/${params.id}`);
    } catch {
      pushToast("เกิดข้อผิดพลาดในการบันทึก Hotspot กรุณาลองใหม่", "error");
    }
  }

  // Adapt the lightweight AdminProductRow hotspot shape into the full
  // ProductHotspot type the editor expects (missing fields default sensibly).
  const initialHotspots: ProductHotspot[] = product.hotspots.map((h) => ({
    id: h.id,
    productId: product.id,
    title: h.title,
    description: "",
    position: h.position,
    normal: null,
    isActive: true,
    sortOrder: 0,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">ตั้งค่า Hotspot</h1>
          <p className="text-sm text-muted">{product.name}</p>
        </div>
      </div>

      <HotspotEditor modelUrl={product.modelGlbUrl} initialHotspots={initialHotspots} onSave={handleSave} />
    </div>
  );
}
