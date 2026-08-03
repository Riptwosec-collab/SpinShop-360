-- ============================================================================
-- SpinShop 360 — Enable Realtime
--
-- Broadcasts row changes on these tables to subscribed clients so the Admin
-- Dashboard can show live stock levels and new orders without polling.
-- ============================================================================

alter publication supabase_realtime add table product_variants;
alter publication supabase_realtime add table orders;

-- product_variants updates are broadcast with full row data (before + after)
-- so the client can tell exactly which field changed without a follow-up
-- fetch.
alter table product_variants replica identity full;
alter table orders replica identity full;
