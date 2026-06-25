insert into public.categories (name, slug, description, status, sort_order)
values
  ('iPhone 17', 'iphone-17', 'Modelos do lote exclusivo BMAX Brasil.', 'active', 1)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    status = excluded.status,
    sort_order = excluded.sort_order;

with category as (
  select id from public.categories where slug = 'iphone-17'
),
seed_products as (
  select *
  from (values
    ('iphone-17-pro-max-256gb', 'Celular Apple iPhone 17 Pro Max 256GB', 9195.00, 8735.00, 12, 1, array['iphone','17','pro max','256gb'], '{"colors":[{"name":"Preto","hex":"#2F333A","image":"assets/iphone17/deep-blue.png"},{"name":"Branco","hex":"#E3E4E6","image":"assets/iphone17/silver.png"},{"name":"Laranja","hex":"#D86927","image":"assets/iphone17/cosmic-orange.png"}]}'::jsonb),
    ('iphone-17-256gb', 'Celular Apple iPhone 17 256GB', 5717.00, 5431.00, 18, 2, array['iphone','17','256gb'], '{"colors":[{"name":"Branco","hex":"#F8F9FA","image":"assets/iphone17/base/white.png"},{"name":"Preto","hex":"#2D3134","image":"assets/iphone17/base/black.png"},{"name":"Rosa","hex":"#E6D0E7","image":"assets/iphone17/base/pink.png"},{"name":"Verde","hex":"#C0DEB9","image":"assets/iphone17/base/green.png"},{"name":"Azul","hex":"#A7C1D9","image":"assets/iphone17/base/blue.png"}]}'::jsonb),
    ('iphone-17-pro-256gb', 'Celular Apple iPhone 17 Pro 256GB', 8372.00, 7955.00, 10, 3, array['iphone','17','pro','256gb'], '{"colors":[{"name":"Branco","hex":"#E3E4E6","image":"assets/iphone17pro/white.png"},{"name":"Preto","hex":"#2F333A","image":"assets/iphone17pro/black.png"},{"name":"Laranja","hex":"#D86927","image":"assets/iphone17pro/orange.png"}]}'::jsonb),
    ('iphone-17-pro-max-512gb', 'Celular Apple iPhone 17 Pro Max 512GB', 11035.00, 10483.00, 9, 4, array['iphone','17','pro max','512gb'], '{"colors":[{"name":"Laranja","hex":"#D86927","image":"assets/iphone17/cosmic-orange.png"},{"name":"Preto","hex":"#2F333A","image":"assets/iphone17/deep-blue.png"},{"name":"Branco","hex":"#E3E4E6","image":"assets/iphone17/silver.png"}]}'::jsonb),
    ('iphone-17-pro-512gb', 'Celular Apple iPhone 17 Pro 512GB', 9951.00, 9454.00, 10, 5, array['iphone','17','pro','512gb'], '{"colors":[{"name":"Laranja","hex":"#D86927","image":"assets/iphone17/cosmic-orange.png"},{"name":"Preto","hex":"#2F333A","image":"assets/iphone17/deep-blue.png"},{"name":"Branco","hex":"#E3E4E6","image":"assets/iphone17/silver.png"}]}'::jsonb),
    ('iphone-17-pro-max-1tb', 'Celular Apple iPhone 17 Pro Max 1TB', 11770.00, 11181.00, 6, 6, array['iphone','17','pro max','1tb'], '{"colors":[{"name":"Laranja","hex":"#D86927","image":"assets/iphone17/cosmic-orange.png"},{"name":"Preto","hex":"#2F333A","image":"assets/iphone17/deep-blue.png"},{"name":"Branco","hex":"#E3E4E6","image":"assets/iphone17/silver.png"}]}'::jsonb),
    ('iphone-17-pro-1tb', 'Celular Apple iPhone 17 Pro 1TB', 11067.00, 10514.00, 7, 7, array['iphone','17','pro','1tb'], '{"colors":[{"name":"Preto","hex":"#2F333A","image":"assets/iphone17/deep-blue.png"},{"name":"Laranja","hex":"#D86927","image":"assets/iphone17/cosmic-orange.png"},{"name":"Branco","hex":"#E3E4E6","image":"assets/iphone17/silver.png"}]}'::jsonb),
    ('iphone-17e-256gb', 'Celular Apple iPhone 17e 256GB', 4066.00, 3862.00, 17, 8, array['iphone','17e','256gb'], '{"colors":[{"name":"Rosa","hex":"#E6D0E7","image":"assets/iphone17e/pink.png"},{"name":"Preto","hex":"#2D3134","image":"assets/iphone17e/black.png"},{"name":"Branco","hex":"#F8F9FA","image":"assets/iphone17e/white.png"}]}'::jsonb),
    ('iphone-air-256gb', 'Celular Apple iPhone Air 256GB', 6112.00, 5806.00, 8, 9, array['iphone','air','256gb'], '{"colors":[{"name":"Preto","hex":"#2D3134","image":"assets/iphoneair/black.png"},{"name":"Branco","hex":"#F8F9FA","image":"assets/iphoneair/white.png"},{"name":"Azul Claro","hex":"#92B2D6","image":"assets/iphoneair/light-blue.png"}]}'::jsonb)
  ) as p(slug, name, price, promotional_price, stock, sort_order, tags, metadata)
)
insert into public.products (
  category_id, slug, name, short_description, description, price,
  promotional_price, stock, status, tags, sort_order, metadata
)
select
  category.id,
  seed_products.slug,
  seed_products.name,
  'Importacao direta, pronta entrega nacional e lote limitado.',
  'Produto do lote exclusivo BMAX Brasil com despacho prioritario de Sao Paulo para todo o Brasil.',
  seed_products.price,
  seed_products.promotional_price,
  seed_products.stock,
  'active',
  seed_products.tags,
  seed_products.sort_order,
  seed_products.metadata
from seed_products, category
on conflict (slug) do update
set name = excluded.name,
    price = excluded.price,
    promotional_price = excluded.promotional_price,
    stock = excluded.stock,
    tags = excluded.tags,
    sort_order = excluded.sort_order,
    metadata = excluded.metadata,
    status = excluded.status;

insert into public.product_images (product_id, storage_path, public_url, alt_text, is_main, sort_order)
select p.id, color_item->>'image', color_item->>'image', p.name, (ordinality = 1), ordinality - 1
from public.products p
cross join lateral jsonb_array_elements(p.metadata->'colors') with ordinality as colors(color_item, ordinality)
where p.slug in (
  'iphone-17-pro-max-256gb', 'iphone-17-256gb', 'iphone-17-pro-256gb',
  'iphone-17-pro-max-512gb', 'iphone-17-pro-512gb', 'iphone-17-pro-max-1tb',
  'iphone-17-pro-1tb', 'iphone-17e-256gb', 'iphone-air-256gb'
)
on conflict do nothing;

insert into public.site_settings (key, value)
values
  ('brand', '{"name":"BmaxBrasil","footer_name":"Importacao Premium","logo_url":"","site_url":"https://bmaxbrasiloficial.com.br"}'::jsonb),
  ('contact', '{"email":"","whatsapp":"","phone":"","address":"Sao Paulo, SP"}'::jsonb),
  ('social', '{"instagram":"","facebook":"","tiktok":"","youtube":""}'::jsonb),
  ('home', '{"stock_label":"Disponibilidade Restrita","stock_count":150,"catalog_title":"Catalogo do Lote Exclusivo"}'::jsonb)
on conflict (key) do update
set value = excluded.value;
