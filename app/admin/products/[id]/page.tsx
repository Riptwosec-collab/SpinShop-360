"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box, RotateCw, Smartphone, Trash2, Copy } from "lucide-react";
import { useToastStore } from "@/lib/stores/toast-store";
import { Section, FieldRow, UploadBox, ToggleCard } from "@/components/admin/form-blocks";
import { useAdminProduct } from "@/lib/hooks/use-admin-products";
import { useAdminCategoriesAndBrands } from "@/lib/hooks/use-admin-options";
import { USE_MOCK_DATA } from "@/lib/constants";

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const pushToast = useToastStore((s) => s.push);
  const product = useAdminProduct(params.id);
  const { categories, brands } = useAdminCategoriesAndBrands();

  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [sku, setSku] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [supports3d, setSupports3d] = useState(false);
  const [supports360, setSupports360] = useState(false);
  const [supportsAr, setSupportsAr] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setShortDescription(product.shortDescription);
    setDescription(product.description);
    setBrandId(product.brandId ?? "");
    setCategoryId(product.categoryId ?? "");
    setBasePrice(String(product.basePrice));
    setCompareAtPrice(product.compareAtPrice != null ? String(product.compareAtPrice) : "");
    setSku(product.sku);
    setStockQuantity(String(product.stockQuantity));
    setSupports3d(product.supports3d);
    setSupports360(product.supports360);
    setSupportsAr(product.supportsAr);
  }, [product]);

  if (product === undefined) {
    return <div className="p-12 text-center text-sm text-muted">กำลังโหลดข้อมูลสินค้า...</div>;
  }
  if (product === null) {
    return <div className="p-12 text-center text-sm text-muted">ไม่พบสินค้านี้</div>;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (USE_MOCK_DATA) {
      setSaving(true);
      setTimeout(() => {
        setSaving(false);
        pushToast("บันทึกการแก้ไขแล้ว (โหมดทดสอบ ยังไม่บันทึกลงฐานข้อมูลจริง)", "success");
        router.push("/admin/products");
      }, 600);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          shortDescription,
          description,
          brandId: brandId || null,
          categoryId: categoryId || null,
          basePrice: Number(basePrice) || 0,
          compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
          sku,
          stockQuantity: Number(stockQuantity) || 0,
          supports3d,
          supports360,
          supportsAr,
        }),
      });
      const result = await res.json();
      setSaving(false);

      if (!result.ok) {
        pushToast(result.message ?? "ไม่สามารถบันทึกการเปลี่ยนแปลงได้", "error");
        return;
      }
      pushToast("บันทึกการเปลี่ยนแปลงสำเร็จ", "success");
      router.push("/admin/products");
    } catch {
      setSaving(false);
      pushToast("เกิดข้อผิดพลาด กรุณาลองใหม่", "error");
    }
  }

  async function handleDelete() {
    if (USE_MOCK_DATA) {
      pushToast("ลบสินค้าแบบ Soft Delete แล้ว (โหมดทดสอบ)", "success");
      return;
    }
    const res = await fetch(`/api/admin/products/${params.id}`, { method: "DELETE" });
    const result = await res.json();
    pushToast(result.message, result.ok ? "success" : "error");
    if (result.ok) router.push("/admin/products");
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">แก้ไขสินค้า</h1>
          <p className="text-sm text-muted">{product.name}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => pushToast("ทำสำเนาสินค้าแล้ว (ยังเป็นฟีเจอร์ตัวอย่าง)", "success")}
            className="focus-ring flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:border-primary/40"
          >
            <Copy className="h-3.5 w-3.5" />
            ทำสำเนา
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="focus-ring flex items-center gap-1.5 rounded-lg border border-danger/40 px-3 py-2 text-xs text-danger hover:bg-danger/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            ลบสินค้า
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <Section title="ข้อมูลพื้นฐาน">
          <FieldRow label="ชื่อสินค้า">
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </FieldRow>
          <FieldRow label="คำอธิบายสั้น">
            <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="input" />
          </FieldRow>
          <FieldRow label="รายละเอียดสินค้า">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-28" />
          </FieldRow>
          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="แบรนด์">
              <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="input">
                <option value="">{product.brandName !== "-" ? product.brandName : "ไม่ระบุ"}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="หมวดหมู่">
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
                <option value="">ไม่ระบุ</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FieldRow>
          </div>
        </Section>

        <Section title="ราคาและสต็อก">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FieldRow label="ราคาขาย (บาท)">
              <input type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="input" />
            </FieldRow>
            <FieldRow label="ราคาก่อนลด">
              <input type="number" min={0} value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} className="input" />
            </FieldRow>
            <FieldRow label="SKU">
              <input value={sku} onChange={(e) => setSku(e.target.value)} className="input" />
            </FieldRow>
            <FieldRow label="จำนวนสต็อก">
              <input type="number" min={0} value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className="input" />
            </FieldRow>
          </div>
        </Section>

        <Section title="สื่อสินค้า">
          <UploadBox label="รูปภาพสินค้า" hint={`ปัจจุบัน ${product.imageCount} รูป — JPG, PNG, WebP`} />
          <UploadBox label="โมเดล 3D (.glb / .gltf)" hint={product.modelGlbUrl ?? "ยังไม่มีโมเดล"} />
          <UploadBox label="ภาพหมุน 360 องศา" hint={product.frameCount > 0 ? `ปัจจุบัน ${product.frameCount} เฟรม` : "ยังไม่มีภาพหมุน"} />
        </Section>

        <Section title="รูปแบบการแสดงสินค้า">
          <div className="flex flex-wrap gap-3">
            <ToggleCard label="รองรับโมเดล 3D" icon={Box} checked={supports3d} onChange={setSupports3d} />
            <ToggleCard label="รองรับภาพหมุน 360°" icon={RotateCw} checked={supports360} onChange={setSupports360} />
            <ToggleCard label="รองรับ AR" icon={Smartphone} checked={supportsAr} onChange={setSupportsAr} />
          </div>
        </Section>

        {supports3d && product.hotspots.length > 0 && (
          <Section title="จุดสำคัญบนโมเดล (Hotspot)">
            <ul className="flex flex-col divide-y divide-border">
              {product.hotspots.map((h, i) => (
                <li key={h.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>
                    {i + 1}. {h.title}
                  </span>
                  <span className="text-xs text-muted">
                    x:{h.position.x} y:{h.position.y} z:{h.position.z}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href={`/admin/products/${product.id}/hotspots`}
              className="focus-ring inline-block w-fit rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20"
            >
              เปิด Hotspot Editor (คลิกบนโมเดลเพื่อวางจุด)
            </Link>
          </Section>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="focus-ring rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={saving}
            className="focus-ring rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </form>
    </div>
  );
}
