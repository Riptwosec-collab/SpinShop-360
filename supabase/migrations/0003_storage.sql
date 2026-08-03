-- ============================================================================
-- SpinShop 360 — Storage buckets
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('product-models', 'product-models', true),
  ('product-360', 'product-360', true),
  ('review-images', 'review-images', true),
  ('avatars', 'avatars', true),
  ('brand-assets', 'brand-assets', true),
  ('category-assets', 'category-assets', true)
on conflict (id) do nothing;

-- Public read for all product/brand/category assets
create policy "public_read_product_assets" on storage.objects
  for select using (
    bucket_id in ('product-images', 'product-models', 'product-360', 'brand-assets', 'category-assets', 'avatars')
  );

-- Only staff/admin can upload/modify product-related assets
create policy "staff_write_product_assets" on storage.objects
  for insert with check (
    bucket_id in ('product-images', 'product-models', 'product-360', 'brand-assets', 'category-assets')
    and is_staff_or_admin()
  );

create policy "staff_update_product_assets" on storage.objects
  for update using (
    bucket_id in ('product-images', 'product-models', 'product-360', 'brand-assets', 'category-assets')
    and is_staff_or_admin()
  );

create policy "staff_delete_product_assets" on storage.objects
  for delete using (
    bucket_id in ('product-images', 'product-models', 'product-360', 'brand-assets', 'category-assets')
    and is_staff_or_admin()
  );

-- Users can upload their own avatar into a folder named after their user id
-- e.g. avatars/{user_id}/photo.jpg
create policy "user_upload_own_avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user_update_own_avatar" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can upload review images only into their own folder
-- e.g. review-images/{user_id}/{review_id}/photo.jpg
create policy "user_upload_own_review_image" on storage.objects
  for insert with check (
    bucket_id = 'review-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "public_read_review_images" on storage.objects
  for select using (bucket_id = 'review-images');
