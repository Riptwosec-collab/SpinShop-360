-- ============================================================================
-- SpinShop 360 — Row Level Security policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: is the current JWT user an admin or staff?
-- SECURITY DEFINER so it can read `profiles` regardless of the caller's own
-- row-level access, without ever trusting a role claim sent by the client.
-- ----------------------------------------------------------------------------
create or replace function is_staff_or_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('staff', 'admin')
  );
$$ language sql security definer stable;

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;

create policy "profiles_select_own_or_staff" on profiles
  for select using (auth.uid() = id or is_staff_or_admin());

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "profiles_admin_manage" on profiles
  for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- catalog: public read of active rows, staff/admin manage everything
-- ----------------------------------------------------------------------------
alter table categories enable row level security;
alter table brands enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_360_frames enable row level security;
alter table product_models enable row level security;
alter table product_options enable row level security;
alter table product_option_values enable row level security;
alter table product_variants enable row level security;
alter table variant_option_values enable row level security;
alter table product_hotspots enable row level security;

create policy "categories_public_read" on categories for select using (is_active or is_staff_or_admin());
create policy "categories_staff_write" on categories for all using (is_staff_or_admin()) with check (is_staff_or_admin());

create policy "brands_public_read" on brands for select using (is_active or is_staff_or_admin());
create policy "brands_staff_write" on brands for all using (is_staff_or_admin()) with check (is_staff_or_admin());

create policy "products_public_read" on products
  for select using (status = 'active' and deleted_at is null or is_staff_or_admin());
create policy "products_staff_write" on products for all using (is_staff_or_admin()) with check (is_staff_or_admin());

create policy "product_images_public_read" on product_images for select using (true);
create policy "product_images_staff_write" on product_images for all using (is_staff_or_admin()) with check (is_staff_or_admin());

create policy "product_360_public_read" on product_360_frames for select using (true);
create policy "product_360_staff_write" on product_360_frames for all using (is_staff_or_admin()) with check (is_staff_or_admin());

create policy "product_models_public_read" on product_models for select using (true);
create policy "product_models_staff_write" on product_models for all using (is_staff_or_admin()) with check (is_staff_or_admin());

create policy "product_options_public_read" on product_options for select using (true);
create policy "product_options_staff_write" on product_options for all using (is_staff_or_admin()) with check (is_staff_or_admin());

create policy "product_option_values_public_read" on product_option_values for select using (true);
create policy "product_option_values_staff_write" on product_option_values for all using (is_staff_or_admin()) with check (is_staff_or_admin());

create policy "product_variants_public_read" on product_variants for select using (true);
create policy "product_variants_staff_write" on product_variants for all using (is_staff_or_admin()) with check (is_staff_or_admin());

create policy "variant_option_values_public_read" on variant_option_values for select using (true);
create policy "variant_option_values_staff_write" on variant_option_values for all using (is_staff_or_admin()) with check (is_staff_or_admin());

create policy "product_hotspots_public_read" on product_hotspots for select using (is_active or is_staff_or_admin());
create policy "product_hotspots_staff_write" on product_hotspots for all using (is_staff_or_admin()) with check (is_staff_or_admin());

-- ----------------------------------------------------------------------------
-- cart / wishlist — owned by the user (or anonymous session_id, matched
-- application-side since anonymous sessions have no auth.uid())
-- ----------------------------------------------------------------------------
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table wishlists enable row level security;
alter table wishlist_items enable row level security;

create policy "carts_owner" on carts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cart_items_owner" on cart_items for all
  using (exists (select 1 from carts where carts.id = cart_id and carts.user_id = auth.uid()))
  with check (exists (select 1 from carts where carts.id = cart_id and carts.user_id = auth.uid()));

create policy "wishlists_owner" on wishlists for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "wishlist_items_owner" on wishlist_items for all
  using (exists (select 1 from wishlists where wishlists.id = wishlist_id and wishlists.user_id = auth.uid()))
  with check (exists (select 1 from wishlists where wishlists.id = wishlist_id and wishlists.user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- addresses
-- ----------------------------------------------------------------------------
alter table addresses enable row level security;

create policy "addresses_owner" on addresses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- orders — customers see only their own; staff/admin see all
-- ----------------------------------------------------------------------------
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;

create policy "orders_owner_or_staff_read" on orders
  for select using (auth.uid() = user_id or is_staff_or_admin());

create policy "orders_owner_insert" on orders
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "orders_staff_update" on orders
  for update using (is_staff_or_admin()) with check (is_staff_or_admin());

create policy "order_items_owner_or_staff_read" on order_items
  for select using (
    exists (select 1 from orders where orders.id = order_id and (orders.user_id = auth.uid() or is_staff_or_admin()))
  );
create policy "order_items_staff_write" on order_items
  for all using (is_staff_or_admin()) with check (is_staff_or_admin());

create policy "payments_owner_or_staff_read" on payments
  for select using (
    exists (select 1 from orders where orders.id = order_id and (orders.user_id = auth.uid() or is_staff_or_admin()))
  );
create policy "payments_staff_write" on payments
  for all using (is_staff_or_admin()) with check (is_staff_or_admin());

-- ----------------------------------------------------------------------------
-- coupons — public can read active coupons (to validate codes), only
-- staff/admin manage them; usages are private to the user + staff
-- ----------------------------------------------------------------------------
alter table coupons enable row level security;
alter table coupon_usages enable row level security;

create policy "coupons_public_read_active" on coupons
  for select using (is_active or is_staff_or_admin());
create policy "coupons_staff_write" on coupons
  for all using (is_staff_or_admin()) with check (is_staff_or_admin());

create policy "coupon_usages_owner_or_staff" on coupon_usages
  for select using (auth.uid() = user_id or is_staff_or_admin());
create policy "coupon_usages_insert" on coupon_usages
  for insert with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- reviews — public reads approved reviews; users create reviews only for
-- products they purchased (order_item ownership check); staff moderate
-- ----------------------------------------------------------------------------
alter table reviews enable row level security;
alter table review_images enable row level security;

create policy "reviews_public_read_approved" on reviews
  for select using (status = 'approved' or auth.uid() = user_id or is_staff_or_admin());

create policy "reviews_owner_insert" on reviews
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from order_items
      join orders on orders.id = order_items.order_id
      where order_items.id = order_item_id
        and orders.user_id = auth.uid()
        and orders.status in ('delivered', 'completed')
    )
  );

create policy "reviews_owner_update" on reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reviews_staff_moderate" on reviews
  for update using (is_staff_or_admin()) with check (is_staff_or_admin());

create policy "review_images_public_read" on review_images for select using (true);
create policy "review_images_owner_insert" on review_images
  for insert with check (
    exists (select 1 from reviews where reviews.id = review_id and reviews.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- analytics — inserts allowed from any authenticated/anon client (write-only
-- from the client), reads restricted to staff/admin
-- ----------------------------------------------------------------------------
alter table product_views enable row level security;
alter table activity_logs enable row level security;

create policy "product_views_insert_any" on product_views for insert with check (true);
create policy "product_views_staff_read" on product_views for select using (is_staff_or_admin());

create policy "activity_logs_staff_read" on activity_logs for select using (is_staff_or_admin());
create policy "activity_logs_insert_any" on activity_logs for insert with check (true);
