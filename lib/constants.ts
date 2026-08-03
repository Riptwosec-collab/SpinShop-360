export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "SpinShop 360";
export const APP_TAGLINE = "หมุนดูก่อนซื้อ เห็นสินค้าครบทุกมุม";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
export const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "THB";
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

export const FREE_SHIPPING_THRESHOLD = 1500;
export const DEFAULT_SHIPPING_FEE = 50;

export const PRODUCTS_PER_PAGE = 12;

export const MAIN_NAV = [
  { label: "หน้าแรก", href: "/" },
  { label: "สินค้าทั้งหมด", href: "/products" },
  { label: "สินค้า 3D", href: "/products?supports3d=true" },
  { label: "โปรโมชัน", href: "/products?onSale=true" },
  { label: "เปรียบเทียบ", href: "/compare" },
] as const;

export const CATEGORIES = [
  { name: "โทรศัพท์และแท็บเล็ต", slug: "phones-tablets", icon: "Smartphone" },
  { name: "คอมพิวเตอร์", slug: "computers", icon: "Laptop" },
  { name: "อุปกรณ์เกมมิง", slug: "gaming", icon: "Gamepad2" },
  { name: "หูฟังและลำโพง", slug: "audio", icon: "Headphones" },
  { name: "รองเท้า", slug: "shoes", icon: "Footprints" },
  { name: "กระเป๋า", slug: "bags", icon: "Backpack" },
  { name: "เฟอร์นิเจอร์", slug: "furniture", icon: "Sofa" },
  { name: "ของแต่งบ้าน", slug: "home-decor", icon: "Lamp" },
  { name: "ฟิกเกอร์และของสะสม", slug: "collectibles", icon: "Trophy" },
] as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "รอดำเนินการ",
  awaiting_payment: "รอชำระเงิน",
  paid: "ชำระเงินแล้ว",
  processing: "กำลังเตรียมสินค้า",
  packed: "แพ็คสินค้าแล้ว",
  shipped: "จัดส่งแล้ว",
  delivered: "จัดส่งสำเร็จ",
  completed: "สำเร็จ",
  cancelled: "ยกเลิก",
  refunded: "คืนเงินแล้ว",
};

export const VIEWER_MODE_LABEL: Record<string, string> = {
  image: "รูปภาพ",
  "360": "ดู 360°",
  "3d": "ดูแบบ 3D",
  ar: "ดูในพื้นที่จริง",
};

export const MOCK_ADMIN_ACCOUNT = {
  email: "admin@spinshop360.local",
  password: "Admin123!",
  role: "admin" as const,
};

export const MOCK_CUSTOMER_ACCOUNT = {
  email: "customer@spinshop360.local",
  password: "Customer123!",
  role: "customer" as const,
};
