-- ============================================================================
-- SpinShop 360 — Security, order, stock reservation and payment hardening
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Least-privilege grants and RLS hardening
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- RLS controls rows, while column privileges prevent users from changing role.
revoke update on table public.profiles from anon, authenticated;
grant update (full_name, phone, avatar_url) on table public.profiles to authenticated;

drop policy if exists "reviews_owner_update" on public.reviews;
create policy "reviews_owner_update" on public.reviews
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
revoke update on table public.reviews from authenticated;
grant update (rating, title, content) on table public.reviews to authenticated;

-- Orders, payments, coupon usage and audit logs are server-owned resources.
drop policy if exists "orders_owner_insert" on public.orders;
drop policy if exists "order_items_staff_write" on public.order_items;
drop policy if exists "payments_staff_write" on public.payments;
drop policy if exists "coupon_usages_insert" on public.coupon_usages;
drop policy if exists "activity_logs_insert_any" on public.activity_logs;

revoke insert, update, delete on table public.orders from anon, authenticated;
revoke insert, update, delete on table public.order_items from anon, authenticated;
revoke insert, update, delete on table public.payments from anon, authenticated;
revoke insert, update, delete on table public.coupon_usages from anon, authenticated;
revoke insert, update, delete on table public.activity_logs from anon, authenticated;

-- Coupon codes are validated through the trusted API instead of being enumerable.
drop policy if exists "coupons_public_read_active" on public.coupons;
create policy "coupons_staff_read" on public.coupons
  for select to authenticated
  using (is_staff_or_admin());
revoke select on table public.coupons from anon, authenticated;

-- Service-role code remains the only writer for trusted resources.
grant select, insert, update, delete on table public.orders to service_role;
grant select, insert, update, delete on table public.order_items to service_role;
grant select, insert, update, delete on table public.payments to service_role;
grant select, insert, update, delete on table public.coupons to service_role;
grant select, insert, update, delete on table public.coupon_usages to service_role;
grant select, insert, update, delete on table public.activity_logs to service_role;

-- ---------------------------------------------------------------------------
-- Stock reservations prevent unpaid checkouts from permanently consuming stock
-- while still preventing overselling during the payment window.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'stock_reservation_status') then
    create type stock_reservation_status as enum ('active', 'finalized', 'expired', 'cancelled');
  end if;
end $$;

create table if not exists public.stock_reservations (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  status stock_reservation_status not null default 'active',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, variant_id)
);

create index if not exists idx_stock_reservations_active_variant
  on public.stock_reservations (variant_id, expires_at)
  where status = 'active';
create index if not exists idx_stock_reservations_order
  on public.stock_reservations (order_id);

alter table public.stock_reservations enable row level security;
revoke all on table public.stock_reservations from anon, authenticated;
grant select, insert, update, delete on table public.stock_reservations to service_role;

create unique index if not exists idx_payments_provider_transaction_unique
  on public.payments (provider, provider_transaction_id)
  where provider_transaction_id is not null;

-- ---------------------------------------------------------------------------
-- Trusted order creation. Client-supplied price, discount and shipping values
-- are intentionally ignored. Duplicate variants are aggregated before checks.
-- ---------------------------------------------------------------------------

create or replace function public.create_order_with_stock_check(
  p_order_number text,
  p_user_id uuid,
  p_email text,
  p_phone text,
  p_items order_item_input[],
  p_shipping_address jsonb,
  p_payment_method text,
  p_shipping_method text,
  p_shipping_fee numeric,
  p_discount_amount numeric,
  p_coupon_code text,
  p_customer_note text
)
returns table (order_id uuid, order_number text, grand_total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_variant public.product_variants%rowtype;
  v_product public.products%rowtype;
  v_coupon public.coupons%rowtype;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_shipping numeric := 0;
  v_line_total numeric;
  v_reserved integer;
  v_total_usage integer;
  v_user_usage integer;
  v_order_id uuid;
  v_grand_total numeric;
  v_reservation_expires_at timestamptz := now() + interval '30 minutes';
begin
  if coalesce(array_length(p_items, 1), 0) = 0 then
    raise exception 'empty_cart';
  end if;

  if p_shipping_method not in ('standard', 'express') then
    raise exception 'invalid_shipping_method';
  end if;

  if p_payment_method not in ('promptpay', 'credit_card', 'debit_card', 'bank_transfer', 'cod') then
    raise exception 'invalid_payment_method';
  end if;

  -- Lock rows in deterministic order and aggregate duplicate variant entries.
  for v_item in
    select
      (item).variant_id as variant_id,
      sum((item).quantity)::integer as quantity
    from unnest(p_items) as item
    group by (item).variant_id
    order by (item).variant_id
  loop
    if v_item.quantity <= 0 then
      raise exception 'invalid_quantity:%', v_item.variant_id;
    end if;

    select * into v_variant
    from public.product_variants
    where id = v_item.variant_id and is_active = true
    for update;

    if not found then
      raise exception 'variant_not_found:%', v_item.variant_id;
    end if;

    select * into v_product
    from public.products
    where id = v_variant.product_id
      and status = 'active'
      and deleted_at is null;

    if not found then
      raise exception 'product_not_available:%', v_variant.product_id;
    end if;

    select coalesce(sum(quantity), 0)::integer into v_reserved
    from public.stock_reservations
    where variant_id = v_variant.id
      and status = 'active'
      and expires_at > now();

    if (v_variant.stock_quantity - v_reserved) < v_item.quantity then
      raise exception 'insufficient_stock:%', v_item.variant_id;
    end if;

    v_line_total := v_variant.price * v_item.quantity;
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  v_shipping := case
    when p_shipping_method = 'express' then 100
    when v_subtotal >= 1500 then 0
    else 50
  end;

  if nullif(trim(p_coupon_code), '') is not null then
    select * into v_coupon
    from public.coupons
    where upper(code) = upper(trim(p_coupon_code))
      and is_active = true
    for update;

    if not found then
      raise exception 'coupon_invalid';
    end if;
    if v_coupon.starts_at is not null and v_coupon.starts_at > now() then
      raise exception 'coupon_not_started';
    end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
      raise exception 'coupon_expired';
    end if;
    if v_subtotal < v_coupon.minimum_order_amount then
      raise exception 'coupon_minimum_not_met';
    end if;

    select count(*)::integer into v_total_usage
    from public.coupon_usages
    where coupon_id = v_coupon.id;

    if v_coupon.usage_limit is not null and v_total_usage >= v_coupon.usage_limit then
      raise exception 'coupon_usage_limit';
    end if;

    if v_coupon.usage_limit_per_user is not null then
      select count(*)::integer into v_user_usage
      from public.coupon_usages cu
      join public.orders o on o.id = cu.order_id
      where cu.coupon_id = v_coupon.id
        and (
          (p_user_id is not null and cu.user_id = p_user_id)
          or
          (p_user_id is null and cu.user_id is null and lower(o.email) = lower(p_email))
        );

      if v_user_usage >= v_coupon.usage_limit_per_user then
        raise exception 'coupon_user_limit';
      end if;
    end if;

    if v_coupon.discount_type = 'percentage' then
      v_discount := round(v_subtotal * (v_coupon.discount_value / 100));
    elsif v_coupon.discount_type = 'fixed' then
      v_discount := v_coupon.discount_value;
    elsif v_coupon.discount_type = 'free_shipping' then
      v_shipping := 0;
    end if;

    if v_coupon.maximum_discount_amount is not null then
      v_discount := least(v_discount, v_coupon.maximum_discount_amount);
    end if;
    v_discount := least(v_discount, v_subtotal);
  end if;

  v_grand_total := greatest(0, v_subtotal + v_shipping - v_discount);

  insert into public.orders (
    order_number, user_id, email, phone, status, payment_status, shipping_status,
    subtotal, discount_amount, shipping_fee, tax_amount, grand_total,
    coupon_code, shipping_address, payment_method, shipping_method, customer_note
  ) values (
    p_order_number, p_user_id, lower(trim(p_email)), p_phone,
    case when p_payment_method = 'cod' then 'processing'::order_status else 'awaiting_payment'::order_status end,
    'unpaid', 'unfulfilled',
    v_subtotal, v_discount, v_shipping, 0, v_grand_total,
    case when v_coupon.id is null then null else v_coupon.code end,
    p_shipping_address, p_payment_method, p_shipping_method, p_customer_note
  )
  returning id into v_order_id;

  for v_item in
    select
      (item).variant_id as variant_id,
      sum((item).quantity)::integer as quantity
    from unnest(p_items) as item
    group by (item).variant_id
    order by (item).variant_id
  loop
    select * into v_variant from public.product_variants where id = v_item.variant_id;
    select * into v_product from public.products where id = v_variant.product_id;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, sku, unit_price, quantity, line_total
    ) values (
      v_order_id, v_variant.product_id, v_variant.id, v_product.name, v_variant.sku,
      v_variant.price, v_item.quantity, v_variant.price * v_item.quantity
    );

    if p_payment_method = 'cod' then
      update public.product_variants
      set stock_quantity = stock_quantity - v_item.quantity,
          updated_at = now()
      where id = v_variant.id;
    else
      insert into public.stock_reservations (order_id, variant_id, quantity, expires_at)
      values (v_order_id, v_variant.id, v_item.quantity, v_reservation_expires_at);
    end if;
  end loop;

  if v_coupon.id is not null then
    insert into public.coupon_usages (coupon_id, user_id, order_id)
    values (v_coupon.id, p_user_id, v_order_id);
  end if;

  return query select v_order_id, p_order_number, v_grand_total;
end;
$$;

-- Finalizes an order exactly once after a verified provider webhook.
create or replace function public.finalize_paid_order(
  p_order_id uuid,
  p_provider text,
  p_provider_transaction_id text,
  p_amount numeric,
  p_currency text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_reservation record;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order_not_found';
  end if;

  if upper(p_currency) <> 'THB' or p_amount <> v_order.grand_total then
    raise exception 'payment_amount_mismatch';
  end if;

  if v_order.payment_status = 'paid' then
    return true;
  end if;

  if v_order.payment_status <> 'unpaid' then
    raise exception 'invalid_payment_state';
  end if;

  for v_reservation in
    select *
    from public.stock_reservations
    where order_id = p_order_id and status = 'active'
    order by variant_id
    for update
  loop
    update public.product_variants
    set stock_quantity = stock_quantity - v_reservation.quantity,
        updated_at = now()
    where id = v_reservation.variant_id
      and stock_quantity >= v_reservation.quantity;

    if not found then
      raise exception 'insufficient_stock_at_capture:%', v_reservation.variant_id;
    end if;
  end loop;

  update public.stock_reservations
  set status = 'finalized', updated_at = now()
  where order_id = p_order_id and status = 'active';

  insert into public.payments (
    order_id, provider, provider_transaction_id, method, amount, currency, status, payment_data
  ) values (
    p_order_id, p_provider, p_provider_transaction_id, v_order.payment_method,
    p_amount, upper(p_currency), 'succeeded', '{}'::jsonb
  )
  on conflict (provider, provider_transaction_id) where provider_transaction_id is not null
  do update set status = 'succeeded', updated_at = now();

  update public.orders
  set status = 'paid', payment_status = 'paid', paid_at = now(), updated_at = now()
  where id = p_order_id;

  return true;
end;
$$;

create or replace function public.release_expired_stock_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.stock_reservations
  set status = 'expired', updated_at = now()
  where status = 'active' and expires_at <= now();

  get diagnostics v_count = row_count;

  update public.orders o
  set status = 'cancelled', updated_at = now()
  where o.payment_status = 'unpaid'
    and o.payment_method <> 'cod'
    and exists (
      select 1 from public.stock_reservations sr
      where sr.order_id = o.id and sr.status = 'expired'
    )
    and not exists (
      select 1 from public.stock_reservations sr
      where sr.order_id = o.id and sr.status = 'active'
    );

  return v_count;
end;
$$;

revoke execute on function public.create_order_with_stock_check from public, anon, authenticated;
revoke execute on function public.finalize_paid_order from public, anon, authenticated;
revoke execute on function public.release_expired_stock_reservations from public, anon, authenticated;
grant execute on function public.create_order_with_stock_check to service_role;
grant execute on function public.finalize_paid_order to service_role;
grant execute on function public.release_expired_stock_reservations to service_role;
