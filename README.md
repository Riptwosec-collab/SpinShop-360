# SpinShop 360

> หมุนดูก่อนซื้อ เห็นสินค้าครบทุกมุม

SpinShop 360 เป็นตัวอย่าง E-Commerce ด้วย Next.js ที่รองรับรูปสินค้า, ภาพหมุน 360°, โมเดล 3D, AR, ตัวเลือกสินค้า, ตะกร้า, Checkout, คูปอง, รีวิว และระบบหลังบ้าน

โปรเจกต์มี 2 โหมด:

- **Mock Mode** — เปิดใช้งานในเครื่องได้ทันที ไม่ต้องมีฐานข้อมูลหรือ Payment Gateway
- **Supabase Mode** — ใช้ Supabase Auth/PostgreSQL/Storage/RLS พร้อม Stripe หรือ Omise สำหรับระบบจริง

> การที่ Build ผ่านไม่ได้หมายความว่าพร้อมรับเงินจริงทันที โปรดทำตาม [`docs/PRODUCTION_CHECKLIST.md`](docs/PRODUCTION_CHECKLIST.md) ให้ครบก่อนเปิด Production

## Technology stack

| ส่วน | เทคโนโลยี |
| --- | --- |
| Web | Next.js 14 App Router, React 18, TypeScript |
| UI | Tailwind CSS, Lucide Icons |
| State | Zustand |
| Forms | React Hook Form, Zod |
| Database/Auth/Storage | Supabase |
| 3D/AR | Google `<model-viewer>`, React Three Fiber |
| Payment | Stripe Checkout, Omise/Opn, COD, Mock Adapter |
| Analytics | PostHog Adapter |
| Monitoring | Sentry |
| Tests | Vitest, Playwright |
| CI/CD | GitHub Actions, Vercel |

## Requirements

- Node.js 22 (`.nvmrc`)
- npm
- Supabase CLI สำหรับ Supabase Mode
- บัญชี Stripe หรือ Omise สำหรับการรับเงินจริง

## Quick start — Mock Mode

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

เปิด `http://localhost:3000`

ค่าเริ่มต้นใน `.env.example` คือ:

```text
NEXT_PUBLIC_USE_MOCK_DATA=true
ALLOW_MOCK_PAYMENTS=false
```

Mock Mode ใช้ข้อมูลตัวอย่างและ LocalStorage จึงเหมาะกับการทดสอบ UI เท่านั้น

บัญชีทดสอบจะแสดงในหน้า Login เฉพาะ Development:

| บทบาท | อีเมล | รหัสผ่าน |
| --- | --- | --- |
| Admin | `admin@spinshop360.local` | `Admin123!` |
| Customer | `customer@spinshop360.local` | `Customer123!` |

## Quality checks

```bash
npm run lint
npm run test
npm run build
```

Pull Request และ Push จะรัน:

1. Production dependency audit
2. ESLint
3. Unit tests
4. Next.js production build

ผ่าน `.github/workflows/ci.yml`

## Supabase Mode

### 1. สร้างโปรเจกต์และเชื่อม Supabase CLI

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Apply migrations

```bash
supabase db push
```

Migration สำคัญล่าสุด:

- `0006_security_order_payment_hardening.sql`
- `0007_reservation_expiry_integrity.sql`

Migration เหล่านี้เพิ่ม least-privilege policies, trusted order RPC, stock reservation, payment finalization และ cleanup ของ Order ที่หมดเวลาชำระ

ควร Backup และทดสอบกับ Staging ก่อน Production

### 3. Seed ข้อมูลตัวอย่าง

```bash
supabase db execute -f supabase/seed.sql
```

Seed มีสินค้าเพียงบางส่วน สามารถเพิ่มข้อมูลผ่าน Admin หรือ SQL ตาม schema ได้

### 4. Environment

กำหนดอย่างน้อย:

```text
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CHECKOUT_SIGNING_SECRET=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=https://your-domain.example
```

สร้าง Secret แบบสุ่ม:

```bash
openssl rand -base64 48
```

ห้ามตั้ง Service Role, Payment Secret, Webhook Secret, Checkout Secret หรือ Cron Secret ด้วย prefix `NEXT_PUBLIC_`

## Catalog data layer

`lib/services/products.ts` รองรับทั้ง Mock และ Supabase โดยใช้ interface เดียวกัน

Supabase Mode โหลด:

- Products
- Brands/Categories
- Images
- Variants และ Option Values
- 360 Frames
- Hotspots
- Approved review summary

Public catalog ใช้ Anon key และถูกจำกัดด้วย RLS ส่วนการเขียนข้อมูลหลังบ้านใช้ Server API และตรวจ Role จากฐานข้อมูล

## Checkout security model

ระบบจริงไม่เชื่อค่าจาก Browser สำหรับ:

- ราคา
- ส่วนลด
- ค่าจัดส่ง
- ยอดชำระ
- สกุลเงิน
- Product/Variant relationship
- สต็อก

Order RPC จะ:

1. รวมรายการ Variant ซ้ำ
2. Lock แถวที่เกี่ยวข้อง
3. ตรวจสต็อกหลังหัก Reservation ที่ยัง Active
4. คำนวณราคา/คูปอง/ค่าจัดส่งฝั่ง Database
5. ตัดสต็อกทันทีสำหรับ COD
6. จองสต็อก 30 นาทีสำหรับ Online Payment

Payment Gateway จะถูกเรียกด้วยยอด `grand_total` จากฐานข้อมูลเท่านั้น

Webhook ต้องยืนยัน Provider และตรวจ Amount/Currency/Order/Reservation ก่อนเรียก `finalize_paid_order`

Guest Checkout ใช้ Signed HttpOnly cookies แบบมีอายุสำหรับ:

- เริ่มชำระเงิน
- เปิดรายละเอียด Order ที่เพิ่งสร้าง

## Stripe

ตั้งค่า:

```text
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Webhook endpoint:

```text
https://YOUR_DOMAIN/api/webhooks/stripe
```

Events ขั้นต่ำ:

- `checkout.session.completed`
- `payment_intent.payment_failed`
- `charge.refunded`

Stripe adapter รองรับ Card และ PromptPay ตามการตั้งค่าบัญชี ไม่ใช้ generic bank-transfer flow

## Omise / Opn

ตั้งค่า:

```text
OMISE_SECRET_KEY=
NEXT_PUBLIC_OMISE_PUBLIC_KEY=
```

Webhook endpoint:

```text
https://YOUR_DOMAIN/api/webhooks/omise
```

Omise webhook ไม่มีการเชื่อ Payload ตรง ๆ ระบบจะนำ Charge ID ไปเรียก Omise API ซ้ำก่อนเปลี่ยนสถานะ Order

## Email และ Contact Form

ตั้งค่า:

```text
RESEND_API_KEY=
RESEND_FROM_EMAIL="SpinShop 360 <orders@your-domain.example>"
CONTACT_TO_EMAIL="support@your-domain.example"
```

Production จะไม่แสดงผล “ส่งสำเร็จ” หากระบบอีเมลยังไม่ได้ตั้งค่า

## Reservation cleanup

`vercel.json` ตั้ง Daily Cron ไปที่:

```text
/api/cron/release-stock
```

Endpoint ตรวจ `Authorization: Bearer <CRON_SECRET>` และทำหน้าที่:

- Expire stock reservations
- Cancel unpaid online orders
- คืน Coupon usage ของ Order ที่หมดเวลา

แม้ Cron ยังไม่รัน Reservation ที่หมดอายุแล้วจะไม่ถูกนับในการตรวจ Available stock

## Admin authorization

- Mock Mode ใช้ Zustand guard เพื่อสาธิต UI
- Supabase Mode ตรวจ Session และ `profiles.role` ใน Server Layout
- Admin API ตรวจ Role จากฐานข้อมูลอีกครั้ง
- Client-side guard ไม่ถือเป็น Security boundary

## 3D, 360 และ AR assets

### 3D

รองรับ GLB/GLTF และ USDZ ผ่าน `<model-viewer>`

แนะนำ:

- Draco/Meshopt compression
- KTX2 textures
- Poster image
- ขนาดไฟล์เหมาะกับมือถือ

### 360

ตั้งชื่อไฟล์เรียงลำดับ เช่น:

```text
frame-001.webp
frame-002.webp
frame-003.webp
```

Viewer จะแสดง Frame แรกก่อน แล้วทยอย preload Frame ที่เหลือ พร้อม Keyboard controls และ reduced-motion support

## Main routes

### Store

- `/`
- `/products`
- `/products/[slug]`
- `/cart`
- `/checkout`
- `/wishlist`
- `/compare`
- `/account`
- `/order-success/[orderNumber]`
- `/contact`

### Authentication

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

### Admin

- `/admin`
- `/admin/products`
- `/admin/orders`
- `/admin/categories`
- `/admin/reviews`
- `/admin/coupons`
- `/admin/media`
- `/admin/analytics`
- `/admin/settings`

## Project structure

```text
app/                    Pages, layouts and API routes
components/             Storefront, checkout, admin and viewer components
lib/                    Services, stores, validators, payments, analytics
supabase/migrations/    Database schema, RLS and trusted RPCs
tests/                  Vitest and Playwright tests
types/                  Application and Supabase types
docs/                   Production rollout documentation
```

## Known operational work before real launch

- Apply migrations to a real Staging Supabase project and run integration tests
- Configure provider test-mode webhooks
- Replace the in-memory rate limiter with shared Redis for multi-instance traffic
- Replace demonstration imagery and external sample models
- Verify legal, privacy, tax, return, payment and shipping content for the merchant
- Test iOS Safari/Quick Look and Android Chrome/Scene Viewer on real devices
- Regenerate `types/database.ts` from the linked Supabase project after migrations

## Security

See:

- [`SECURITY.md`](SECURITY.md)
- [`docs/PRODUCTION_CHECKLIST.md`](docs/PRODUCTION_CHECKLIST.md)

Never commit secrets or test payment flows with real customer credentials.
