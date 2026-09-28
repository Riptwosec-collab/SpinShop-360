-- Real catalog metadata and safe profile provisioning. Role changes are a
-- trusted server/database operation; ordinary profile edits cannot assign roles.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.is_staff_or_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.profiles where id = auth.uid() and role in ('staff','admin')
  );
$$;
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;
revoke all on function private.is_staff_or_admin(), private.is_admin() from public;
grant execute on function private.is_staff_or_admin(), private.is_admin() to anon, authenticated, service_role;
-- Existing policies call these wrappers. The privileged implementation lives
-- outside exposed schemas and exposes only the current caller's role predicate.
create or replace function public.is_staff_or_admin()
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.is_staff_or_admin();
$$;
create or replace function public.is_admin()
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.is_admin();
$$;
revoke all on function public.is_staff_or_admin(), public.is_admin() from public;
grant execute on function public.is_staff_or_admin(), public.is_admin() to anon, authenticated, service_role;

drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_admin_manage on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone, avatar_url, updated_at) on public.profiles to authenticated;
grant all on public.profiles to service_role;

create or replace function private.provision_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_schema <> 'auth' or tg_table_name <> 'users' or tg_op <> 'INSERT' then
    raise exception 'Invalid profile provisioning context';
  end if;
  insert into public.profiles (id,email,full_name,role)
    values (new.id,coalesce(new.email,''),left(new.raw_user_meta_data->>'full_name',200),'customer')
    on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.provision_profile() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.provision_profile();
-- Backfill existing Auth users, ignoring any editable metadata role.
insert into public.profiles (id,email,full_name,role)
select id,coalesce(email,''),left(raw_user_meta_data->>'full_name',200),'customer'
from auth.users on conflict (id) do nothing;

alter table public.products
  add column if not exists is_new boolean not null default false,
  add column if not exists material_options jsonb,
  add column if not exists specs jsonb not null default '[]',
  add column if not exists dimensions jsonb,
  add column if not exists sold_count integer not null default 0 check (sold_count >= 0),
  add column if not exists shipping_eta_days integer[] not null default array[3,7];

-- Explicit Data API grants also work on projects without automatic defaults.
-- Cost prices are never exposed to anonymous/authenticated API clients.
revoke select on public.products from anon, authenticated;
grant select (id,name,slug,short_description,description,brand_id,category_id,status,
  base_price,compare_at_price,sku,stock_quantity,low_stock_threshold,is_featured,
  is_bestseller,supports_3d,supports_360,supports_ar,model_glb_url,model_gltf_url,
  model_usdz_url,fallback_image_url,seo_title,seo_description,published_at,
  created_at,updated_at,deleted_at,is_new,material_options,specs,dimensions,
  sold_count,shipping_eta_days) on public.products to anon, authenticated;
grant select on public.categories,public.brands,public.product_images,
  public.product_360_frames,public.product_models,public.product_options,
  public.product_option_values,public.product_variants,public.variant_option_values,
  public.product_hotspots,public.reviews,public.review_images to anon, authenticated;

-- Nested rows must not reveal unpublished/deleted products through direct API calls.
drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read on public.product_images for select to anon, authenticated
  using (exists(select 1 from public.products p where p.id=product_id and p.status='active' and p.deleted_at is null));
drop policy if exists product_360_public_read on public.product_360_frames;
create policy product_360_public_read on public.product_360_frames for select to anon, authenticated
  using (exists(select 1 from public.products p where p.id=product_id and p.status='active' and p.deleted_at is null));
drop policy if exists product_models_public_read on public.product_models;
create policy product_models_public_read on public.product_models for select to anon, authenticated
  using (exists(select 1 from public.products p where p.id=product_id and p.status='active' and p.deleted_at is null));
drop policy if exists product_options_public_read on public.product_options;
create policy product_options_public_read on public.product_options for select to anon, authenticated
  using (exists(select 1 from public.products p where p.id=product_id and p.status='active' and p.deleted_at is null));
drop policy if exists product_option_values_public_read on public.product_option_values;
create policy product_option_values_public_read on public.product_option_values for select to anon, authenticated
  using (exists(select 1 from public.product_options o join public.products p on p.id=o.product_id where o.id=option_id and p.status='active' and p.deleted_at is null));
drop policy if exists product_variants_public_read on public.product_variants;
create policy product_variants_public_read on public.product_variants for select to anon, authenticated
  using (is_active and exists(select 1 from public.products p where p.id=product_id and p.status='active' and p.deleted_at is null));
drop policy if exists variant_option_values_public_read on public.variant_option_values;
create policy variant_option_values_public_read on public.variant_option_values for select to anon, authenticated
  using (exists(select 1 from public.product_variants v join public.products p on p.id=v.product_id where v.id=variant_id and v.is_active and p.status='active' and p.deleted_at is null));
drop policy if exists product_hotspots_public_read on public.product_hotspots;
create policy product_hotspots_public_read on public.product_hotspots for select to anon, authenticated
  using (is_active and exists(select 1 from public.products p where p.id=product_id and p.status='active' and p.deleted_at is null));
drop policy if exists review_images_public_read on public.review_images;
create policy review_images_public_read on public.review_images for select to anon, authenticated
  using (exists(select 1 from public.reviews r where r.id=review_id and (r.status='approved' or r.user_id=(select auth.uid()) or public.is_staff_or_admin())));
-- Review owners cannot approve their own reviews or forge verified-purchase flags.
revoke insert,update on public.reviews from authenticated;
grant insert(product_id,user_id,order_item_id,rating,title,content) on public.reviews to authenticated;
grant update(rating,title,content) on public.reviews to authenticated;
