import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return <main className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center gap-5 px-6 text-center">
    <Compass className="h-14 w-14 text-accent" />
    <p className="text-xs tracking-[.3em] text-muted">404 / SPINSHOP 360</p>
    <h1 className="text-2xl font-semibold">ไม่พบหน้าที่คุณต้องการ</h1>
    <p className="text-muted">สินค้าหรือหน้านี้อาจถูกย้าย ลองค้นหาสินค้าอื่นได้เลย</p>
    <Link href="/products" className="primary-action">เลือกซื้อสินค้า</Link>
    <Link href="/" className="text-sm text-muted">กลับหน้าแรก</Link>
  </main>;
}
