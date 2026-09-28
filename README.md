# SpinShop 360

ร้านค้าตัวอย่าง Next.js 14 + React 18 + TypeScript พร้อม 3D/360, ภาษาไทย–อังกฤษ และโหมดข้อมูลจริงผ่าน Supabase

## เริ่มต้น

ใช้ Node.js 22 และ npm:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

เปิด http://localhost:3000 ค่าเริ่มต้น `NEXT_PUBLIC_USE_MOCK_DATA=true` ใช้สินค้าตัวอย่าง บัญชีทดสอบ และออเดอร์ในเบราว์เซอร์ **ไม่มีการตัดเงินจริง**

- ลูกค้าทดสอบ: `customer@spinshop360.local` / `Customer123!`
- ผู้ดูแลทดสอบ: `admin@spinshop360.local` / `Admin123!`
- ฟอร์มติดต่อและสมัครข่าวสารต้องมีฐานข้อมูลก่อนจึงบันทึกได้ แม้ในโหมดสาธิต; ไม่มีการแสดงสำเร็จปลอม

## สิ่งที่ใช้งานได้

- ธีมสว่าง/มืด navy–cyan, ฟอนต์ไทยในแอป, responsive navigation, keyboard search, filter chips และตะกร้า
- Catalog, ค้นหา, แบรนด์, หมวดหมู่, สินค้าที่เกี่ยวข้อง, Wishlist และ Compare ใช้แหล่งข้อมูลตามโหมด
- Supabase login/signup, email confirmation, password recovery, SSR session refresh และ sign-out
- ราคาชำระเงินอ้างอิงออเดอร์ในฐานข้อมูล ตรวจเจ้าของออเดอร์/สิทธิ์ guest และใช้ reservation ถาวรป้องกันการตัดเงินซ้ำ
- Stripe/Omise webhooks ตรวจแหล่งที่มา จำนวนเงิน สกุลเงิน และลำดับสถานะก่อนเปลี่ยนออเดอร์
- ฟอร์มติดต่อบันทึก `contact_messages`; ข่าวสารบันทึก `newsletter_subscribers` พร้อมความยินยอมและ rate limit ในฐานข้อมูล
- Timeline ออเดอร์/เลขพัสดุ/ซื้อซ้ำด้วยราคาและสต๊อกปัจจุบัน
- Interactive Studio ซิงก์สี/variant กับตัวเลือกซื้อ แสดงขนาด cm/in เมื่อมีข้อมูล และมีรูปสำรองเมื่อ 3D โหลดไม่ได้
- PWA ติดตั้งได้ มีหน้า offline; ไม่เก็บหน้า account, order, checkout, admin, auth หรือ API ลง cache
- ไทย–อังกฤษสำหรับข้อความ UI, ฟอร์ม, ข้อผิดพลาด และสถานะสินค้า/ออเดอร์ ข้อมูลที่ลูกค้ากรอกเองไม่ถูกแปล

## เปิดใช้ข้อมูลจริง

1. สร้าง Supabase project แยกสำหรับทดสอบก่อนเปิดใช้จริง
2. ใช้ Supabase CLI ตรวจ `supabase --help` แล้วเชื่อม project และรัน migrations **ทั้งหมดตามลำดับ** ใน `supabase/migrations/` ด้วย `supabase db push` ตรวจรายการ migration ที่จะรันก่อนยืนยัน
3. สำหรับฐานข้อมูลใหม่ ใส่ข้อมูลเริ่มต้นจาก `supabase/seed.sql` หรือเพิ่มสินค้าผ่านหลังบ้าน ข้อมูล seed เป็นตัวอย่าง ไม่ใช่สินค้าจริงของร้าน
4. ตั้งค่า `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (หรือ legacy anon key), `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL` เป็น HTTPS domain ของเว็บ และ `NEXT_PUBLIC_USE_MOCK_DATA=false`
5. ใน Supabase Auth ตั้ง Site URL และ Redirect URLs ให้ตรงกับ `/api/auth/callback`, `/api/auth/callback?next=/reset-password`, `/api/auth/confirm` และ `/reset-password`; เปิด email confirmation และตั้งผู้ส่งอีเมลจริง
6. ทดสอบสมัคร → ยืนยันอีเมล → เข้า/ออกระบบ → ลืมรหัสผ่าน → ตั้งรหัสใหม่ใน environment ทดสอบก่อน

`service_role` เป็นความลับฝั่งเซิร์ฟเวอร์ ห้ามใช้ชื่อที่ขึ้นต้น `NEXT_PUBLIC_` บทบาทผู้ใช้มาจากตาราง `profiles` เท่านั้น ผู้ใช้ทั่วไปแก้ `role` ของตัวเองไม่ได้ การตั้ง admin/staff ให้ทำจากเครื่องมือดูแลฐานข้อมูลที่เชื่อถือได้

Migration ใหม่เพิ่ม field สำหรับ catalog, inbox/newsletter, tracking, guest capability และ payment reservation/event ledger รวมถึงปิดสิทธิ์เขียนออเดอร์ตรงจาก browser อย่า deploy โค้ด real mode ก่อน migrations สำเร็จ

## ตั้งค่าชำระเงิน

เลือก gateway เพียงหนึ่งตัวและเริ่มด้วย test/sandbox credentials:

- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` และ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`; webhook URL `/api/webhooks/stripe` ให้รับ `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `payment_intent.payment_failed`, `charge.refunded` การยืนยันจ่ายสำเร็จต้องมีสถานะชำระเงินแล้วจริง รองรับวิธีชำระเงินที่เปิดใน Stripe Dashboard
- **Omise:** `OMISE_SECRET_KEY`, `NEXT_PUBLIC_OMISE_PUBLIC_KEY`; webhook URL `/api/webhooks/omise` ตัว handler อ่าน charge จาก Omise API ซ้ำด้วย server key ก่อนเชื่อถือสถานะ รองรับ PromptPay และบัตรตามการตั้งค่าบัญชี
- ไม่ตั้ง gateway ใน real mode ระบบแจ้งไม่พร้อมใช้งาน ไม่จำลองว่าจ่ายเงินสำเร็จ
- ราคาที่ browser ส่งมาไม่ถูกใช้ตัดเงิน API รับเพียง `orderId` (และ card token สำหรับ Omise) server อ่านยอด/อีเมล/วิธีชำระจากออเดอร์
- หน้าชำระเงินเก็บคำขอและ nonce ใน sessionStorage ของแท็บเดิมเพื่อกู้คืนหลังรีเฟรช/กลับจาก gateway (ไม่เก็บข้อมูลบัตรหรือ token) และให้ยืนยันยอดจากฐานข้อมูลก่อนเรียกชำระเงิน หากปิดแท็บหรือใช้เบราว์เซอร์อื่น ให้ตรวจสถานะออเดอร์เดิมก่อนเริ่มใหม่
- โหมดจริงรองรับ PromptPay/บัตรตาม gateway และเก็บเงินปลายทาง; ซ่อนการโอนธนาคารจนกว่าจะมีระบบยืนยันการโอน
- คำขอสร้างออเดอร์ใช้ `Idempotency-Key` แบบ UUID; คำขอเดิมซ้ำใช้ออเดอร์เดิม การชำระเงินมี reservation เดียวต่อออเดอร์ ไม่เริ่ม charge ใหม่เมื่อคำตอบจาก gateway ไม่แน่นอน
- ออเดอร์ guest ใช้ cookie HttpOnly ที่หมดอายุ 24 ชั่วโมง เปิดดูในเบราว์เซอร์เดิม; ไม่เปิดข้อมูลด้วยการรู้เลขออเดอร์อย่างเดียว
- หากชำระเงินไม่สำเร็จหรือไม่ทราบผล ให้ตรวจ gateway และสถานะออเดอร์เดิมก่อนดำเนินการต่อ ระบบไม่สร้าง charge ใหม่ให้อัตโนมัติ การคืนเงินทำใน gateway และใช้ webhook ปรับสถานะ ยังไม่มีปุ่ม refund ในหลังบ้าน

ก่อนใช้งานเงินจริง ให้ทดสอบ webhook ซ้ำ, จำนวนเงินผิด, จ่ายแบบ async, การเชื่อมต่อขาด และ refund ด้วยบัญชีทดสอบของร้าน ผลทดสอบใน repository ไม่ยืนยันว่า credentials/webhook URL ของร้านตั้งค่าถูกต้องแล้ว

## ฟอร์ม ข้อมูลจัดส่ง และอีเมล

- ข้อความติดต่อเก็บใน `contact_messages` ทีมร้านอ่านจาก Supabase Dashboard; ยังไม่มีระบบ inbox ส่งต่ออีเมลอัตโนมัติ
- รายชื่อข่าวสารเป็นการบันทึกความยินยอม ไม่ได้ส่งแคมเปญอีเมลอัตโนมัติ ต้องมีขั้นตอน unsubscribe ก่อนนำรายชื่อไปส่งข่าวสารจริง
- โฮสต์ต้องแทนที่ header `x-forwarded-for` ด้วย IP ที่เชื่อถือได้ เพื่อให้ rate limit ฟอร์มมีผล
- Timeline ใช้สถานะออเดอร์และ `tracking_number`, `tracking_carrier`, `shipped_at`, `delivered_at` ที่ทีมร้านบันทึก ไม่มีการดึงข้อมูลบริษัทขนส่งอัตโนมัติ
- อีเมลยืนยันออเดอร์เปิดได้ด้วย Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`) ถ้าไม่ตั้งค่าจะใช้ console adapter ในโหมดพัฒนา

## 3D และ PWA

โมเดลสาธิตคีย์บอร์ด โทรศัพท์ เก้าอี้ และหุ่นยนต์อยู่ใน `public/models/demo/` และโหลดจากเว็บเดียวกัน ไม่มี texture/decoder ภายนอก สร้างซ้ำด้วย `node scripts/generate-demo-models.mjs` โมเดลเหล่านี้เป็นรูปทรงประกอบการสาธิต ไม่ใช่ scan ของสินค้าจริง ใส่ GLB และภาพสินค้าจริงก่อนเปิดขาย dimensions มาจากข้อมูลสินค้า ไม่ใช่การวัดโมเดล

เอา AR ออกจากตัว viewer, ตัวกรอง, badge และหลังบ้านแล้ว คอลัมน์ AR เดิมยังคงไว้เพื่อไม่ทำลายข้อมูลเก่า แต่ไม่มีการเปิดใช้งาน AR ในแอป

Service worker เปิดเฉพาะ production บน secure context (HTTPS หรือ localhost) cache เฉพาะ `/offline.html` และไอคอน ไม่เก็บข้อมูลสินค้าหรือข้อมูลลูกค้าแบบออฟไลน์ บน iPhone ใช้ Safari → Share → Add to Home Screen

## ทดสอบและ CI

```bash
npm run lint
npm run typecheck
npm test
npm run test:db
npm run build
npx playwright install --with-deps chromium
PLAYWRIGHT_USE_BUILD=1 npm run test:e2e
```

`test:db` รัน PostgreSQL ผ่าน PGlite กับ migrations จริง มี stubs เฉพาะบริการ Supabase ภายนอก ดูข้อจำกัดใน `tests/database/README.md` ไม่ใช่การทดสอบ Supabase project ที่เปิดใช้งานจริง

Playwright รองรับ `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` เพื่อใช้ Chromium ที่ติดตั้งไว้

`.github/workflows/ci.yml` ตรวจ lint/typecheck/unit/SQL/build/browser บน PR และ push โดยไม่ใช้ production secrets ตั้ง branch protection ให้ CI ผ่านก่อน merge ตามนโยบายของ repository

## Deployment และ rollback

โค้ดนี้ไม่ได้สร้างหรือ deploy production ให้อัตโนมัติ สามารถเชื่อม repository กับผู้ให้บริการ Next.js ที่ใช้อยู่ และตั้ง environment variables ที่ระบุด้านบน อย่าเปิดใช้งาน gateway จริงจนผ่านการทดสอบ sandbox ของร้าน

ก่อน migrate ฐานข้อมูลเดิม ให้สำรองข้อมูลและทดสอบบน staging หากต้อง rollback UI ให้ย้อน commit แอป ส่วน migration ที่เพิ่มข้อมูลการชำระเงินไม่ควรถูกลบหลังเริ่มรับออเดอร์ ให้คง audit/payment ledger และใช้ forward-fix ของ schema

## โครงสร้าง

`app/` routes/API · `components/` UI · `lib/services/` catalog/order/forms · `lib/payments/` gateway + authorization · `lib/i18n/` authored TH/EN copy · `supabase/migrations/` schema/RLS · `tests/` unit/SQL/browser

หน้าหลังบ้านบางส่วน เช่น dashboard analytics และการจัดการคูปอง/รีวิว ยังคงเป็นตัวอย่างเดิม งานรอบนี้ไม่ได้เปลี่ยนทุกหน้าหลังบ้านให้เป็นระบบธุรกรรมเต็มรูปแบบ ไม่มีการรับรอง compliance หรือระบบขนส่ง/แคมเปญอีเมลสำเร็จรูป
