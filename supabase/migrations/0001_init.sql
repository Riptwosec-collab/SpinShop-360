-- ============================================================================
-- SpinShop 360 — Initial schema
-- Run via: supabase db push  (or paste into the Supabase SQL editor)
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- profiles (extends auth.users)
-- ----------------------------------------------------------------------------
create type user_role as enum ('customer', 'staff', 'admin');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- categories / brands
-- ----------------------------------------------------------------------------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_id uuid references categories (id),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  logo_url text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create type product_status as enum ('draft', 'active', 'out_of_stock', 'archived');

create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  brand_id uuid references brands (id),
  category_id uuid references categories (id),
  status product_status not null default 'draft',
  base_price numeric(12, 2) not null default 0,
  compare_at_price numeric(12, 2),
  cost_price numeric(12, 2),
  sku text not null unique,
  stock_quantity integer not null default 0,
  low_stock_threshold integer not null default 10,
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  supports_3d boolean not null default false,
  supports_360 boolean not null default false,
  supports_ar boolean not null default false,
  model_glb_url text,
  model_gltf_url text,
  model_usdz_url text,
  fallback_image_url text,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_products_status on products (status) where deleted_at is null;
create index idx_products_category on products (category_id);
create index idx_products_slug on products (slug);

create table product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products (id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table product_360_frames (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products (id) on delete cascade,
  variant_id uuid,
  frame_number integer not null,
  image_url text not null,
  created_at timestamptz not null default now(),
  unique (product_id, variant_id, frame_number)
);

create type model_file_type as enum ('glb', 'gltf', 'usdz');

create table product_models (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products (id) on delete cascade,
  variant_id uuid,
  model_type model_file_type not null,
  file_url text not null,
  file_size bigint,
  thumbnail_url text,
  is_default boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type option_display_type as enum ('select', 'buttons', 'color', 'image');

create table product_options (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products (id) on delete cascade,
  name text not null,
  display_type option_display_type not null default 'buttons',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table product_option_values (
  id uuid primary key default uuid_generate_v4(),
  option_id uuid not null references product_options (id) on delete cascade,
  value text not null,
  color_hex text,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products (id) on delete cascade,
  sku text not null unique,
  price numeric(12, 2) not null,
  compare_at_price numeric(12, 2),
  stock_quantity integer not null default 0,
  image_url text,
  model_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table variant_option_values (
  variant_id uuid not null references product_variants (id) on delete cascade,
  option_value_id uuid not null references product_option_values (id) on delete cascade,
  primary key (variant_id, option_value_id)
);

create table product_hotspots (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products (id) on delete cascade,
  variant_id uuid,
  title text not null,
  description text,
  image_url text,
  position jsonb not null, -- { x, y, z }
  normal jsonb,            -- { x, y, z }
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- cart / wishlist
-- ----------------------------------------------------------------------------
create table carts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles (id) on delete cascade,
  session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_owner check (user_id is not null or session_id is not null)
);

create table cart_items (
  id uuid primary key default uuid_generate_v4(),
  cart_id uuid not null references carts (id) on delete cascade,
  product_id uuid not null references products (id),
  variant_id uuid not null references product_variants (id),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create table wishlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade unique,
  created_at timestamptz not null default now()
);

create table wishlist_items (
  id uuid primary key default uuid_generate_v4(),
  wishlist_id uuid not null references wishlists (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id)
);

-- ----------------------------------------------------------------------------
-- addresses
-- ----------------------------------------------------------------------------
create table addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  subdistrict text not null,
  district text not null,
  province text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- orders
-- ----------------------------------------------------------------------------
create type order_status as enum (
  'pending', 'awaiting_payment', 'paid', 'processing', 'packed',
  'shipped', 'delivered', 'completed', 'cancelled', 'refunded'
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique,
  user_id uuid references profiles (id),
  email text not null,
  phone text not null,
  status order_status not null default 'pending',
  payment_status text not null default 'unpaid',
  shipping_status text not null default 'unfulfilled',
  subtotal numeric(12, 2) not null,
  discount_amount numeric(12, 2) not null default 0,
  shipping_fee numeric(12, 2) not null default 0,
  tax_amount numeric(12, 2) not null default 0,
  grand_total numeric(12, 2) not null,
  coupon_code text,
  shipping_address jsonb not null,
  billing_address jsonb,
  payment_method text not null,
  shipping_method text not null,
  customer_note text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz
);

create index idx_orders_user on orders (user_id);
create index idx_orders_status on orders (status);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id),
  variant_id uuid references product_variants (id),
  product_name text not null,
  sku text not null,
  variant_name text,
  image_url text,
  unit_price numeric(12, 2) not null,
  quantity integer not null,
  line_total numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders (id) on delete cascade,
  provider text not null,
  provider_transaction_id text,
  method text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'THB',
  status text not null default 'pending',
  payment_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- coupons
-- ----------------------------------------------------------------------------
create type discount_type as enum ('percentage', 'fixed', 'free_shipping');

create table coupons (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  name text,
  discount_type discount_type not null,
  discount_value numeric(12, 2) not null default 0,
  minimum_order_amount numeric(12, 2) not null default 0,
  maximum_discount_amount numeric(12, 2),
  usage_limit integer,
  usage_limit_per_user integer,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coupon_usages (
  id uuid primary key default uuid_generate_v4(),
  coupon_id uuid not null references coupons (id) on delete cascade,
  user_id uuid references profiles (id),
  order_id uuid references orders (id),
  used_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- reviews
-- ----------------------------------------------------------------------------
create type review_status as enum ('pending', 'approved', 'rejected', 'hidden');

create table reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  order_item_id uuid references order_items (id),
  rating smallint not null check (rating between 1 and 5),
  title text,
  content text not null,
  is_verified_purchase boolean not null default false,
  status review_status not null default 'pending',
  helpful_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table review_images (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references reviews (id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- analytics
-- ----------------------------------------------------------------------------
create type viewer_mode as enum ('image', '360', '3d', 'ar');

create table product_views (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products (id) on delete cascade,
  user_id uuid references profiles (id),
  session_id text,
  viewer_mode viewer_mode not null default 'image',
  duration_seconds integer not null default 0,
  interactions integer not null default 0,
  created_at timestamptz not null default now()
);

create table activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'profiles','categories','brands','products','product_models',
      'product_variants','product_hotspots','carts','cart_items',
      'addresses','orders','coupons','reviews'
    ])
  loop
    execute format(
      'create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at();',
      t
    );
  end loop;
end $$;
