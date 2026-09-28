# Production readiness and shopping experience

Approved scope: secure payments and verified webhooks; real catalog and authentication; persisted contact/newsletter; CI and accurate documentation; interactive product studio; order timeline/reorder; PWA offline shell; Thai/English throughout UI.

Base: PR #3, tree dde88e64c2c79b35d7f3544b3ab8dfc81fdd1576. Keep existing mock demo, routes and design. No live payment, remote database mutation, merge or production deployment.

Tasks and ownership:
1. Payment agent: server-authoritative order payment, owner/guest capability, database reservation, Stripe/Omise events. Tests: unauthorized access, amount/currency mismatch, duplicate requests/events, monotonic states. Checkout consumes {orderId} / {orderId,token}.
2. Catalog/auth agent: public catalog mapping and real auth flows, safe roles/profile creation. Tests: real-mode mapping and auth failures/session behavior. Providers mounts AuthInit.
3. Root: persistent contact/newsletter, secure order reading/account history, status timeline and current-stock reorder. Tests: invalid/unavailable submissions never succeed, consent, terminal timeline states, unavailable variants.
4. Studio/PWA agent: variant-linked preview/AR/dimensions, image fallback, manifest/icons/offline shell. Never cache private/auth/payment data. Providers mounts PwaRegister.
5. i18n agent + each owner: translate user-facing content/errors without mutating the DOM. Root integration checks English forms and checkout.
6. Root: CI, migrations verification, docs/environment setup; full unit/lint/build/browser checks; independent review then publish PR update.

Acceptance: production credentials select real services; missing services fail explicitly. Payment totals/ownership from server; ambiguous gateway result cannot create another charge; webhooks reconcile once. No form reports success before durable write. Mobile layout stays usable. Mock checkout regression remains green. PR records exact external setup and validation limits.

Integration contracts: order authorization exported from lib/payments/server; auth/catalog do not import service role into client bundles; migration names generated using Supabase CLI; shared types extended without breaking mocks. Remote services only activated after user supplies configuration and runs migrations.

Review focus: guest IDOR, duplicate/ambiguous payments, out-of-order events/refunds, privileged SQL callable by anon, real-mode fallback to mock, PWA personal data cache, untranslated errors, truthful loading/pending status.
