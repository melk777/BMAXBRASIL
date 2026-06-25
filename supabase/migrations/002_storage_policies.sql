insert into storage.buckets (id, name, public)
values
  ('product-media', 'product-media', true),
  ('site-media', 'site-media', true)
on conflict (id) do nothing;

create policy "public can read product media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-media');

create policy "admins can upload product media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-media' and public.is_admin());

create policy "admins can update product media"
on storage.objects for update
to authenticated
using (bucket_id = 'product-media' and public.is_admin())
with check (bucket_id = 'product-media' and public.is_admin());

create policy "admins can delete product media"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-media' and public.is_admin());

create policy "public can read site media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'site-media');

create policy "admins can upload site media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'site-media' and public.is_admin());

create policy "admins can update site media"
on storage.objects for update
to authenticated
using (bucket_id = 'site-media' and public.is_admin())
with check (bucket_id = 'site-media' and public.is_admin());

create policy "admins can delete site media"
on storage.objects for delete
to authenticated
using (bucket_id = 'site-media' and public.is_admin());
