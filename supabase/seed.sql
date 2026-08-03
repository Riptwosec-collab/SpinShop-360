-- ============================================================================
-- SpinShop 360 — Seed data
-- Run with: supabase db execute -f supabase/seed.sql  (after migrations)
--
-- NOTE: This seeds a representative subset (categories, brands, and 3 sample
-- products with variants/images/hotspots) so a fresh Supabase project has
-- something to browse immediately. The full 12-product catalog used by
-- NEXT_PUBLIC_USE_MOCK_DATA=true lives in `lib/mock-data/products.ts` —
-- port the remaining entries here following the same pattern if you want
-- Supabase mode to match Mock Mode exactly.
-- ============================================================================

insert into categories (name, slug, sort_order) values
  ('โทรศัพท์และแท็บเล็ต', 'phones-tablets', 1),
  ('คอมพิวเตอร์', 'computers', 2),
  ('อุปกรณ์เกมมิง', 'gaming', 3),
  ('หูฟังและลำโพง', 'audio', 4),
  ('รองเท้า', 'shoes', 5),
  ('กระเป๋า', 'bags', 6),
  ('เฟอร์นิเจอร์', 'furniture', 7),
  ('ของแต่งบ้าน', 'home-decor', 8),
  ('ฟิกเกอร์และของสะสม', 'collectibles', 9);

insert into brands (name, slug) values
  ('Vertex', 'vertex'),
  ('Aurora', 'aurora'),
  ('Nimbus Audio', 'nimbus-audio'),
  ('Halo', 'halo');

-- Sample product #1: Vertex Pro Gaming Mouse (360° viewer, color variants)
with cat as (select id from categories where slug = 'gaming'),
     brand as (select id from brands where slug = 'vertex')
insert into products (
  name, slug, short_description, description, brand_id, category_id, status,
  base_price, compare_at_price, sku, stock_quantity, low_stock_threshold,
  is_featured, is_bestseller, supports_3d, supports_360, supports_ar,
  fallback_image_url, published_at
)
select
  'Vertex Pro Gaming Mouse', 'vertex-pro-gaming-mouse',
  'เมาส์เกมมิงน้ำหนักเบา เซนเซอร์ความแม่นยำสูง',
  'Vertex Pro ออกแบบมาสำหรับเกมเมอร์สาย FPS ด้วยเซนเซอร์ออปติคัลความละเอียดสูง ปุ่มกดตอบสนองไว น้ำหนักเบาเพียง 62 กรัม',
  brand.id, cat.id, 'active',
  1990, 2490, 'VTX-MSE-001', 42, 10,
  true, true, false, true, false,
  'https://images.unsplash.com/photo-1527814050087-3793815479db?w=1200&q=80', now()
from cat, brand;

with p as (select id from products where slug = 'vertex-pro-gaming-mouse')
insert into product_images (product_id, url, alt_text, sort_order, is_primary)
select p.id, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=1200&q=80', 'Vertex Pro Gaming Mouse', 0, true
from p;

with p as (select id from products where slug = 'vertex-pro-gaming-mouse')
insert into product_options (product_id, name, display_type, sort_order)
select p.id, 'สี', 'color', 0 from p returning id;

-- (Continue wiring product_option_values / product_variants similarly for
-- each product — see lib/mock-data/products.ts for the full field set to
-- port, including hotspots and 360 frame URLs.)

-- Sample product #2: Aurora Mechanical Keyboard (3D + AR + hotspots)
with cat as (select id from categories where slug = 'gaming'),
     brand as (select id from brands where slug = 'aurora')
insert into products (
  name, slug, short_description, description, brand_id, category_id, status,
  base_price, sku, stock_quantity, low_stock_threshold,
  is_featured, supports_3d, supports_ar,
  model_glb_url, fallback_image_url, published_at
)
select
  'Aurora Mechanical Keyboard 75%', 'aurora-mechanical-keyboard-75',
  'คีย์บอร์ดกลไก Hot-swap พร้อมไฟ RGB ต่อบลูทูธได้ 3 อุปกรณ์',
  'Aurora มาพร้อม Gasket Mount ให้สัมผัสการพิมพ์นุ่มนวล รองรับสวิตช์แบบ Hot-swap',
  brand.id, cat.id, 'active',
  3290, 'AUR-KB-075', 25, 8,
  true, true, true,
  'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
  'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1200&q=80', now()
from cat, brand;

with p as (select id from products where slug = 'aurora-mechanical-keyboard-75')
insert into product_hotspots (product_id, title, description, position, normal, icon, sort_order)
select p.id, 'โครงอะลูมิเนียม CNC', 'ตัวเรือนกัด CNC จากอะลูมิเนียมเกรดการบิน', '{"x":0.1,"y":0.4,"z":0.2}', '{"x":0,"y":1,"z":0}', 'Layers', 0
from p
union all
select p.id, 'พอร์ต USB-C', 'เชื่อมต่อสายถอดได้ พร้อมช่องเก็บสายใต้ตัวเครื่อง', '{"x":-0.3,"y":0.1,"z":0.4}', '{"x":0,"y":0,"z":1}', 'Usb', 1
from p;

-- Sample product #3: Halo X13 Smartphone (3D + AR, variants)
with cat as (select id from categories where slug = 'phones-tablets'),
     brand as (select id from brands where slug = 'halo')
insert into products (
  name, slug, short_description, description, brand_id, category_id, status,
  base_price, compare_at_price, sku, stock_quantity, low_stock_threshold,
  is_featured, is_bestseller, supports_3d, supports_ar,
  model_glb_url, fallback_image_url, published_at
)
select
  'Halo X13 Smartphone', 'halo-x13-smartphone',
  'จอ AMOLED 120Hz กล้องสามตัว ชิปประมวลผลแรงระดับเรือธง',
  'Halo X13 มาพร้อมจอ AMOLED 6.7 นิ้ว รีเฟรชเรต 120Hz กล้องหลัก 3 ตัว',
  brand.id, cat.id, 'active',
  21990, 24990, 'HLO-X13-256', 18, 5,
  true, true, true, true,
  'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80', now()
from cat, brand;

-- Sample coupons
insert into coupons (code, name, discount_type, discount_value, minimum_order_amount, is_active) values
  ('SPIN10', 'ส่วนลด 10%', 'percentage', 10, 500, true),
  ('SAVE100', 'ลด 100 บาท', 'fixed', 100, 1000, true),
  ('FREESHIP', 'จัดส่งฟรี', 'free_shipping', 0, 0, true);
