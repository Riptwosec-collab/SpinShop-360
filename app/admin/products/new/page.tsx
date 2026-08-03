"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, RotateCw, Smartphone } from "lucide-react";
import { useToastStore } from "@/lib/stores/toast-store";
import { Section, FieldRow, UploadBox, ToggleCard } from "@/components/admin/form-blocks";
import { useAdminCategoriesAndBrands } from "@/lib/hooks/use-admin-options";
import { slugify } from "@/lib/utils";
import { USE_MOCK_DATA } from "@/lib/constants";

export default function NewProductPage() {
  const router = useRouter();
  const pushToast = useToastStore((s) => s.push);
  const { categories, brands } = useAdminCategoriesAndBrands();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [sku, setSku] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [supports3d, setSupports3d] = useState(false);
  const [supports360, setSupports360] = useState(false);
  const [supportsAr, setSupportsAr] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent, publish: boolean) {
    e.preventDefault();

    if (USE_MOCK_DATA) {
      setSaving(true);
      setTimeout(() => {
        setSaving(false);
        pushToast(
          publish
            ? "เผยแพร่สินค้าสำเร็จ (โหมดทดสอบ ยังไม่บันทึกลงฐานข้อมูลจริง — ปิด Mock Mode และเชื่อม Supabase เพื่อบันทึกจริง)"
            : "บันทึกร่างสินค้าแล้ว (โหมดทดสอบ)",
          "success"
        );
        router.push("/admin/products");
      }, 600);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          shortDescription,
          description,
          brandId: brandId || null,
          categoryId: categoryId || null,
          status: publish ? "active" : "draft",
          basePrice: Number(basePrice) || 0,
          compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
          sku,
          stockQuantity: Number(stockQuantity) || 0,
          supports3d,
          supports360,
          supportsAr,
          seoTitle,
          seoDescription,
        }),
      });
      const result = await res.json();
      setSaving(false);

      if (!result.ok) {
        pushToast(result.message ?? "ไม่สามารถบันทึกสินค้าได้", "error");
        return;
      }

      pushToast(publish ? "เผยแพร่สินค้าสำเร็จ" : "บันทึกร่างสินค้าแล้ว", "success");
      router.push("/admin/products");
    } catch {
      setSaving(false);
      pushToast("เกิดข้อผิดพลาดในการบันทึกสินค้า กรุณาลองใหม่", "error");
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-foreground">เพิ่มสินค้าใหม่</h1>
      <p className="mb-6 text-sm text-muted">
        {USE_MOCK_DATA
          ? "กรอกข้อมูลสินค้าเป็นขั้นตอน — ในโหมด Mock ข้อมูลจะไม่ถูกบันทึกถาวร (เชื่อม Supabase เพื่อบันทึกจริง)"
          : "กรอกข้อมูลสินค้าเป็นขั้นตอน — บันทึกแล้วจะเขียนลงฐานข้อมูล Supabase จริงทันที"}
      </p>

      <form onSubmit={(e) => handleSubmit(e, false)} className="flex flex-col gap-6">
        <Section title="ข้อมูลพื้นฐาน">
          <FieldRow label="ชื่อสินค้า">
            <input
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="input"
              placeholder="เช่น Vertex Pro Gaming Mouse"
            />
          </FieldRow>
          <FieldRow label="Slug (URL)">
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className="input"
              placeholder="vertex-pro-gaming-mouse"
            />
          </FieldRow>
          <FieldRow label="คำอธิบายสั้น">
            <input
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="input"
              placeholder="สรุปจุดเด่นของสินค้าใน 1 ประโยค"
            />
          </FieldRow>
          <FieldRow label="รายละเอียดสินค้า">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-28"
              placeholder="รายละเอียดแบบเต็ม รองรับ Rich Text ในเวอร์ชันเต็ม"
            />
          </FieldRow>
          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="แบรนด์">
              <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="input">
                <option value="">ไม่ระบุ</option>
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
              <input required value={sku} onChange={(e) => setSku(e.target.value)} className="input" />
            </FieldRow>
            <FieldRow label="จำนวนสต็อก">
              <input type="number" min={0} value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className="input" />
            </FieldRow>
          </div>
        </Section>

        <Section title="สื่อสินค้า">
          <UploadBox label="รูปภาพสินค้า" hint="JPG, PNG, WebP — แนะนำอัตราส่วน 1:1" />
          <UploadBox label="โมเดล 3D (.glb / .gltf)" hint="ขนาดแนะนำไม่เกิน 15-25MB รองรับ Draco Compression" />
          <UploadBox label="โมเดล AR สำหรับ iOS (.usdz)" hint="ไม่บังคับ ใช้สำหรับ Quick Look บน iOS" />
          <UploadBox label="ภาพหมุน 360 องศา (หลายไฟล์)" hint="แนะนำ 24-72 ภาพ ตั้งชื่อไฟล์ frame-001, frame-002 ตามลำดับ" />
          <p className="text-xs text-muted">
            หมายเหตุ: การอัปโหลดไฟล์จริงเข้า Supabase Storage ยังเป็นขั้นตอนแยก — อัปโหลดผ่าน Storage Dashboard หรือ Storage API
            แล้ววาง URL ที่ได้ลงในช่อง &ldquo;โมเดล 3D&rdquo;/&ldquo;รูปภาพ&rdquo; ด้านล่างในหน้าแก้ไขสินค้า
          </p>
        </Section>

        <Section title="รูปแบบการแสดงสินค้า">
          <div className="flex flex-wrap gap-3">
            <ToggleCard label="รองรับโมเดล 3D" icon={Box} checked={supports3d} onChange={setSupports3d} />
            <ToggleCard label="รองรับภาพหมุน 360°" icon={RotateCw} checked={supports360} onChange={setSupports360} />
            <ToggleCard label="รองรับ AR" icon={Smartphone} checked={supportsAr} onChange={setSupportsAr} />
          </div>
        </Section>

        <Section title="SEO">
          <FieldRow label="SEO Title">
            <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="input" />
          </FieldRow>
          <FieldRow label="SEO Description">
            <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className="input min-h-20" />
          </FieldRow>
        </Section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={(e) => handleSubmit(e as never, false)}
            disabled={saving}
            className="focus-ring rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground disabled:opacity-50"
          >
            บันทึกร่าง
          </button>
          <button
            type="submit"
            disabled={saving}
            className="focus-ring rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "เผยแพร่สินค้า"}
          </button>
        </div>
      </form>
    </div>
  );
}
