import { HeroSection } from "@/components/home/hero-section";
import { CategorySection } from "@/components/home/category-section";
import { ProductRail } from "@/components/home/product-rail";
import { PromoBanner } from "@/components/home/promo-banner";
import { HighlightsSection } from "@/components/home/highlights-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import {
  getFeaturedProducts,
  getBestsellerProducts,
  getArProducts,
} from "@/lib/services/products";

export default async function HomePage() {
  const [featured, bestsellers, arProducts] = await Promise.all([
    getFeaturedProducts(10),
    getBestsellerProducts(10),
    getArProducts(6),
  ]);

  return (
    <>
      <HeroSection product={featured[0]} />
      <CategorySection />
      <ProductRail
        title="สินค้าเด่นแบบ 360°"
        subtitle="หมุนดูรายละเอียดสินค้าได้รอบด้านก่อนตัดสินใจซื้อ"
        products={featured}
        viewAllHref="/products?featured=true"
      />
      <PromoBanner />
      <HighlightsSection />
      <ProductRail
        title="สินค้าขายดี"
        subtitle="สินค้ายอดนิยมที่ลูกค้าเลือกซื้อมากที่สุด"
        products={bestsellers}
        viewAllHref="/products?onSale=false&sort=bestselling"
      />
      <ProductRail
        title="ทดลองวางสินค้าจริงด้วย AR"
        subtitle="ดูสินค้าเสมือนอยู่ในพื้นที่ของคุณผ่านสมาร์ทโฟน"
        products={arProducts}
        viewAllHref="/products?supportsAr=true"
      />
      <TestimonialsSection />
    </>
  );
}
