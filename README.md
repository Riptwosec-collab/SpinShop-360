# SpinShop 360

> หมุนดูก่อนซื้อ เห็นสินค้าครบทุกมุม

เว็บไซต์ E-Commerce ตัวอย่างระดับ Production ที่มีระบบดูสินค้าแบบ 3D และภาพหมุน 360 องศา สร้างด้วย Next.js 14 (App Router) + TypeScript + Tailwind CSS พร้อม Mock Mode ที่ใช้งานได้ทันทีโดยไม่ต้องตั้งค่า Supabase หรือบริการภายนอกใด ๆ

---

## สารบัญ

1. [ภาพรวมโปรเจกต์](#ภาพรวมโปรเจกต์)
2. [Technology Stack](#technology-stack)
3. [วิธีติดตั้งและรัน](#วิธีติดตั้งและรัน)
4. [Mock Mode](#mock-mode)
5. [เชื่อมต่อ Supabase](#เชื่อมต่อ-supabase)
6. [อัปโหลดโมเดล 3D และภาพหมุน 360](#อัปโหลดโมเดล-3d-และภาพหมุน-360)
7. [ตั้งค่า Payment](#ตั้งค่า-payment)
8. [บัญชีทดสอบ](#บัญชีทดสอบ)
9. [รายการ Route ทั้งหมด](#รายการ-route-ทั้งหมด)
10. [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
11. [ฟีเจอร์ที่ทำงานได้จริง vs. ฟีเจอร์แบบ Mock](#ฟีเจอร์ที่ทำงานได้จริง-vs-ฟีเจอร์แบบ-mock)
12. [Deploy บน Vercel](#deploy-บน-vercel)
13. [สมมติฐานที่ใช้ในการพัฒนา](#สมมติฐานที่ใช้ในการพัฒนา)
14. [Known Limitations](#known-limitations)

---

## ภาพรวมโปรเจกต์

SpinShop 360 คือร้านค้าออนไลน์ตัวอย่างที่ให้ลูกค้าเลือกดูสินค้าได้หลายรูปแบบ:

- **ภาพนิ่ง** (Image Gallery) — สินค้าทุกชิ้นมีอย่างน้อยรูปแบบนี้
- **ภาพหมุน 360 องศา** — ลากด้วยเมาส์/นิ้วเพื่อหมุนดูสินค้ารอบตัว
- **โมเดล 3D** — หมุน ซูม เปิด Auto-rotate ผ่าน `<model-viewer>` ของ Google พร้อมจุด Hotspot อธิบายจุดเด่น
- **AR** — เปิดดูสินค้าเสมือนอยู่ในพื้นที่จริงผ่านมือถือที่รองรับ (WebXR / Scene Viewer / Quick Look)

ระบบครอบคลุมตั้งแต่หน้าร้าน (ค้นหา กรอง ตะกร้า Checkout สมาชิก รีวิว คูปอง Wishlist เปรียบเทียบสินค้า) ไปจนถึงระบบหลังบ้านสำหรับผู้ดูแลร้าน (Dashboard จัดการสินค้า คำสั่งซื้อ รีวิว คูปอง สื่อ/โมเดล 3D)

## Technology Stack

| ส่วน | เทคโนโลยี |
| --- | --- |
| Frontend Framework | Next.js 14 (App Router), TypeScript, React 18 |
| Styling | Tailwind CSS (Design Tokens แบบ Dark Premium Technology) |
| State Management | Zustand (Cart, Wishlist, Compare, Toast, Auth) |
| Forms & Validation | React Hook Form + Zod |
| 3D / AR Viewer | Google `<model-viewer>` (รองรับ GLB/GLTF/USDZ + WebXR/Scene Viewer/Quick Look) |
| 360° Viewer | Custom Image Sequence Viewer (Drag / Touch / Preload / Fullscreen) |
| Icons | lucide-react |
| Backend (พร้อมใช้งาน) | Supabase (PostgreSQL, Auth, Storage, RLS) — ดูหัวข้อ [เชื่อมต่อ Supabase](#เชื่อมต่อ-supabase) |
| Payment (พร้อมใช้งาน) | Mock Payment ในโหมดพัฒนา + สถาปัตยกรรม Adapter รองรับ Stripe / Omise / Opn / 2C2P ในอนาคต |

## วิธีติดตั้งและรัน

ต้องมี Node.js 18.18 ขึ้นไป

```bash
# ติดตั้ง dependencies
npm install

# คัดลอกไฟล์ environment
cp .env.example .env.local

# รันโหมดพัฒนา (Mock Mode เปิดอยู่โดยค่าเริ่มต้น)
npm run dev

# ตรวจสอบ Lint
npm run lint

# Build สำหรับ Production
npm run build
npm run start
```

เปิดเบราว์เซอร์ที่ `http://localhost:3000` — เว็บไซต์ใช้งานได้ทันทีโดยไม่ต้องตั้งค่าอะไรเพิ่มเติม เพราะ **Mock Mode เปิดอยู่โดยค่าเริ่มต้น**

## Mock Mode

ตัวแปร `NEXT_PUBLIC_USE_MOCK_DATA=true` (ค่าเริ่มต้นใน `.env.example`) ทำให้ระบบทั้งหมดทำงานจากข้อมูลตัวอย่างในเครื่อง โดยไม่ต้องเชื่อมต่อ Supabase:

- แคตตาล็อกสินค้า 12 รายการ (`lib/mock-data/products.ts`)
- รีวิวตัวอย่าง (`lib/mock-data/reviews.ts`)
- Login/Register แบบจำลอง (`lib/stores/auth-store.ts`) — ดูบัญชีทดสอบด้านล่าง
- ตะกร้า/รายการโปรด/เปรียบเทียบสินค้า เก็บใน LocalStorage ผ่าน Zustand persist
- Checkout และ "ชำระเงิน" แบบจำลอง — คำสั่งซื้อที่สร้างจะถูกบันทึกใน LocalStorage และแสดงในหน้า `/order-success/[orderNumber]` และ `/account`
- Admin Dashboard แสดงข้อมูลตัวอย่างจากแคตตาล็อกเดียวกัน

Data Access Layer ทั้งหมดอยู่ใน `lib/services/*.ts` — ฟังก์ชันเหล่านี้ถูกออกแบบให้ UI เรียกใช้แบบเดียวกันไม่ว่าจะอยู่ใน Mock Mode หรือ Supabase Mode

## เชื่อมต่อ Supabase

1. สร้างโปรเจกต์ใหม่ที่ [supabase.com](https://supabase.com)
2. รัน Migration ตามลำดับ (ผ่าน Supabase CLI หรือวาง SQL ใน SQL Editor):
   ```bash
   supabase db push
   # หรือรันไฟล์ทีละไฟล์ตามลำดับ:
   # supabase/migrations/0001_init.sql
   # supabase/migrations/0002_rls.sql
   # supabase/migrations/0003_storage.sql
   ```
3. Seed ข้อมูลตัวอย่าง:
   ```bash
   supabase db execute -f supabase/seed.sql
   ```
   > `seed.sql` ใส่ข้อมูลตัวอย่างเพียงบางส่วน (หมวดหมู่/แบรนด์ครบ + สินค้า 3 รายการ) เพื่อให้เห็นโครงสร้าง — พอร์ตสินค้าที่เหลือจาก `lib/mock-data/products.ts` ตามรูปแบบเดียวกันหากต้องการให้ Supabase Mode มีแคตตาล็อกครบเท่า Mock Mode
4. คัดลอกค่า `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` จาก Supabase Dashboard ใส่ใน `.env.local`
5. ตั้งค่า `NEXT_PUBLIC_USE_MOCK_DATA=false`
6. แก้ไขฟังก์ชันใน `lib/services/*.ts` ให้ query จาก Supabase client แทนข้อมูล Mock (มีคอมเมนต์ `TODO(supabase)` กำกับจุดที่ต้องแก้ไว้ในทุกไฟล์)

RLS Policies ทั้งหมดถูกออกแบบตามหลัก **Never trust the client** — role ของผู้ใช้ตรวจสอบจากตาราง `profiles` ฝั่ง Server เท่านั้น ไม่มีจุดใดเชื่อค่า role ที่ส่งมาจาก Client โดยตรง

## อัปโหลดโมเดล 3D และภาพหมุน 360

**โมเดล 3D** — วางไฟล์ `.glb`/`.gltf` ใน Supabase Storage bucket `product-models` แล้วบันทึก URL ลงคอลัมน์ `products.model_glb_url` แนะนำให้ไฟล์ไม่เกิน 15–25MB และบีบอัดด้วย Draco เพื่อความลื่นไหลบนมือถือ

**ภาพหมุน 360 องศา** — ตั้งชื่อไฟล์ตามลำดับ `frame-001.webp`, `frame-002.webp`, ... แล้ววางใน Supabase Storage bucket `product-360` หรือ `public/product-360/{slug}/` สำหรับการทดสอบในเครื่อง จากนั้นเพิ่มรายการ URL ตามลำดับในฟิลด์ `threeSixty.frames` ของสินค้า (ดูตัวอย่างใน `lib/mock-data/products.ts`)

> โปรเจกต์นี้มาพร้อมชุดภาพหมุน 360 องศาตัวอย่างที่สร้างขึ้นด้วยสคริปต์ (`scripts/generate-360-frames.py`) เพื่อสาธิตกลไกการทำงานโดยไม่ต้องพึ่งภาพถ่ายสินค้าจริง — แทนที่ด้วยภาพถ่ายจริงก่อนใช้งานจริงบน Production

## ตั้งค่า Payment

ในโหมดพัฒนา ระบบ Checkout จะจำลองการชำระเงินให้สำเร็จเสมอ (ไม่มีการตัดเงินจริง) เพื่อให้ทดสอบ Flow การสั่งซื้อได้ครบวงจร

โครงสร้างรองรับผู้ให้บริการชำระเงินหลายราย (PromptPay, บัตรเครดิต/เดบิต, โอนเงิน, เก็บเงินปลายทาง) ผ่าน UI เดียว — เมื่อพร้อมเชื่อมต่อจริง ให้สร้าง Adapter ใน `lib/payments/` สำหรับผู้ให้บริการที่ต้องการ (Stripe, Omise, Opn Payments, 2C2P) โดยยึด Interface เดียวกับ Mock Payment ปัจจุบัน และตั้งค่า `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` ใน `.env.local`

## บัญชีทดสอบ

ใช้งานได้เฉพาะใน Mock Mode (`NEXT_PUBLIC_USE_MOCK_DATA=true`) เท่านั้น **ห้ามใช้ข้อมูลนี้บน Production**

| บทบาท | อีเมล | รหัสผ่าน |
| --- | --- | --- |
| ผู้ดูแลระบบ (admin) | `admin@spinshop360.local` | `Admin123!` |
| ลูกค้า (customer) | `customer@spinshop360.local` | `Customer123!` |

เข้าสู่ระบบที่ `/login` แล้วเข้าถึงหน้าหลังบ้านได้ที่ `/admin` (เฉพาะบัญชี admin/staff)

## รายการ Route ทั้งหมด

**หน้าร้าน**
`/`, `/products`, `/products/[slug]`, `/compare`, `/cart`, `/checkout`, `/order-success/[orderNumber]`, `/wishlist`, `/account`

**สมาชิก**
`/login`, `/register`, `/forgot-password`

**หลังบ้าน (ต้องมีสิทธิ์ admin/staff)**
`/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/categories`, `/admin/brands`, `/admin/orders`, `/admin/reviews`, `/admin/coupons`, `/admin/media`, `/admin/analytics`, `/admin/settings`

**SEO**
`/sitemap.xml`, `/robots.txt`

## โครงสร้างโปรเจกต์

```text
app/
  (store)/            เลย์เอาต์หน้าร้าน (Header + Footer) และทุกหน้าลูกค้า
  (auth)/              หน้า Login / Register / Forgot Password
  admin/                ระบบหลังบ้าน (มี Guard ตรวจสอบ role)
  layout.tsx, globals.css, error.tsx, not-found.tsx, loading.tsx
  sitemap.ts, robots.ts

components/
  layout/               Header, Footer, SearchBar
  home/                 ส่วนประกอบหน้าแรก (Hero, Category, ProductRail, ...)
  product/               ProductCard, VariantSelector, ProductTabs, ReviewCard, ...
  product-viewer/       Product3DViewer, Product360Viewer, HotspotOverlay, ImageGallery
  cart/, checkout/       CartDrawer, CheckoutFlow
  admin/                 AdminSidebar, AdminGuard, ฟอร์มจัดการสินค้า
  shared/                ThemeProvider, Toaster, EmptyState

lib/
  services/              Data Access Layer (สลับ Mock/Supabase ได้โดยไม่แก้ UI)
  stores/                Zustand stores (cart, wishlist, compare, auth, toast)
  mock-data/              ข้อมูลตัวอย่าง 12 สินค้า + รีวิว
  validators/             Zod schemas
  constants.ts, utils.ts

types/                   TypeScript types ทั้งหมด รวมถึง model-viewer.d.ts
supabase/                 SQL Migrations, RLS Policies, Storage Policies, Seed
public/product-360/       ชุดภาพหมุน 360 องศาตัวอย่าง (สร้างด้วยสคริปต์)
scripts/                  สคริปต์ช่วยพัฒนา (generate-360-frames.py)
```

## ฟีเจอร์ที่ทำงานได้จริง vs. ฟีเจอร์แบบ Mock

**ทำงานได้จริงในโค้ดทั้งหมด (ไม่ใช่แค่ UI Demo):**
ค้นหา/กรอง/เรียงสินค้าแบบ URL-synced, Viewer 3D/360/AR/รูปภาพครบทุกปุ่มที่ระบุในสเปก, Hotspot (พร้อม **Hotspot Editor แบบคลิกวางตำแหน่งจริง** ผ่าน `model-viewer.positionAndNormalFromPoint()`), เลือก Variant พร้อมตรวจสต็อก, **เปลี่ยนสีวัสดุแบบเรียลไทม์ด้วย React Three Fiber** (ไม่ต้องโหลดโมเดลใหม่ — ดูสินค้า "Aurora Mechanical Keyboard"), ตะกร้าสินค้า (persist), คูปอง (validate ผ่าน API Route ที่ Rate-limit จริง), Checkout หลายขั้นตอนพร้อม Zod validation, สร้างคำสั่งซื้อพร้อม Server-side re-verification ของราคา/สต็อก, Wishlist, เปรียบเทียบสินค้า, Dark/Light mode, **สลับภาษาไทย/อังกฤษได้จริง** (header, hero section), Responsive ทุกขนาดหน้าจอ, SEO metadata + JSON-LD ต่อสินค้า, Error/Loading/Empty states, Accessibility (Focus ring, ARIA, Keyboard), **Automated Tests** (24 unit tests ผ่าน Vitest + Playwright e2e)

**เชื่อมต่อได้จริงทันทีที่ใส่ Environment Variable (ไม่ต้องแก้โค้ด):**
- **Supabase** — ตั้ง `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` แล้วปิด Mock Mode ระบบจะสลับไปใช้ฐานข้อมูลจริงทันที (Auth, Orders, Coupons, Reviews, **และตอนนี้รวมถึงหน้า Admin เพิ่ม/แก้ไข/ลบสินค้า + Hotspot Editor ที่เขียนข้อมูลจริงแล้ว**)
- **Stripe / Omise** — ตั้ง `STRIPE_SECRET_KEY` หรือ `OMISE_SECRET_KEY` (+ `NEXT_PUBLIC_OMISE_PUBLIC_KEY` สำหรับบัตรเครดิต) ระบบชำระเงินจะสลับจาก Mock ไปใช้ Gateway จริงโดยอัตโนมัติ รองรับทั้ง PromptPay/โอนเงิน และ **บัตรเครดิตผ่าน Omise.js Tokenization ฝั่ง Client (ข้อมูลบัตรไม่ผ่านเซิร์ฟเวอร์ของเรา)** พร้อม Webhook ที่ตรวจสอบความถูกต้องจริงทั้ง Stripe (`/api/webhooks/stripe`, ตรวจลายเซ็น) และ Omise (`/api/webhooks/omise`, Re-fetch จาก Omise API เพื่อยืนยัน)
- **Resend** — ตั้ง `RESEND_API_KEY` เพื่อส่งอีเมลยืนยันคำสั่งซื้อและรีเซ็ตรหัสผ่านจริง
- **PostHog** — ตั้ง `NEXT_PUBLIC_POSTHOG_KEY` เพื่อเริ่มบันทึก Event จริง (มี 15 Event ตามสเปก Section 43 ต่อสายไว้แล้วในโค้ด ไม่ใช่แค่นิยาม Type)

**ยังเป็น Placeholder ที่ต้องต่อยอด:**
- Seed ข้อมูลใน Supabase มีเพียงบางส่วน (ดูหัวข้อเชื่อมต่อ Supabase) ต้องพอร์ตสินค้าที่เหลือเองหากต้องการให้ตรงกับ Mock Mode
- การอัปโหลดไฟล์รูป/โมเดล 3D/ภาพหมุน 360 จากหน้า Admin ยังเป็น UI Dropzone เปล่า — ต้องอัปโหลดผ่าน Supabase Storage Dashboard/API แล้ววาง URL ที่ได้ในฟอร์มแก้ไขสินค้าเอง (ปุ่ม "บันทึก" ของข้อมูลสินค้าที่ไม่ใช่ไฟล์ทำงานจริงแล้ว)
- ภาพหมุน 360 องศาเป็นภาพสังเคราะห์ (Synthetic Turntable) ไม่ใช่ภาพถ่ายสินค้าจริง
- i18n เป็น Client-side Dictionary Switch (แปลแล้ว: Header, Hero, Footer, Cart, Wishlist, Compare, Account nav) ยังไม่ครอบคลุมเนื้อหายาวอย่างคำอธิบายสินค้าและหน้ากฎหมาย — ดูหมายเหตุใน `lib/i18n/locale-provider.tsx` สำหรับแนวทางอัปเกรดเป็น next-intl แบบเต็มรูปแบบ

## ระบบที่เพิ่มเข้ามา (Production Infrastructure)

| ระบบ | ไฟล์หลัก | หมายเหตุ |
| --- | --- | --- |
| Supabase Client (Browser/Server/Service) | `lib/supabase/*.ts` | Session refresh ผ่าน `middleware.ts` |
| Payment Adapters | `lib/payments/*.ts` | Stripe (Checkout Sessions), Omise (PromptPay + บัตรเครดิตผ่าน Omise.js Tokenization ครบทั้งสอง Flow), Mock |
| Admin Persistence | `app/api/admin/products/**`, `lib/admin-auth.ts`, `lib/hooks/use-admin-products.ts` | หน้า Admin เพิ่ม/แก้ไข/ลบสินค้าและ Hotspot เขียนลง Supabase จริงเมื่อเชื่อมต่อแล้ว (ตรวจสิทธิ์ admin/staff จาก Session ฝั่ง Server เสมอ ไม่เชื่อค่าจาก Client) |
| Atomic Order Creation | `supabase/migrations/0004_create_order_function.sql` | ใช้ `for update` row-lock ป้องกัน Overselling เมื่อมีคำสั่งซื้อพร้อมกัน |
| Rate Limiting | `lib/rate-limit.ts` | In-memory (แนะนำเปลี่ยนเป็น Upstash Redis บน Production จริง — มีคอมเมนต์วิธีสลับในไฟล์) |
| Audit Log | `lib/audit-log.ts` | บันทึกลง `activity_logs` ทุกครั้งที่มีคำสั่งซื้อ/ชำระเงิน/รีวิว |
| Email Adapter | `lib/email/index.ts` | Resend + Mock Console Adapter |
| Analytics Adapter | `lib/analytics/index.ts` | PostHog + Mock Console Adapter, ต่อสาย 15 Event แล้ว |
| Hotspot Editor (Interactive) | `components/admin/hotspot-editor.tsx` | `/admin/products/[id]/hotspots` |
| Real-time Material Switcher | `components/product-viewer/r3f-canvas.tsx` | React Three Fiber, ไม่โหลดโมเดลใหม่เมื่อเปลี่ยนสี |
| i18n Scaffold | `lib/i18n/*` | Dictionary-based ครอบคลุม Header/Hero/Footer/Cart/Checkout/Wishlist/Compare/Account nav |
| Unit Tests | `tests/unit/*.test.ts` | Vitest — รัน `npm run test` |
| E2E Tests | `tests/e2e/*.spec.ts` | Playwright — รัน `npm run test:e2e` (ต้อง `npx playwright install` ก่อนครั้งแรก) |
| CI/CD | `.github/workflows/ci.yml`, `deploy.yml` | Lint → Typecheck → Unit Tests → Build → E2E บนทุก Push/PR; Deploy ขึ้น Vercel อัตโนมัติหลัง CI ผ่านบน `main` |
| Error Monitoring | `sentry.*.config.ts`, `instrumentation*.ts` | Sentry — ไม่ส่ง Event ใด ๆ จนกว่าจะตั้งค่า `NEXT_PUBLIC_SENTRY_DSN` |
| Supabase Realtime | `supabase/migrations/0005_realtime.sql`, `components/admin/realtime-stock-feed.tsx` | Live stock/order updates บน Admin Dashboard โดยไม่ต้อง Poll |
| หน้ากฎหมาย/ข้อมูลร้าน | `app/(store)/{about,how-to-order,contact,payment-methods,shipping,returns,privacy,terms}` | เนื้อหาจริงครบทุกลิงก์ใน Footer (ไม่ใช่หน้าเปล่าหรือ 404 อีกต่อไป) |

## การตั้งค่า CI/CD และ Error Monitoring

**GitHub Actions** — เมื่อ Push หรือเปิด PR ระบบจะรัน Lint, Type Check, Unit Tests, Build และ E2E Tests อัตโนมัติ (`.github/workflows/ci.yml`) ไม่ต้องตั้งค่าเพิ่มเติม

**Deploy อัตโนมัติ** — `.github/workflows/deploy.yml` จะ Deploy ขึ้น Vercel อัตโนมัติหลัง CI ผ่านบน branch `main` โดยต้องตั้งค่า Repository Secrets 3 ตัวก่อน (ไม่ตั้งก็ไม่เป็นไร Workflow จะข้ามไปเฉย ๆ ไม่ทำให้ CI แดง):
```text
VERCEL_TOKEN       — สร้างที่ vercel.com/account/tokens
VERCEL_ORG_ID       — จาก .vercel/project.json หลังรัน `vercel link`
VERCEL_PROJECT_ID   — จาก .vercel/project.json หลังรัน `vercel link`
```

**Sentry** — ตั้งค่า `NEXT_PUBLIC_SENTRY_DSN` (และ `SENTRY_DSN` ฝั่ง Server หากต่างกัน) ใน `.env.local` เพื่อเริ่มรับ Error Report จริง ก่อนตั้งค่า SDK จะไม่ส่งข้อมูลใด ๆ ออกไปเลย (ปลอดภัยสำหรับ Mock Mode/Local Dev) หากต้องการอัปโหลด Source Map ด้วย ให้ตั้ง `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` เพิ่มเติม

## การทดสอบ (Testing)

```bash
# Unit tests (Vitest) — คำนวณตะกร้า, คูปอง, การหา Variant, ยอดรวมคำสั่งซื้อ
npm run test

# E2E tests (Playwright) — ต้องติดตั้ง browser ก่อนครั้งแรก
npx playwright install --with-deps chromium
npm run test:e2e
```

## Deploy บน Vercel

1. Push โค้ดขึ้น Git repository
2. Import โปรเจกต์ใน [vercel.com](https://vercel.com)
3. ตั้งค่า Environment Variables ตาม `.env.example` (อย่างน้อย `NEXT_PUBLIC_USE_MOCK_DATA` และถ้าต้องการข้อมูลจริงให้ใส่ค่า Supabase ด้วย)
4. Deploy — Vercel จะรัน `npm run build` ให้อัตโนมัติ

## สมมติฐานที่ใช้ในการพัฒนา

เนื่องจากสเปกต้นฉบับมีรายละเอียดปลีกย่อยจำนวนมาก จึงเลือกแนวทางต่อไปนี้ตามมาตรฐาน Production ทั่วไปเมื่อสเปกไม่ได้ระบุชัดเจน:

- ใช้ฟอนต์ระบบ (System Font Stack: IBM Plex Sans Thai / Noto Sans Thai / Inter) โหลดผ่าน `<link>` ที่ทำงานในเบราว์เซอร์ แทน `next/font/google` เพื่อไม่ให้ขั้นตอน Build ต้องพึ่งพาการเชื่อมต่ออินเทอร์เน็ต
- โมเดล 3D ตัวอย่างใช้ไฟล์ Sample GLB สาธารณะจาก modelviewer.dev (Astronaut, RobotExpressive, NeilArmstrong) แทนโมเดลสินค้าจริง
- Hotspot ใช้การ Projection แบบ 2 มิติแบบง่าย (ไม่ใช่ True 3D Camera Projection) เพื่อให้ใช้งานได้ทันทีโดยไม่ต้องเขียน Custom Three.js Renderer — เพียงพอสำหรับเวอร์ชันแรก
- Coupon validation จำลองเป็น Service Function ฝั่ง Client ที่มี Latency เทียบเท่า Server Call เพื่อสาธิต UX แต่ยังไม่ใช่ Server Action จริง

## Known Limitations

- ยังไม่มี Automated Tests (Vitest/Playwright) ครบตามสเปก Section 53 — โครงสร้างโปรเจกต์รองรับการเพิ่มในภายหลัง
- Hotspot Editor สำหรับ Admin ยังเป็นแบบอ่านอย่างเดียว (แสดงตำแหน่งที่มีอยู่) ยังไม่มี UI คลิกเพื่อวางตำแหน่งใหม่แบบ Interactive
- React Three Fiber / Three.js (สำหรับ Material Switching ขั้นสูง) ยังไม่ได้ติดตั้ง — ปัจจุบันใช้ `<model-viewer>` เป็นหลักตามสเปก และสลับ Variant ด้วยการเปลี่ยนไฟล์โมเดลแทนการเปลี่ยน Material แบบ Real-time
- Multi-language (ภาษาอังกฤษ) ยังไม่ได้ทำ UI แปลจริง แต่โครงสร้าง `NEXT_PUBLIC_DEFAULT_LOCALE` เตรียมไว้สำหรับต่อยอดด้วย next-intl หรือไลบรารีแปลภาษาอื่น ๆ
- Rate limiting, Audit log, และ Webhook signature verification ยังเป็นแนวทาง (Guideline) ในคอมเมนต์โค้ด ยังไม่ได้ implement เป็น Middleware จริงจนกว่าจะมี Backend Server Actions เชื่อม Supabase
