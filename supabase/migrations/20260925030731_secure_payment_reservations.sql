-- Browser order creation must not bypass price, stock, and payment checks.
drop policy if exists orders_owner_insert on public.orders;
revoke insert on public.orders from anon, authenticated;

-- Server-only capability, one durable payment attempt per order, and an atomic
-- event inbox. Existing duplicate payment rows must be reconciled before this
-- migration; never silently delete historical financial records.
create table public.order_payment_access (
  order_id uuid primary key references public.orders(id) on delete cascade,
  token_hash text not null check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null
);
alter table public.order_payment_access enable row level security;
revoke all on public.order_payment_access from public, anon, authenticated;
grant all on public.order_payment_access to service_role;

alter table public.payments add column provider_intent_id text;
alter table public.payments add column refunded_amount_minor bigint not null default 0 check (refunded_amount_minor >= 0);
create unique index payments_one_attempt_per_order on public.payments(order_id);
create unique index payments_provider_transaction_unique on public.payments(provider, provider_transaction_id) where provider_transaction_id is not null;
create unique index payments_provider_intent_unique on public.payments(provider, provider_intent_id) where provider_intent_id is not null;

create table public.payment_events (
  provider text not null,
  event_id text not null,
  payment_id uuid not null references public.payments(id),
  event_type text not null,
  received_at timestamptz not null default now(),
  primary key(provider, event_id)
);
alter table public.payment_events enable row level security;
revoke all on public.payment_events from public, anon, authenticated;
grant all on public.payment_events to service_role;

create or replace function public.reserve_order_payment(p_order_id uuid, p_provider text)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_order public.orders%rowtype; v_payment public.payments%rowtype;
begin
  if p_provider not in ('stripe','omise') then raise exception 'invalid_provider'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  select * into v_payment from public.payments where order_id = p_order_id;
  if found then
    return jsonb_build_object('acquired', false, 'payment', to_jsonb(v_payment), 'order', to_jsonb(v_order));
  end if;
  if v_order.status not in ('pending','awaiting_payment') or v_order.payment_status not in ('unpaid','pending','failed')
     or v_order.grand_total <= 0 or v_order.payment_method not in ('promptpay','credit_card','debit_card','bank_transfer') then
    raise exception 'order_not_payable';
  end if;
  insert into public.payments(order_id, provider, method, amount, currency, status)
    values(p_order_id, p_provider, v_order.payment_method, v_order.grand_total, 'THB', 'reserved') returning * into v_payment;
  return jsonb_build_object('acquired', true, 'payment', to_jsonb(v_payment), 'order', to_jsonb(v_order));
end; $$;

create or replace function public.finish_order_payment(p_payment_id uuid, p_transaction_id text, p_intent_id text, p_response jsonb)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_payment public.payments%rowtype;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then raise exception 'payment_not_found'; end if;
  if (v_payment.provider_transaction_id is not null and p_transaction_id is not null and v_payment.provider_transaction_id <> p_transaction_id)
    or (v_payment.provider_intent_id is not null and p_intent_id is not null and v_payment.provider_intent_id <> p_intent_id) then
    raise exception 'transaction_mismatch';
  end if;
  update public.payments set
    provider_transaction_id = coalesce(provider_transaction_id, p_transaction_id),
    provider_intent_id = coalesce(provider_intent_id, p_intent_id),
    -- A webhook may win this race. The browser response never marks an order paid.
    status = case when status in ('reserved','unknown','pending') then
      case when p_response->>'status' in ('unknown','failed') then p_response->>'status' else 'pending' end else status end,
    payment_data = jsonb_build_object('response', p_response), updated_at = now()
    where id = p_payment_id;
end; $$;

create or replace function public.apply_payment_event(
  p_provider text, p_event_id text, p_payment_id uuid, p_order_id uuid,
  p_transaction_id text, p_intent_id text, p_event_type text,
  p_amount_minor bigint, p_currency text, p_refunded_minor bigint default 0
) returns text language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_order public.orders%rowtype; v_payment public.payments%rowtype; v_refunded bigint; v_count integer;
begin
  -- Match reservation + order + gateway identity, not an arbitrary metadata order.
  -- Lock order before payment everywhere to avoid deadlocks with reservation.
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  select * into v_payment from public.payments where id = p_payment_id and order_id = p_order_id and provider = p_provider for update;
  if not found then raise exception 'payment_mapping_mismatch'; end if;
  if p_amount_minor is null or p_amount_minor <= 0 or p_amount_minor <> round(v_payment.amount * 100)
    or p_amount_minor <> round(v_order.grand_total * 100) or lower(p_currency) is distinct from lower(v_payment.currency)
    or p_currency is null or (p_transaction_id is null and p_intent_id is null)
    or (p_provider = 'omise' and p_transaction_id is null)
    or (p_transaction_id is not null and v_payment.provider_transaction_id is not null and p_transaction_id <> v_payment.provider_transaction_id)
    or (p_intent_id is not null and v_payment.provider_intent_id is not null and p_intent_id <> v_payment.provider_intent_id) then
    raise exception 'payment_amount_currency_or_transaction_mismatch';
  end if;
  if p_event_id is null or p_event_id = '' or p_event_type not in ('payment.succeeded','payment.failed','payment.refunded') then raise exception 'invalid_event'; end if;
  if p_refunded_minor is null or p_refunded_minor < 0 or p_refunded_minor > p_amount_minor
    or (p_event_type = 'payment.refunded' and p_refunded_minor = 0) then raise exception 'invalid_refund_amount'; end if;
  insert into public.payment_events(provider,event_id,payment_id,event_type) values(p_provider,p_event_id,p_payment_id,p_event_type) on conflict do nothing;
  get diagnostics v_count = row_count;
  if v_count = 0 then return 'duplicate'; end if;
  update public.payments set provider_transaction_id = coalesce(provider_transaction_id,p_transaction_id), provider_intent_id = coalesce(provider_intent_id,p_intent_id), updated_at = now() where id = p_payment_id;
  if p_event_type = 'payment.refunded' then
    v_refunded := greatest(v_payment.refunded_amount_minor,p_refunded_minor);
    update public.payments set refunded_amount_minor = v_refunded, status = case when v_refunded = p_amount_minor then 'refunded' else 'partially_refunded' end where id = p_payment_id;
    update public.orders set payment_status = case when v_refunded = p_amount_minor then 'refunded' else 'partially_refunded' end,
      status = case when v_refunded = p_amount_minor then 'refunded'::public.order_status else status end,
      paid_at = coalesce(paid_at,now()) where id = p_order_id;
  elsif p_event_type = 'payment.succeeded' then
    -- Never regress refunds or fulfillment; cancelled orders remain cancelled
    -- for manual reconciliation, but the financial truth is recorded.
    if v_payment.status not in ('refunded','partially_refunded') then
      update public.payments set status = 'paid' where id = p_payment_id;
      update public.orders set payment_status = 'paid', paid_at = coalesce(paid_at,now()),
        status = case when status in ('pending','awaiting_payment') then 'paid'::public.order_status else status end
        where id = p_order_id and payment_status not in ('refunded','partially_refunded');
    end if;
  elsif v_payment.status not in ('paid','refunded','partially_refunded') then
    update public.payments set status = 'failed' where id = p_payment_id;
    update public.orders set payment_status = 'failed' where id = p_order_id and payment_status not in ('paid','refunded','partially_refunded');
  end if;
  return 'applied';
end; $$;

revoke execute on function public.reserve_order_payment(uuid,text) from public, anon, authenticated;
revoke execute on function public.finish_order_payment(uuid,text,text,jsonb) from public, anon, authenticated;
revoke execute on function public.apply_payment_event(text,text,uuid,uuid,text,text,text,bigint,text,bigint) from public, anon, authenticated;
grant execute on function public.reserve_order_payment(uuid,text) to service_role;
grant execute on function public.finish_order_payment(uuid,text,text,jsonb) to service_role;
grant execute on function public.apply_payment_event(text,text,uuid,uuid,text,text,text,bigint,text,bigint) to service_role;

-- Replace the original order transaction: reject invalid quantities and variant
-- mismatch, aggregate repeated variants BEFORE stock checks, and calculate all
-- shipping/coupon discounts on the server. Client price/fees are never trusted.
create or replace function public.create_order_with_stock_check(
  p_order_number text, p_user_id uuid, p_email text, p_phone text,
  p_items public.order_item_input[], p_shipping_address jsonb, p_payment_method text,
  p_shipping_method text, p_shipping_fee numeric, p_discount_amount numeric,
  p_coupon_code text, p_customer_note text
) returns table (order_id uuid, order_number text, grand_total numeric)
language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_item record; v_variant public.product_variants%rowtype; v_product public.products%rowtype;
  v_coupon public.coupons%rowtype; v_subtotal numeric := 0; v_shipping numeric;
  v_discount numeric := 0; v_order_id uuid; v_grand_total numeric; v_coupon_code text;
begin
  if p_items is null or cardinality(p_items) < 1 or cardinality(p_items) > 100 then raise exception 'invalid_items'; end if;
  if exists(select 1 from unnest(p_items) i where i.quantity is null or i.quantity < 1 or i.quantity > 999 or i.product_id is null or i.variant_id is null) then raise exception 'invalid_quantity'; end if;
  if p_payment_method is null or p_payment_method not in ('promptpay','credit_card','debit_card','bank_transfer','cod')
    or p_shipping_method is null or p_shipping_method not in ('standard','express') then raise exception 'invalid_method'; end if;
  if exists(select 1 from unnest(p_items) i group by i.variant_id having count(distinct i.product_id) > 1) then raise exception 'variant_product_mismatch'; end if;
  for v_item in select i.variant_id, i.product_id, sum(i.quantity)::integer as quantity from unnest(p_items) i group by i.variant_id,i.product_id order by i.variant_id loop
    select * into v_variant from public.product_variants where id = v_item.variant_id for update;
    if not found or not v_variant.is_active then raise exception 'variant_not_found'; end if;
    if v_variant.product_id <> v_item.product_id then raise exception 'variant_product_mismatch'; end if;
    select * into v_product from public.products where id = v_variant.product_id;
    if not found or v_product.status <> 'active' or v_product.deleted_at is not null then raise exception 'variant_not_found'; end if;
    if v_item.quantity > 999 or v_variant.stock_quantity < v_item.quantity then raise exception 'insufficient_stock'; end if;
    if v_variant.price <= 0 then raise exception 'invalid_price'; end if;
    v_subtotal := v_subtotal + v_variant.price * v_item.quantity;
  end loop;
  v_shipping := case when p_shipping_method = 'express' then 100 when v_subtotal >= 1500 then 0 else 50 end;
  if nullif(trim(p_coupon_code),'') is not null then
    select * into v_coupon from public.coupons where lower(code) = lower(trim(p_coupon_code)) for update;
    if not found or not v_coupon.is_active or (v_coupon.starts_at is not null and v_coupon.starts_at > now())
      or (v_coupon.expires_at is not null and v_coupon.expires_at <= now()) or v_subtotal < v_coupon.minimum_order_amount then raise exception 'invalid_coupon'; end if;
    if v_coupon.usage_limit is not null and (select count(*) from public.coupon_usages where coupon_id = v_coupon.id) >= v_coupon.usage_limit then raise exception 'coupon_limit'; end if;
    -- Guest per-user limits cannot be verified; require a signed-in customer.
    if v_coupon.usage_limit_per_user is not null and (p_user_id is null or (select count(*) from public.coupon_usages where coupon_id = v_coupon.id and user_id = p_user_id) >= v_coupon.usage_limit_per_user) then raise exception 'coupon_user_limit'; end if;
    v_discount := case v_coupon.discount_type when 'percentage' then round(v_subtotal * v_coupon.discount_value / 100,2) when 'fixed' then v_coupon.discount_value else 0 end;
    if v_coupon.maximum_discount_amount is not null then v_discount := least(v_discount,v_coupon.maximum_discount_amount); end if;
    v_discount := greatest(0,least(v_subtotal,v_discount));
    if v_coupon.discount_type = 'free_shipping' then v_shipping := 0; end if;
    v_coupon_code := v_coupon.code;
  end if;
  v_grand_total := v_subtotal + v_shipping - v_discount;
  insert into public.orders(order_number,user_id,email,phone,status,payment_status,shipping_status,subtotal,discount_amount,shipping_fee,tax_amount,grand_total,coupon_code,shipping_address,payment_method,shipping_method,customer_note)
  values(p_order_number,p_user_id,p_email,p_phone,case when p_payment_method = 'cod' then 'processing'::public.order_status else 'pending'::public.order_status end,'unpaid','unfulfilled',v_subtotal,v_discount,v_shipping,0,v_grand_total,v_coupon_code,p_shipping_address,p_payment_method,p_shipping_method,p_customer_note) returning id into v_order_id;
  for v_item in select i.variant_id, i.product_id, sum(i.quantity)::integer as quantity from unnest(p_items) i group by i.variant_id,i.product_id order by i.variant_id loop
    select * into v_variant from public.product_variants where id = v_item.variant_id;
    select * into v_product from public.products where id = v_variant.product_id;
    insert into public.order_items(order_id,product_id,variant_id,product_name,sku,unit_price,quantity,line_total)
    values(v_order_id,v_variant.product_id,v_variant.id,v_product.name,v_variant.sku,v_variant.price,v_item.quantity,v_variant.price*v_item.quantity);
    update public.product_variants set stock_quantity = stock_quantity-v_item.quantity where id = v_variant.id;
  end loop;
  if v_coupon_code is not null then insert into public.coupon_usages(coupon_id,user_id,order_id) values(v_coupon.id,p_user_id,v_order_id); end if;
  return query select v_order_id,p_order_number,v_grand_total;
end; $$;
revoke execute on function public.create_order_with_stock_check(text,uuid,text,text,public.order_item_input[],jsonb,text,text,numeric,numeric,text,text) from public, anon, authenticated;
grant execute on function public.create_order_with_stock_check(text,uuid,text,text,public.order_item_input[],jsonb,text,text,numeric,numeric,text,text) to service_role;

-- Checkout-level idempotency also prevents duplicate stock reservations when an
-- order response is lost. Keys are random client nonces, bound to exact request
-- fingerprint and owner. This table is never readable through public APIs.
create table public.order_creation_requests (
  request_key uuid primary key,
  request_hash text not null,
  user_id uuid,
  order_id uuid not null references public.orders(id),
  created_at timestamptz not null default now()
);
alter table public.order_creation_requests enable row level security;
revoke all on public.order_creation_requests from public, anon, authenticated;
grant all on public.order_creation_requests to service_role;
create or replace function public.create_order_once(p_request_key uuid,p_request_hash text,p_user_id uuid,p_guest_token_hash text,p_request jsonb)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_previous public.order_creation_requests%rowtype; v_result record; v_items public.order_item_input[]; v_order public.orders%rowtype;
begin
  if p_request_key is null or p_request_hash is null then raise exception 'invalid_request_key'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request_key::text,0));
  select * into v_previous from public.order_creation_requests where request_key = p_request_key;
  if found then
    if v_previous.request_hash <> p_request_hash or v_previous.user_id is distinct from p_user_id then raise exception 'idempotency_conflict'; end if;
    if p_user_id is null and not exists(select 1 from public.order_payment_access where order_id = v_previous.order_id and token_hash = p_guest_token_hash and expires_at > now()) then raise exception 'guest_access_expired'; end if;
    select * into v_order from public.orders where id = v_previous.order_id;
    return jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'grand_total',v_order.grand_total,'replayed',true);
  end if;
  select array_agg(row((i->>'productId')::uuid,(i->>'variantId')::uuid,(i->>'quantity')::integer)::public.order_item_input) into v_items from jsonb_array_elements(p_request->'items') i;
  select * into v_result from public.create_order_with_stock_check(
    p_request->>'orderNumber',p_user_id,p_request->>'email',p_request->>'phone',v_items,p_request->'shippingAddress',
    p_request->>'paymentMethod',p_request->>'shippingMethod',0,0,p_request->>'couponCode',p_request->>'customerNote');
  if p_user_id is null then
    insert into public.order_payment_access(order_id,token_hash,expires_at) values(v_result.order_id,p_guest_token_hash,now()+interval '24 hours');
  end if;
  insert into public.order_creation_requests(request_key,request_hash,user_id,order_id) values(p_request_key,p_request_hash,p_user_id,v_result.order_id);
  return jsonb_build_object('order_id',v_result.order_id,'order_number',v_result.order_number,'grand_total',v_result.grand_total,'replayed',false);
end; $$;
revoke execute on function public.create_order_once(uuid,text,uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_order_once(uuid,text,uuid,text,jsonb) to service_role;
