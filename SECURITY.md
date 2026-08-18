# Security Policy

## Reporting a vulnerability

Do not open a public issue containing exploit details, credentials, customer data, or payment information.

Report privately to the repository owner with:

- affected route, component, migration, or dependency
- reproduction steps
- expected and actual behavior
- impact assessment
- suggested remediation, when available

Do not test against real customer accounts, real payment credentials, or systems you do not own.

## Supported configuration

Security fixes target the latest `main` branch and the currently deployed production version. Production deployments must:

- set `NEXT_PUBLIC_USE_MOCK_DATA=false`
- use a real Supabase project with all migrations applied
- use a unique `CHECKOUT_SIGNING_SECRET`
- keep `SUPABASE_SERVICE_ROLE_KEY` server-only
- keep `ALLOW_MOCK_PAYMENTS=false`
- verify Stripe signatures or re-fetch Omise charges before changing payment state
- run reservation cleanup with an authenticated cron request

See `docs/PRODUCTION_CHECKLIST.md` for the complete launch checklist.

## Security boundaries

- Client-side guards are usability controls, not authorization boundaries.
- Admin authorization is verified against `profiles.role` on the server.
- Product prices, discounts, shipping fees, payment amounts, and stock are derived from trusted database records.
- Guest order viewing and payment initiation require signed, expiring HttpOnly cookies.
- Orders, payments, coupon usages, and audit logs are server-owned database resources.

## Secrets

Never commit or expose:

- Supabase service-role keys
- Stripe or Omise secret keys
- webhook secrets
- checkout signing secrets
- cron secrets
- Resend API keys
- Sentry auth tokens

Rotate a secret immediately if it is committed, logged, sent to a browser, or shared through an insecure channel.
