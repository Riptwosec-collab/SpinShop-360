-- ============================================================================
-- SpinShop 360 — Atomic order creation
--
-- Wraps "verify stock -> decrement stock -> insert order -> insert items"
-- in a single Postgres transaction so concurrent checkouts can never oversell
-- a variant. `for update` row-locks each variant row for the duration of the
-- transaction, so two simultaneous requests for the last unit of a variant
-- serialize instead of racing.
-- ============================================================================

create type order_item_input as (
  product_id uuid,
  variant_id uuid,
  quantity integer
);

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
as $$
declare
  v_item order_item_input;
  v_variant product_variants%rowtype;
  v_product products%rowtype;
  v_subtotal numeric := 0;
  v_line_total numeric;
  v_order_id uuid;
  v_grand_total numeric;
begin
  -- Lock every variant row involved before checking stock, so no other
  -- transaction can decrement the same rows concurrently until we commit.
  for v_item in select * from unnest(p_items)
  loop
    select * into v_variant from product_variants
      where id = v_item.variant_id
      for update;

    if not found then
      raise exception 'variant_not_found:%', v_item.variant_id;
    end if;

    if v_variant.stock_quantity < v_item.quantity then
      raise exception 'insufficient_stock:%', v_item.variant_id;
    end if;

    v_line_total := v_variant.price * v_item.quantity;
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  v_grand_total := greatest(0, v_subtotal + p_shipping_fee - p_discount_amount);

  insert into orders (
    order_number, user_id, email, phone, status, payment_status, shipping_status,
    subtotal, discount_amount, shipping_fee, tax_amount, grand_total,
    coupon_code, shipping_address, payment_method, shipping_method, customer_note
  ) values (
    p_order_number, p_user_id, p_email, p_phone,
    case when p_payment_method = 'cod' then 'processing' else 'pending' end,
    'unpaid', 'unfulfilled',
    v_subtotal, p_discount_amount, p_shipping_fee, 0, v_grand_total,
    p_coupon_code, p_shipping_address, p_payment_method, p_shipping_method, p_customer_note
  )
  returning id into v_order_id;

  for v_item in select * from unnest(p_items)
  loop
    select * into v_variant from product_variants where id = v_item.variant_id;
    select * into v_product from products where id = v_item.product_id;

    insert into order_items (
      order_id, product_id, variant_id, product_name, sku, unit_price, quantity, line_total
    ) values (
      v_order_id, v_item.product_id, v_item.variant_id, v_product.name, v_variant.sku,
      v_variant.price, v_item.quantity, v_variant.price * v_item.quantity
    );

    update product_variants
      set stock_quantity = stock_quantity - v_item.quantity
      where id = v_item.variant_id;
  end loop;

  return query select v_order_id, p_order_number, v_grand_total;
end;
$$;

-- Only callable via the service-role key from a trusted server context
-- (Route Handler), never directly from the browser.
revoke execute on function create_order_with_stock_check from public, anon, authenticated;
