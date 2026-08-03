export interface Dictionary {
  nav: {
    home: string;
    products: string;
    products3d: string;
    promotions: string;
    compare: string;
  };
  common: {
    addToCart: string;
    buyNow: string;
    wishlist: string;
    cart: string;
    search: string;
    login: string;
    logout: string;
    outOfStock: string;
    inStock: string;
    viewAll: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta1: string;
    cta2: string;
  };
  product: {
    quickView: string;
    addedToWishlist: string;
    removedFromWishlist: string;
    reviews: string;
    sold: string;
  };
  cart: {
    title: string;
    empty: string;
    emptyDesc: string;
    subtotal: string;
    shipping: string;
    free: string;
    discount: string;
    grandTotal: string;
    checkout: string;
    continueShopping: string;
    couponPlaceholder: string;
    applyCoupon: string;
  };
  checkout: {
    title: string;
    stepBuyer: string;
    stepShipping: string;
    stepPayment: string;
    stepReview: string;
    back: string;
    next: string;
    confirmOrder: string;
    orderSummary: string;
  };
  wishlist: {
    title: string;
    empty: string;
  };
  compare: {
    title: string;
    subtitle: string;
    empty: string;
  };
  account: {
    title: string;
    profile: string;
    orders: string;
    addresses: string;
    myReviews: string;
    myCoupons: string;
  };
  footer: {
    aboutStore: string;
    customerService: string;
    legal: string;
    aboutUs: string;
    howToOrder: string;
    contactUs: string;
    paymentMethods: string;
    shipping: string;
    returns: string;
    privacy: string;
    terms: string;
    newsletterTitle: string;
    newsletterDesc: string;
    subscribe: string;
    rightsReserved: string;
  };
}

export const dictionaries: Record<"th" | "en", Dictionary> = {
  th: {
    nav: {
      home: "หน้าแรก",
      products: "สินค้าทั้งหมด",
      products3d: "สินค้า 3D",
      promotions: "โปรโมชัน",
      compare: "เปรียบเทียบ",
    },
    common: {
      addToCart: "เพิ่มลงตะกร้า",
      buyNow: "ซื้อทันที",
      wishlist: "รายการโปรด",
      cart: "ตะกร้าสินค้า",
      search: "ค้นหาสินค้า",
      login: "เข้าสู่ระบบ",
      logout: "ออกจากระบบ",
      outOfStock: "สินค้าหมด",
      inStock: "พร้อมส่ง",
      viewAll: "ดูทั้งหมด",
    },
    hero: {
      title: "หมุนดูก่อนซื้อ เห็นสินค้าครบทุกมุม",
      subtitle: "สำรวจสินค้าแบบ 3D และ 360 องศา ซูมดูทุกรายละเอียดก่อนตัดสินใจซื้อ",
      cta1: "เลือกซื้อสินค้า",
      cta2: "ทดลองดูสินค้า 3D",
    },
    product: {
      quickView: "ดูตัวอย่างสินค้า",
      addedToWishlist: "เพิ่มในรายการโปรดแล้ว",
      removedFromWishlist: "นำออกจากรายการโปรดแล้ว",
      reviews: "รีวิว",
      sold: "ขายแล้ว",
    },
    cart: {
      title: "ตะกร้าสินค้า",
      empty: "ตะกร้าของคุณว่างอยู่",
      emptyDesc: "เลือกซื้อสินค้าที่คุณสนใจแล้วเพิ่มลงตะกร้าได้เลย",
      subtotal: "ยอดรวมสินค้า",
      shipping: "ค่าจัดส่ง",
      free: "ฟรี",
      discount: "ส่วนลด",
      grandTotal: "ยอดชำระทั้งหมด",
      checkout: "ดำเนินการชำระเงิน",
      continueShopping: "เลือกซื้อสินค้าเพิ่มเติม",
      couponPlaceholder: "กรอกรหัสคูปอง",
      applyCoupon: "ใช้คูปอง",
    },
    checkout: {
      title: "ชำระเงิน",
      stepBuyer: "ข้อมูลผู้ซื้อ",
      stepShipping: "ที่อยู่จัดส่ง",
      stepPayment: "ชำระเงิน",
      stepReview: "ตรวจสอบคำสั่งซื้อ",
      back: "ย้อนกลับ",
      next: "ถัดไป",
      confirmOrder: "ยืนยันการสั่งซื้อ",
      orderSummary: "สรุปคำสั่งซื้อ",
    },
    wishlist: {
      title: "รายการโปรดของฉัน",
      empty: "ยังไม่มีสินค้าในรายการโปรด",
    },
    compare: {
      title: "เปรียบเทียบสินค้า",
      subtitle: "เลือกสินค้าได้สูงสุด 4 รายการ",
      empty: "ยังไม่มีสินค้าที่เปรียบเทียบ",
    },
    account: {
      title: "บัญชีของฉัน",
      profile: "ข้อมูลส่วนตัว",
      orders: "ประวัติคำสั่งซื้อ",
      addresses: "ที่อยู่",
      myReviews: "รีวิวของฉัน",
      myCoupons: "คูปองของฉัน",
    },
    footer: {
      aboutStore: "เกี่ยวกับร้าน",
      customerService: "บริการลูกค้า",
      legal: "กฎหมาย",
      aboutUs: "เกี่ยวกับเรา",
      howToOrder: "วิธีสั่งซื้อ",
      contactUs: "ติดต่อเรา",
      paymentMethods: "วิธีชำระเงิน",
      shipping: "การจัดส่ง",
      returns: "นโยบายคืนสินค้า",
      privacy: "นโยบายความเป็นส่วนตัว",
      terms: "ข้อกำหนดการใช้งาน",
      newsletterTitle: "รับโปรโมชันและสินค้าใหม่ก่อนใคร",
      newsletterDesc: "สมัครรับข่าวสารทางอีเมล ไม่มีสแปม ยกเลิกได้ทุกเมื่อ",
      subscribe: "สมัคร",
      rightsReserved: "สงวนลิขสิทธิ์ทุกรูปแบบ",
    },
  },
  en: {
    nav: {
      home: "Home",
      products: "All Products",
      products3d: "3D Products",
      promotions: "Promotions",
      compare: "Compare",
    },
    common: {
      addToCart: "Add to Cart",
      buyNow: "Buy Now",
      wishlist: "Wishlist",
      cart: "Cart",
      search: "Search products",
      login: "Log In",
      logout: "Log Out",
      outOfStock: "Out of Stock",
      inStock: "In Stock",
      viewAll: "View All",
    },
    hero: {
      title: "Spin before you buy. See every angle.",
      subtitle: "Explore products in 3D and 360° — zoom into every detail before you decide.",
      cta1: "Shop Now",
      cta2: "Try 3D Viewer",
    },
    product: {
      quickView: "Quick View",
      addedToWishlist: "Added to wishlist",
      removedFromWishlist: "Removed from wishlist",
      reviews: "Reviews",
      sold: "Sold",
    },
    cart: {
      title: "Shopping Cart",
      empty: "Your cart is empty",
      emptyDesc: "Browse products you like and add them to your cart",
      subtotal: "Subtotal",
      shipping: "Shipping",
      free: "Free",
      discount: "Discount",
      grandTotal: "Total",
      checkout: "Proceed to Checkout",
      continueShopping: "Continue Shopping",
      couponPlaceholder: "Enter coupon code",
      applyCoupon: "Apply",
    },
    checkout: {
      title: "Checkout",
      stepBuyer: "Buyer Info",
      stepShipping: "Shipping Address",
      stepPayment: "Payment",
      stepReview: "Review Order",
      back: "Back",
      next: "Next",
      confirmOrder: "Confirm Order",
      orderSummary: "Order Summary",
    },
    wishlist: {
      title: "My Wishlist",
      empty: "No items in your wishlist yet",
    },
    compare: {
      title: "Compare Products",
      subtitle: "Select up to 4 products",
      empty: "No products to compare yet",
    },
    account: {
      title: "My Account",
      profile: "Profile",
      orders: "Order History",
      addresses: "Addresses",
      myReviews: "My Reviews",
      myCoupons: "My Coupons",
    },
    footer: {
      aboutStore: "About the Store",
      customerService: "Customer Service",
      legal: "Legal",
      aboutUs: "About Us",
      howToOrder: "How to Order",
      contactUs: "Contact Us",
      paymentMethods: "Payment Methods",
      shipping: "Shipping",
      returns: "Return Policy",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      newsletterTitle: "Get promotions and new arrivals first",
      newsletterDesc: "Subscribe by email. No spam, unsubscribe anytime.",
      subscribe: "Subscribe",
      rightsReserved: "All rights reserved",
    },
  },
} as const;

export type Locale = keyof typeof dictionaries;

export const SUPPORTED_LOCALES: Locale[] = ["th", "en"];
export const DEFAULT_LOCALE: Locale = "th";
