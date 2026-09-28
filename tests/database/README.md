# Local PostgreSQL migration validation

Run from the repository root:

```sh
npm run test:db
```

`validate.mjs` uses the pinned development dependency `@electric-sql/pglite`
(PostgreSQL compiled to WebAssembly). Every run creates a fresh isolated database,
applies all SQL files in `supabase/migrations` in filename order, executes real
SQL assertions, prints individual results, and exits nonzero on a failure.
No hosted database, service keys, native PostgreSQL or Docker are needed.

For an externally installed copy, set `PGLITE_MODULE` to its absolute
`dist/index.js` path. This is optional; normal runs use the repository dependency.

## Coverage

- Actual grants, RLS and profile provisioning: user-editable metadata cannot
  assign staff/admin, allowed own-profile edits work, another user's profile is
  protected, and identity/role/provisioning mutations are denied.
- Catalog cost privacy and child-row visibility for draft/deleted products and
  inactive variants.
- Server-only order RPC, invalid quantities, variant/product mismatch, duplicate
  aggregation, stock bounds, authoritative totals and soft deletion.
- One durable payment reservation per order, gateway/order/amount/currency
  matching, event deduplication, paid-state protection, cumulative partial/full
  refunds, fulfillment preservation and a late browser response.
- Committed contact rows, rate-limit threshold/reset, newsletter consent and
  deduplication, and private submission table access.

## Harness substitutions and limits

- `auth.users` is a minimal fixture table. `auth.uid()`, `auth.role()` and
  `auth.jwt()` read harness-controlled session settings. `SET ROLE` runs queries
  as non-superuser `anon`/`authenticated`; `service_role` has `BYPASSRLS`, as in
  Supabase. JWT signing, session refresh, Auth HTTP endpoints and PostgREST are
  not emulated.
- Default grants are installed **before** migrations, modeling an existing
  Supabase project with broad public-schema defaults. Revokes and column-level
  grants in migrations therefore remain effective and are tested. A newer
  project's stricter default-privilege configuration is not separately modeled.
- Storage schemas/tables, `storage.foldername`, and a Realtime publication are
  minimal migration prerequisites. The actual Storage API, object bytes, and
  Realtime streaming are not exercised.
- PGlite does not bundle `uuid-ossp`. The harness strips its extension statement
  and substitutes `uuid_generate_v4()` with PostgreSQL's `gen_random_uuid()` in
  memory. Migration files on disk are never changed. All other SQL is applied
  without rewriting it.
- These are single-connection database tests. They verify uniqueness constraints,
  atomic SQL failures and sequential idempotency; they do not prove concurrent
  row-lock/deadlock behavior across independent PostgreSQL sessions. Run staging
  concurrency tests before production payment launch.
- “Committed” means a successful statement is observable by subsequent SQL;
  this ephemeral test database does not exercise disk-loss/crash recovery.
- Gateway webhook signature verification and HTTP routes belong to unit/API
  tests. This suite exercises the database event handlers with supplied gateway
  identities; it does not contact Stripe or Omise or charge anyone.
