-- ============================================================================
-- SpinShop 360 — Reservation expiry integrity
-- Prevent late webhooks from finalizing expired stock reservations and release
-- coupon usage when an unpaid order is cancelled by reservation expiry.
-- ============================================================================

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
  v_expected_variants integer;
  v_active_reservations integer;
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

  if v_order.payment_status <> 'unpaid' or v_order.status = 'cancelled' then
    raise exception 'invalid_payment_state';
  end if;

  -- Online payments must finalize before every reservation expires. The count
  -- check prevents an incomplete reservation set from silently marking paid.
  if v_order.payment_method <> 'cod' then
    select count(distinct variant_id)::integer into v_expected_variants
    from public.order_items
    where order_id = p_order_id;

    select count(*)::integer into v_active_reservations
    from public.stock_reservations
    where order_id = p_order_id
      and status = 'active'
      and expires_at > now();

    if v_expected_variants = 0 or v_active_reservations <> v_expected_variants then
      raise exception 'stock_reservation_expired';
    end if;
  end if;

  for v_reservation in
    select *
    from public.stock_reservations
    where order_id = p_order_id
      and status = 'active'
      and expires_at > now()
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
  where order_id = p_order_id
    and status = 'active'
    and expires_at > now();

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
  with expired as (
    update public.stock_reservations
    set status = 'expired', updated_at = now()
    where status = 'active' and expires_at <= now()
    returning order_id
  ), cancelled_orders as (
    update public.orders o
    set status = 'cancelled', updated_at = now()
    where o.payment_status = 'unpaid'
      and o.payment_method <> 'cod'
      and exists (select 1 from expired e where e.order_id = o.id)
      and not exists (
        select 1 from public.stock_reservations sr
        where sr.order_id = o.id and sr.status = 'active' and sr.expires_at > now()
      )
    returning o.id
  ), released_coupon_usage as (
    delete from public.coupon_usages cu
    using cancelled_orders co
    where cu.order_id = co.id
    returning cu.id
  )
  select count(*)::integer into v_count from expired;

  return v_count;
end;
$$;

revoke execute on function public.finalize_paid_order from public, anon, authenticated;
revoke execute on function public.release_expired_stock_reservations from public, anon, authenticated;
grant execute on function public.finalize_paid_order to service_role;
grant execute on function public.release_expired_stock_reservations to service_role;
