# SpinShop 360 — Production Checklist

Do not accept real customer payments until every item in **Required before launch** is complete.

## Required before launch

### 1. Apply database migrations

Apply all migrations in order, including the security and reservation hardening migrations:

```bash
supabase db push
```

Required latest files:

- `0006_security_order_payment_hardening.sql`
- `0007_reservation_expiry_integrity.sql`

After applying them, regenerate database types from the linked project when Supabase CLI access is available:

```bash
supabase gen types typescript --linked > types/database.ts
```

### 2. Configure environment variables

Start from `.env.example`. Production must include at least:

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CHECKOUT_SIGNING_SECRET
CRON_SECRET
```

Generate independent random secrets:

```bash
openssl rand -base64 48
```

Never expose `SUPABASE_SERVICE_ROLE_KEY`, payment secret keys, webhook secrets, `CHECKOUT_SIGNING_SECRET`, or `CRON_SECRET` through a `NEXT_PUBLIC_` variable.

### 3. Configure a real payment provider

Set either Stripe or Omise test credentials first. Mock payment is rejected in Production unless `ALLOW_MOCK_PAYMENTS=true`; leave that variable false for a public store.

#### Stripe

Configure:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

Register the webhook endpoint:

```text
https://YOUR_DOMAIN/api/webhooks/stripe
```

Subscribe at minimum to:

- `checkout.session.completed`
- `payment_intent.payment_failed`
- `charge.refunded`

#### Omise / Opn

Configure:

```text
OMISE_SECRET_KEY
NEXT_PUBLIC_OMISE_PUBLIC_KEY
```

Register:

```text
https://YOUR_DOMAIN/api/webhooks/omise
```

The webhook handler treats the incoming event only as a notification and re-fetches the charge from Omise before changing an order.

### 4. Configure reservation cleanup

Set `CRON_SECRET` in Vercel. `vercel.json` schedules:

```text
/api/cron/release-stock
```

The endpoint releases expired reservations, cancels unpaid online orders, and restores coupon usage. Expired reservations are excluded from availability checks even before cleanup runs.

### 5. Configure transactional email

Set:

```text
RESEND_API_KEY
RESEND_FROM_EMAIL
CONTACT_TO_EMAIL
```

Verify the sender domain before enabling customer-facing email.

### 6. Verify Supabase authorization

Use separate accounts for customer, staff, and admin. Confirm:

- A customer cannot change `profiles.role`.
- A customer cannot insert or update orders, payments, coupon usages, or activity logs directly.
- A customer can read only their own signed-in orders.
- A guest can read only the order for which the browser has the signed confirmation cookie.
- Staff/admin API routes reject customer sessions.
- Coupon codes cannot be enumerated through the public Supabase API.

### 7. Test payment and stock race conditions

In payment-provider test mode, verify:

- Two customers competing for the final unit cannot both reserve it.
- Duplicate cart lines for the same variant are aggregated.
- Changing request-side price, discount, shipping fee, amount, currency, or order number does not change the server result.
- A successful verified webhook finalizes stock exactly once.
- A duplicate webhook is idempotent.
- A late webhook after reservation expiry does not mark an order paid.
- A failed or abandoned payment releases the reservation after expiry.
- A refunded payment updates the order and payment records.

### 8. Run quality gates

```bash
npm ci
npm run lint
npm run test
npm run build
```

The repository CI runs the same lint, unit-test, and build gates for pushes and pull requests.

## Recommended before launch

- Replace the in-memory API rate limiter with a shared Redis-backed limiter for multi-instance Vercel deployments.
- Run Playwright E2E tests against a seeded Preview environment.
- Add CSP and provider-specific security headers after confirming every external asset domain.
- Compress GLB/GLTF models and textures; test iOS Quick Look and Android Scene Viewer.
- Add monitoring alerts for payment webhook failures, reservation cleanup failures, and negative/low stock.
- Complete legal, return, privacy, shipping, and tax content for the actual merchant.
- Replace all demonstration product imagery and external example 3D assets before launch.

## Rollback guidance

Application rollback is safe through Vercel, but database migrations are forward-only operational changes. Before production migration:

1. Back up the database.
2. Test migrations against a staging copy.
3. Record the previous policies/functions.
4. Deploy database changes before enabling the application code that calls the new RPCs.
5. Keep payment providers in test mode until end-to-end verification passes.
