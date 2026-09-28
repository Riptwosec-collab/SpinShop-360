import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const moduleName = process.env.PGLITE_MODULE
  ? pathToFileURL(path.resolve(process.env.PGLITE_MODULE)).href
  : '@electric-sql/pglite';
const { PGlite } = await import(moduleName);
const db = new PGlite();
const root = fileURLToPath(new URL('../../', import.meta.url));
let passed = 0;
const failures = [];
const query = (sql, values = []) => db.query(sql, values);
const scalar = async (sql, values = []) => Object.values((await query(sql, values)).rows[0])[0];
async function test(name, run) {
  try { await run(); passed++; console.log(`PASS ${name}`); }
  catch (error) { failures.push({ name, error }); console.error(`FAIL ${name}: ${error.message}`); }
}
async function denied(run, pattern = /permission denied|not authorized|not allowed|role|privilege|policy/i) {
  await assert.rejects(run, pattern);
}
async function asRole(role, run, userId = '') {
  assert.ok(['anon', 'authenticated', 'service_role'].includes(role));
  await query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claim.role', $2, false)", [userId, role]);
  await db.exec(`set role ${role}`);
  try { return await run(); }
  finally { await db.exec('reset role'); }
}

await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (
    id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb,
    raw_app_meta_data jsonb default '{}'::jsonb, created_at timestamptz default now()
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create function auth.role() returns text language sql stable as $$
    select nullif(current_setting('request.jwt.claim.role', true), '')
  $$;
  create function auth.jwt() returns jsonb language sql stable as $$
    select jsonb_build_object('sub', auth.uid(), 'role', auth.role())
  $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(text) returns text[] language sql immutable as $$
    select (string_to_array($1, '/'))[1:array_length(string_to_array($1, '/'), 1)-1]
  $$;
  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  grant all on all tables in schema storage to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  create publication supabase_realtime;
`);

const migrationDir = path.join(root, 'supabase/migrations');
const migrations = (await readdir(migrationDir)).filter(name => name.endsWith('.sql')).sort();
for (const name of migrations) {
  const original = await readFile(path.join(migrationDir, name), 'utf8');
  // PGlite does not bundle uuid-ossp. Only its UUID-v4 generator is used here.
  const sql = original.replace(/create extension if not exists "uuid-ossp";/gi, '')
    .replace(/\buuid_generate_v4\(\)/g, 'gen_random_uuid()');
  try { await db.exec(sql); console.log(`APPLY ${name}`); }
  catch (error) { console.error(`MIGRATION FAILURE ${name}: ${error.message}\n${error.detail ?? ''}`); await db.close(); process.exit(1); }
}

await test('anon cannot submit contact through privileged RPC', () => asRole('anon', () => denied(() => query(
  "select public.submit_storefront_form('contact', $1::jsonb, $2)",
  [JSON.stringify({ name: 'SQL test', email: 'sql@example.test', message: 'Database validation message' }), 'a'.repeat(64)]
))));
await test('service-role contact commits durable row and rate limit', async () => {
  const payload = JSON.stringify({ name: 'SQL test', email: 'SQL@EXAMPLE.TEST', message: 'Database validation message' });
  await asRole('service_role', async () => {
    for (let i = 0; i < 5; i++) assert.equal(await scalar("select submit_storefront_form('contact', $1::jsonb, $2)", [payload, 'a'.repeat(64)]), 'saved');
    assert.equal(await scalar("select submit_storefront_form('contact', $1::jsonb, $2)", [payload, 'a'.repeat(64)]), 'limited');
  });
  assert.equal(await scalar("select count(*)::int from contact_messages where email='sql@example.test'"), 5);
  assert.equal(await scalar('select count from storefront_submission_limits where key=$1', ['a'.repeat(64)]), 6);
});
await test('expired submission window allows another committed message', async () => {
  await query("update storefront_submission_limits set reset_at=now()-interval '1 second' where key=$1", ['a'.repeat(64)]);
  await asRole('service_role', async () => assert.equal(await scalar("select submit_storefront_form('contact', $1::jsonb, $2)", [JSON.stringify({ name: 'Reset', email: 'reset@example.test', message: 'A new allowed message' }), 'a'.repeat(64)]), 'saved'));
  assert.equal(await scalar('select count from storefront_submission_limits where key=$1', ['a'.repeat(64)]), 1);
});
await test('newsletter requires consent and deduplicates normalized email', async () => asRole('service_role', async () => {
  await denied(() => query("select submit_storefront_form('newsletter', $1::jsonb, $2)", [JSON.stringify({ email: 'mail@example.test' }), 'b'.repeat(64)]), /consent required/);
  for (const email of ['MAIL@EXAMPLE.TEST', 'mail@example.test']) {
    assert.equal(await scalar("select submit_storefront_form('newsletter', $1::jsonb, $2)", [JSON.stringify({ email, consent: true }), 'b'.repeat(64)]), 'saved');
  }
  assert.equal(await scalar("select count(*)::int from newsletter_subscribers where email='mail@example.test'"), 1);
}));
await test('private contact and newsletter rows deny anonymous reads', () => asRole('anon', async () => {
  for (const table of ['contact_messages', 'newsletter_subscribers', 'storefront_submission_limits']) {
    await denied(() => query(`select * from ${table}`));
  }
}));

const customer = '10000000-0000-4000-8000-000000000001';
const other = '10000000-0000-4000-8000-000000000002';
const product = '20000000-0000-4000-8000-000000000001';
const otherProduct = '20000000-0000-4000-8000-000000000002';
const variant = '30000000-0000-4000-8000-000000000001';
await query(`insert into auth.users(id,email,raw_user_meta_data) values
  ($1,'customer@example.test','{"role":"admin","full_name":"Customer"}'),
  ($2,'other@example.test','{}')`, [customer, other]);
await query(`insert into profiles(id,email,role) values ($1,'customer@example.test','customer'), ($2,'other@example.test','customer') on conflict(id) do nothing`, [customer, other]);
await query(`insert into products(id,name,slug,sku,status,base_price) values
  ($1,'Test Product','test-product','SQL-P1','active',100),
  ($2,'Other Product','other-product','SQL-P2','active',200)`, [product, otherProduct]);
await query(`insert into product_variants(id,product_id,sku,price,stock_quantity) values ($1,$2,'SQL-V1',100,10)`, [variant, product]);

await test('user-controlled signup metadata does not grant admin role', async () => {
  assert.equal(await scalar('select role from profiles where id=$1', [customer]), 'customer');
});
await test('authenticated user can edit own display name but not another profile', async () => asRole('authenticated', async () => {
  const own = await query('update profiles set full_name=$1 where id=$2 returning id', ['Allowed name', customer]);
  assert.equal(own.rows.length, 1);
  const foreign = await query('update profiles set full_name=$1 where id=$2 returning id', ['Intruder', other]);
  assert.equal(foreign.rows.length, 0);
}, customer));
await test('authenticated customer cannot escalate own profile role', async () => {
  await asRole('authenticated', async () => {
    try { await query("update profiles set role='admin' where id=$1", [customer]); }
    catch (error) { assert.match(error.message, /permission denied|role|privilege|policy/i); }
  }, customer);
  assert.equal(await scalar('select role from profiles where id=$1', [customer]), 'customer');
});
await test('profile identity and privileged provisioning deny client writes', async () => {
  await asRole('authenticated', async () => {
    await denied(() => query("update profiles set email='forged@example.test' where id=$1", [customer]));
    await denied(() => query('update profiles set id=$1 where id=$2', [other, customer]));
    await denied(() => query('delete from profiles where id=$1', [customer]));
    await denied(() => query("insert into profiles(id,email) values(gen_random_uuid(),'forged@example.test')"));
  }, customer);
  await asRole('anon', () => denied(() => query('select private.provision_profile()')));
});
await test('anonymous catalog hides cost and unpublished/deleted/inactive children', async () => {
  await query("insert into product_images(product_id,url) values($1,'https://example.test/image.jpg')", [otherProduct]);
  await query("insert into product_variants(product_id,sku,price) values($1,'SQL-V2',200)", [otherProduct]);
  await query("insert into product_options(product_id,name) values($1,'Size')", [otherProduct]);
  await asRole('anon', async () => {
    await denied(() => query('select cost_price from products'));
    assert.equal(await scalar('select count(*)::int from product_images where product_id=$1', [otherProduct]), 1);
  });
  for (const mutation of ["status='draft'", "status='active', deleted_at=now()"] ) {
    await query(`update products set ${mutation} where id=$1`, [otherProduct]);
    await asRole('anon', async () => {
      for (const table of ['product_images', 'product_options', 'product_variants']) {
        assert.equal(await scalar(`select count(*)::int from ${table} where product_id=$1`, [otherProduct]), 0);
      }
    });
  }
  await query("update products set status='active',deleted_at=null where id=$1", [otherProduct]);
  await query('update product_variants set is_active=false where product_id=$1', [otherProduct]);
  await asRole('anon', async () => assert.equal(await scalar('select count(*)::int from product_variants where product_id=$1', [otherProduct]), 0));
});

let orderSequence = 0;
async function createOrder(items, role = 'service_role') {
  const orderNumber = `SQL-${++orderSequence}`;
  return asRole(role, async () => (await query(`select * from create_order_with_stock_check(
    $1, $2::uuid, 'customer@example.test', '0812345678',
    (select array_agg(row(x.product_id,x.variant_id,x.quantity)::order_item_input)
     from jsonb_to_recordset($3::jsonb) as x(product_id uuid,variant_id uuid,quantity integer)),
    '{}'::jsonb, 'promptpay', 'standard', 99999, 99999, null, null
  )`, [orderNumber, customer, JSON.stringify(items)])).rows[0], customer);
}
const item = quantity => ({ product_id: product, variant_id: variant, quantity });
await test('anon cannot execute privileged order creation', () => denied(() => createOrder([item(1)], 'anon')));
await test('authenticated clients cannot execute privileged order creation', () => denied(() => createOrder([item(1)], 'authenticated')));
await test('order creation rejects zero, negative, null, empty quantities atomically', async () => {
  for (const items of [[item(0)], [item(-1)], [item(null)], []]) {
    await assert.rejects(() => createOrder(items));
  }
  assert.equal(await scalar('select stock_quantity from product_variants where id=$1', [variant]), 10);
  assert.equal(await scalar('select count(*)::int from orders'), 0);
});
await test('order creation rejects variant/product mismatch', async () => {
  await assert.rejects(() => createOrder([{ ...item(1), product_id: otherProduct }]));
  assert.equal(await scalar('select stock_quantity from product_variants where id=$1', [variant]), 10);
});
await test('duplicate order lines cannot oversell stock', async () => {
  await assert.rejects(() => createOrder([item(6), item(6)]));
  assert.equal(await scalar('select stock_quantity from product_variants where id=$1', [variant]), 10);
});
await test('order uses database prices and shipping, decrements exactly once', async () => {
  const order = await createOrder([item(2)]);
  assert.ok(order.order_id);
  const persisted = (await query('select subtotal,discount_amount,shipping_fee,grand_total from orders where id=$1', [order.order_id])).rows[0];
  assert.equal(Number(persisted.subtotal), 200);
  assert.equal(Number(persisted.discount_amount), 0);
  assert.ok(Number(persisted.shipping_fee) >= 0 && Number(persisted.shipping_fee) < 99999);
  assert.equal(Number(persisted.grand_total), 200 + Number(persisted.shipping_fee));
  assert.equal(await scalar('select stock_quantity from product_variants where id=$1', [variant]), 8);
});

await test('duplicate lines within stock aggregate into one order item', async () => {
  const order = await createOrder([item(1), item(2)]);
  assert.equal(await scalar('select count(*)::int from order_items where order_id=$1', [order.order_id]), 1);
  assert.equal(await scalar('select quantity from order_items where order_id=$1', [order.order_id]), 3);
  assert.equal(await scalar('select stock_quantity from product_variants where id=$1', [variant]), 5);
});
await test('soft-deleted product cannot be ordered', async () => {
  await query('update products set deleted_at=now() where id=$1', [product]);
  try { await assert.rejects(() => createOrder([item(1)]), /variant_not_found|product.*unavailable|deleted/i); }
  finally { await query('update products set deleted_at=null where id=$1', [product]); }
});

const payableOrder = await createOrder([item(1)]);
const secondOrder = await createOrder([item(1)]);
let reservation;
const reserve = id => asRole('service_role', () => scalar('select reserve_order_payment($1,$2)', [id, 'stripe']));
await test('reservation acquires once and retains authoritative amount', async () => {
  reservation = await reserve(payableOrder.order_id);
  assert.equal(reservation.acquired, true);
  const again = await reserve(payableOrder.order_id);
  assert.equal(again.acquired, false);
  assert.equal(again.payment.id, reservation.payment.id);
  assert.equal(Number(reservation.payment.amount), Number(payableOrder.grand_total));
  assert.equal(await scalar('select count(*)::int from payments where order_id=$1', [payableOrder.order_id]), 1);
  await assert.rejects(() => query("insert into payments(order_id,provider,method,amount) values($1,'stripe','promptpay',150)", [payableOrder.order_id]), /unique|duplicate/);
});
const finish = (response = { status: 'pending' }) => asRole('service_role', () => query('select finish_order_payment($1,$2,$3,$4::jsonb)', [reservation.payment.id, 'cs_sql', 'pi_sql', JSON.stringify(response)]));
const paymentState = async () => (await query('select status,refunded_amount_minor from payments where id=$1', [reservation.payment.id])).rows[0];
const orderState = async () => (await query('select status,payment_status,paid_at from orders where id=$1', [payableOrder.order_id])).rows[0];
async function event(overrides = {}, role = 'service_role') {
  const p = { provider: 'stripe', id: 'evt_sql_paid', payment: reservation.payment.id, order: payableOrder.order_id,
    transaction: 'cs_sql', intent: 'pi_sql', type: 'payment.succeeded', amount: Math.round(Number(payableOrder.grand_total) * 100), currency: 'THB', refunded: 0, ...overrides };
  return asRole(role, () => scalar('select apply_payment_event($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', Object.values(p)));
}
await test('anon and authenticated cannot execute payment mutation RPCs', async () => {
  for (const role of ['anon', 'authenticated']) {
    await asRole(role, async () => {
      await denied(() => query('select reserve_order_payment($1,$2)', [payableOrder.order_id, 'stripe']));
      await denied(() => query('select finish_order_payment($1,$2,$3,$4::jsonb)', [reservation.payment.id, 'cs_sql', 'pi_sql', '{}']));
    });
    await denied(() => event({}, role));
  }
});
await test('browser response cannot mark an order paid', async () => {
  await finish({ status: 'paid' });
  assert.equal((await paymentState()).status, 'pending');
  assert.equal((await orderState()).payment_status, 'unpaid');
});
await test('events reject mismatched mapping, amount, currency and transaction atomically', async () => {
  for (const overrides of [
    { order: secondOrder.order_id }, { provider: 'omise' }, { amount: 1 }, { currency: 'USD' },
    { transaction: 'cs_wrong' }, { intent: 'pi_wrong' }, { transaction: null, intent: null },
    { type: 'payment.refunded', refunded: 999999 }, { type: 'payment.refunded', refunded: -1 },
    { type: 'payment.refunded', refunded: 0 }
  ]) await assert.rejects(() => event(overrides), /mismatch|invalid_refund/);
  assert.equal(await scalar('select count(*)::int from payment_events'), 0);
  assert.equal((await orderState()).payment_status, 'unpaid');
});
await test('valid payment succeeds exactly once and duplicate is inert', async () => {
  assert.equal(await event(), 'applied');
  const paid = await orderState();
  assert.equal(paid.status, 'paid'); assert.equal(paid.payment_status, 'paid'); assert.ok(paid.paid_at);
  assert.equal(await event(), 'duplicate');
  assert.deepEqual(await orderState(), paid);
  assert.equal(await scalar('select count(*)::int from payment_events'), 1);
});
await test('late failure and browser finish cannot regress paid financial state', async () => {
  await event({ id: 'evt_sql_failed', type: 'payment.failed' });
  await finish({ status: 'failed' });
  assert.equal((await paymentState()).status, 'paid');
  assert.equal((await orderState()).payment_status, 'paid');
});
await test('partial refunds use cumulative maximum and preserve shipped fulfillment', async () => {
  await query("update orders set status='shipped' where id=$1", [payableOrder.order_id]);
  await event({ id: 'evt_refund_5000', type: 'payment.refunded', refunded: 5000 });
  await event({ id: 'evt_refund_2000', type: 'payment.refunded', refunded: 2000 });
  await event({ id: 'evt_late_paid', type: 'payment.succeeded' });
  await event({ id: 'evt_late_failed', type: 'payment.failed' });
  assert.equal(Number((await paymentState()).refunded_amount_minor), 5000);
  assert.equal((await paymentState()).status, 'partially_refunded');
  assert.equal((await orderState()).payment_status, 'partially_refunded');
  assert.equal((await orderState()).status, 'shipped');
});
await test('full refund remains terminal after older partial refund and late paid event', async () => {
  await event({ id: 'evt_full_refund', type: 'payment.refunded', refunded: Math.round(Number(payableOrder.grand_total) * 100) });
  await event({ id: 'evt_old_partial', type: 'payment.refunded', refunded: 1000 });
  await event({ id: 'evt_paid_after_refund' });
  await finish({ status: 'pending' });
  assert.equal((await paymentState()).status, 'refunded');
  assert.equal((await orderState()).payment_status, 'refunded');
  assert.equal((await orderState()).status, 'refunded');
});
await test('clients cannot bypass authoritative order RPC with direct forged inserts', async () => {
  try {
    for (const role of ['anon', 'authenticated']) {
      await asRole(role, () => denied(() => query(`insert into orders
        (order_number,user_id,email,phone,status,payment_status,subtotal,grand_total,shipping_address,payment_method,shipping_method)
        values($1,$2,'forged@example.test','0812345678','paid','paid',1,1,'{}','cod','standard')`,
        [`FORGED-${role}`, role === 'authenticated' ? customer : null])), customer);
    }
  } finally { await query("delete from orders where order_number like 'FORGED-%'"); }
});
const onceKey = '40000000-0000-4000-8000-000000000001';
const guestKey = '40000000-0000-4000-8000-000000000002';
const onceRequest = orderNumber => ({ orderNumber, email: 'once@example.test', phone: '0812345678',
  items: [{ productId: product, variantId: variant, quantity: 1 }], shippingAddress: {},
  paymentMethod: 'promptpay', shippingMethod: 'standard' });
async function once(key, hash, owner, guestHash, request, role = 'service_role') {
  return asRole(role, () => scalar('select create_order_once($1,$2,$3,$4,$5::jsonb)', [key, hash, owner, guestHash, JSON.stringify(request)]));
}
await test('checkout nonce replays without repeating stock or order creation', async () => {
  const before = await scalar('select stock_quantity from product_variants where id=$1', [variant]);
  const first = await once(onceKey, 'c'.repeat(64), customer, null, onceRequest('SQL-ONCE'));
  const replay = await once(onceKey, 'c'.repeat(64), customer, null, onceRequest('SQL-ONCE'));
  assert.equal(first.replayed, false); assert.equal(replay.replayed, true);
  assert.equal(first.order_id, replay.order_id);
  assert.equal(await scalar('select stock_quantity from product_variants where id=$1', [variant]), before - 1);
  assert.equal(await scalar("select count(*)::int from orders where order_number='SQL-ONCE'"), 1);
  await assert.rejects(() => once(onceKey, 'd'.repeat(64), customer, null, onceRequest('SQL-ONCE')), /idempotency_conflict/);
  await assert.rejects(() => once(onceKey, 'c'.repeat(64), other, null, onceRequest('SQL-ONCE')), /idempotency_conflict/);
});
await test('guest capability commits with order and protects nonce replay', async () => {
  const first = await once(guestKey, 'e'.repeat(64), null, 'f'.repeat(64), onceRequest('SQL-GUEST'));
  assert.equal(await scalar('select token_hash from order_payment_access where order_id=$1', [first.order_id]), 'f'.repeat(64));
  assert.equal((await once(guestKey, 'e'.repeat(64), null, 'f'.repeat(64), onceRequest('SQL-GUEST'))).replayed, true);
  await assert.rejects(() => once(guestKey, 'e'.repeat(64), null, 'a'.repeat(64), onceRequest('SQL-GUEST')), /guest_access_expired/);
  await query("update order_payment_access set expires_at=now()-interval '1 second' where order_id=$1", [first.order_id]);
  await assert.rejects(() => once(guestKey, 'e'.repeat(64), null, 'f'.repeat(64), onceRequest('SQL-GUEST')), /guest_access_expired/);
});
await test('checkout nonce wrapper and capabilities deny client access', async () => {
  for (const role of ['anon', 'authenticated']) {
    await denied(() => once(onceKey, 'c'.repeat(64), customer, null, onceRequest('SQL-ONCE'), role));
    await asRole(role, async () => {
      await denied(() => query('select * from order_creation_requests'));
      await denied(() => query('select * from order_payment_access'));
    });
  }
});

console.log(`\n${passed} passed; ${failures.length} failed; ${migrations.length} migrations applied.`);
await db.close();
if (failures.length) process.exitCode = 1;
