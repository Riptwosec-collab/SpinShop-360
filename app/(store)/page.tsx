
import { Localized } from "@/lib/i18n/localized";
import { HeroSection } from "@/components/home/hero-section";
import { CategorySection } from "@/components/home/category-section";
import { ProductRail } from "@/components/home/product-rail";
import { HighlightsSection } from "@/components/home/highlights-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import {
  getFeaturedProducts,
  getBestsellerProducts,
  get3dProducts,
} from "@/lib/services/products";

export default async function HomePage() {
  const [featured, bestsellers, modelProducts] = await Promise.all([
    getFeaturedProducts(8),
    getBestsellerProducts(8),
    get3dProducts(6),
  ]);

  return (
    <Localized><>
      <HeroSection />
      <CategorySection />
      <ProductRail
        title="สินค้าแนะนำ"
        subtitle="คัดสรรสินค้าคุณภาพพร้อมระบบดูสินค้า 3D และ 360 องศา"
        products={featured}
        viewAllHref="/products?featured=true"
      />
      <HighlightsSection />
      <ProductRail
        title="สินค้าขายดี"
        subtitle="สินค้ายอดนิยมที่ลูกค้าเลือกซื้อมากที่สุด"
        products={bestsellers}
        viewAllHref="/products?onSale=false&sort=bestselling"
      />
      <ProductRail
        title="สำรวจสินค้าในสตูดิโอ 3D"
        subtitle="หมุนและซูมโมเดลเพื่อสำรวจสินค้าได้รอบด้าน"
        products={modelProducts}
        viewAllHref="/products?supports3d=true"
      />
      <TestimonialsSection />
    </></Localized>
  );
}
