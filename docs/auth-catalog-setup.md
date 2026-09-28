# Supabase authentication and catalog setup

Mock Mode is the default. To use the database and real authentication, set these build/deployment variables and rebuild:

```dotenv
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_APP_URL=https://your-store.example
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` remains supported for legacy public keys. A service role key is **not** required or used by public catalog queries or browser authentication. Server order/payment operations have separate requirements.

Apply all migrations in order, including `20260925174316_secure_auth_catalog.sql`. The migration adds catalog metadata, creates customer profiles for new Auth users, backfills existing Auth users, and prevents profile self-promotion. Role assignment requires a trusted service-role/database operation. Public clients may update their own name, phone and avatar only. Public catalog reads exclude cost prices and inactive/unpublished nested inventory.

Configure Supabase Auth:

1. Set **Site URL** to `NEXT_PUBLIC_APP_URL`.
2. Add these exact allowed redirect URLs for each intended environment:
   - `https://your-store.example/api/auth/callback`
   - `https://your-store.example/api/auth/callback?next=/reset-password`
3. Enable email/password login, email confirmation, and a working SMTP provider. Default confirmation links use the PKCE callback. Users must complete the default PKCE flow in the browser that initiated it.
4. For token-hash links that also support a different browser, customize **Confirm signup** to `{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=email`, and **Reset password** to `{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`.

Production auth redirects require an HTTPS `NEXT_PUBLIC_APP_URL`; missing or invalid configuration fails closed. Callback redirects allow only `/account` and `/reset-password`. An expired or reused confirmation link displays a recoverable login error. Recovery requests await Supabase before displaying success. Password updates use an authenticated recovery session and then sign out.

The auth UI initializes from Supabase `getUser()` and profile records, reacts to session changes, and signs out through Supabase. Persisted Mock Mode identities are discarded in real mode. Editable user metadata never determines authorization.

Catalog product/variant stock, option relationships, images, 360 frames, hotspots, models and approved reviews come from database tables in real mode. `specs`, `dimensions`, `material_options`, `shipping_eta_days`, `is_new` and `sold_count` are public catalog metadata columns. Empty catalogs stay empty; connection errors do not fall back to demo inventory. Review author display is deliberately generic, avoiding exposure of private profiles. Public queries use fresh uncached reads; listing filters/sorts currently operate on paginated fetched catalog rows, so very large catalogs should move filtering/aggregation into database queries.

Verification in this change includes mocked Auth/Data API contract tests and actual PostgreSQL-compatible PGLite migration/RLS execution. No live Supabase project, real email delivery, hosted PostgREST relationship queries, or production login session was available for end-to-end validation. Complete one signup → email confirmation → sign-in → password reset → sign-out smoke test against your deployed project before launch.
