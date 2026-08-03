import type { Review } from "@/types/review";

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export const MOCK_REVIEWS: Review[] = [
  { id: "r1", productId: "p1", userName: "กิตติ ว.", rating: 5, title: "เมาส์เบามาก แม่นยำสุด ๆ", content: "ใช้เล่น FPS มาสองอาทิตย์ ตอบสนองไวมาก น้ำหนักเบาจนลืมว่าถืออยู่ เซนเซอร์นิ่งไม่มีเบี้ยว", images: [], isVerifiedPurchase: true, status: "approved", helpfulCount: 24, createdAt: daysAgo(5) },
  { id: "r2", productId: "p1", userName: "Nan_gaming", rating: 4, title: "ดีเกินราคา", content: "ปุ่มคลิกหนึบดี แต่สายไฟแข็งไปนิดตอนแรก ใช้ไปสักพักก็นิ่มขึ้น โดยรวมคุ้มค่ามาก", images: [], isVerifiedPurchase: true, status: "approved", helpfulCount: 11, createdAt: daysAgo(12) },
  { id: "r3", productId: "p3", userName: "Praewa S.", rating: 5, title: "ตัดเสียงรบกวนดีเกินคาด", content: "พกไปทำงานที่ร้านกาแฟ เปิด ANC แล้วเงียบจนตกใจ เสียงเบสแน่นฟังเพลงเพราะมาก แบตอึดจริงตามสเปก", images: [], isVerifiedPurchase: true, status: "approved", helpfulCount: 40, createdAt: daysAgo(3) },
  { id: "r4", productId: "p4", userName: "Thanapon K.", rating: 5, title: "จอสวย กล้องคมชัด", content: "อัพจากรุ่นเก่ามา 3 ปี ความต่างเยอะมาก จอลื่นไหล กล้องกลางคืนดีขึ้นเยอะ ชาร์จไวสมคำโฆษณา", images: [], isVerifiedPurchase: true, status: "approved", helpfulCount: 58, createdAt: daysAgo(8) },
  { id: "r5", productId: "p2", userName: "Keyboard_freak", rating: 5, title: "เสียงพิมพ์หนึบ ฟินมาก", content: "Hot-swap เปลี่ยนสวิตช์เองได้ง่าย ตัวเรือนแน่นหนึบสมราคา แบตอยู่ได้เป็นอาทิตย์", images: [], isVerifiedPurchase: true, status: "approved", helpfulCount: 19, createdAt: daysAgo(20) },
  { id: "r6", productId: "p6", userName: "Runner_Mild", rating: 4, title: "ใส่วิ่งสบาย ระบายอากาศดี", content: "ใส่วิ่ง 10K ทุกเสาร์อาทิตย์ ไม่รู้สึกอับชื้น พื้นรองรับแรงกระแทกดี ไซซ์ตรงตามตาราง", images: [], isVerifiedPurchase: true, status: "approved", helpfulCount: 15, createdAt: daysAgo(15) },
];

export function getMockReviewsByProduct(productId: string) {
  return MOCK_REVIEWS.filter((r) => r.productId === productId && r.status === "approved");
}
