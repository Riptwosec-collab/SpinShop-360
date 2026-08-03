-- SpinShop 360 production security hardening

-- Users may update profile details, but never their own authorization role.
revoke update on table profiles from authenticated;
grant update (full_name, phone, avatar_url) on table profiles to authenticated;

-- Orders and audit events must be created by trusted server code only.
drop policy if exists "orders_owner_insert" on orders;
drop policy if exists "activity_logs_insert_any" on activity_logs;
create policy "activity_logs_service_only" on activity_logs for insert with check (false);

-- Prevent review authors from changing moderation and verification columns.
drop policy if exists "reviews_owner_update" on reviews;

-- Coupon codes are validated by a trusted route, not enumerated by clients.
drop policy if exists "coupons_public_read_active" on coupons;
create policy "coupons_staff_read" on coupons for select using (is_staff_or_admin());

-- Client supplied shipping and discount parameters are retained for backwards
-- API compatibility but intentionally ignored.
create or replace function create_order_with_stock_check(
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
  v_variant product_variants%rowtype;
  v_product products%rowtype;
  v_coupon coupons%rowtype;
  v_subtotal numeric := 0;
  v_shipping_fee numeric := 0;
  v_discount numeric := 0;
  v_grand_total numeric;
  v_order_id uuid;
begin
  if coalesce(array_length(p_items, 1), 0) = 0 then raise exception 'empty_cart'; end if;

  for v_item in
    select (x).variant_id as variant_id, sum((x).quantity)::integer as quantity
    from unnest(p_items) x
    group by (x).variant_id
    order by (x).variant_id
  loop
    select * into v_variant from product_variants
    where id = v_item.variant_id and is_active = true for update;

    if not found then raise exception 'variant_not_found:%', v_item.variant_id; end if;
    if v_item.quantity <= 0 then raise exception 'invalid_quantity'; end if;
    if v_variant.stock_quantity < v_item.quantity then raise exception 'insufficient_stock:%', v_item.variant_id; end if;

    select * into v_product from products
    where id = v_variant.product_id and status = 'active' and deleted_at is null;
    if not found then raise exception 'product_not_available:%', v_variant.product_id; end if;

    v_subtotal := v_subtotal + (v_variant.price * v_item.quantity);
  end loop;

  if p_shipping_method = 'express' then
    v_shipping_fee := 100;
  elsif p_shipping_method = 'standard' then
    v_shipping_fee := case when v_subtotal >= 1500 then 0 else 50 end;
  else
    raise exception 'invalid_shipping_method';
  end if;

  if nullif(trim(p_coupon_code), '') is not null then
    select * into v_coupon from coupons
    where upper(code) = upper(trim(p_coupon_code))
      and is_active = true
      and (starts_at is null or starts_at <= now())
      and (expires_at is null or expires_at >= now())
    for update;

    if not found then raise exception 'invalid_coupon'; end if;
    if v_subtotal < v_coupon.minimum_order_amount then raise exception 'coupon_minimum_not_met'; end if;
    if v_coupon.usage_limit is not null and
       (select count(*) from coupon_usages where coupon_id = v_coupon.id) >= v_coupon.usage_limit then
      raise exception 'coupon_usage_limit';
    end if;
    if p_user_id is not null and v_coupon.usage_limit_per_user is not null and
       (select count(*) from coupon_usages where coupon_id = v_coupon.id and user_id = p_user_id) >= v_coupon.usage_limit_per_user then
      raise exception 'coupon_user_limit';
    end if;

    if v_coupon.discount_type = 'percentage' then
      v_discount := round(v_subtotal * (v_coupon.discount_value / 100));
    elsif v_coupon.discount_type = 'fixed' then
      v_discount := v_coupon.discount_value;
    elsif v_coupon.discount_type = 'free_shipping' then
      v_shipping_fee := 0;
    end if;
    if v_coupon.maximum_discount_amount is not null then
      v_discount := least(v_discount, v_coupon.maximum_discount_amount);
    end if;
  end if;

  v_discount := least(greatest(v_discount, 0), v_subtotal);
  v_grand_total := greatest(0, v_subtotal + v_shipping_fee - v_discount);

  insert into orders (
    order_number, user_id, email, phone, status, payment_status, shipping_status,
    subtotal, discount_amount, shipping_fee, tax_amount, grand_total,
    coupon_code, shipping_address, payment_method, shipping_method, customer_note
  ) values (
    p_order_number, p_user_id, lower(p_email), p_phone,
    case when p_payment_method = 'cod' then 'processing' else 'pending' end,
    'unpaid', 'unfulfilled', v_subtotal, v_discount, v_shipping_fee, 0,
    v_grand_total, nullif(trim(p_coupon_code), ''), p_shipping_address,
    p_payment_method, p_shipping_method, p_customer_note
  ) returning id into v_order_id;

  for v_item in
    select (x).variant_id as variant_id, sum((x).quantity)::integer as quantity
    from unnest(p_items) x group by (x).variant_id
  loop
    select * into v_variant from product_variants where id = v_item.variant_id;
    select * into v_product from products where id = v_variant.product_id;

    insert into order_items (
      order_id, product_id, variant_id, product_name, sku, unit_price, quantity, line_total
    ) values (
      v_order_id, v_variant.product_id, v_variant.id, v_product.name, v_variant.sku,
      v_variant.price, v_item.quantity, v_variant.price * v_item.quantity
    );

    update product_variants
    set stock_quantity = stock_quantity - v_item.quantity, updated_at = now()
    where id = v_variant.id and stock_quantity >= v_item.quantity;
    if not found then raise exception 'concurrent_stock_change:%', v_variant.id; end if;
  end loop;

  return query select v_order_id, p_order_number, v_grand_total;
end;
$$;

revoke execute on function create_order_with_stock_check from public, anon, authenticated;
