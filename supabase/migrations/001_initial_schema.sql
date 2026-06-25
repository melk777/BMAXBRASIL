create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text not null default 'admin' check (role in ('admin', 'manager')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  price numeric(12,2) not null check (price >= 0),
  promotional_price numeric(12,2) check (promotional_price is null or promotional_price >= 0),
  stock int not null default 0 check (stock >= 0),
  sku text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  tags text[] not null default '{}',
  featured boolean not null default false,
  sort_order int not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt_text text,
  is_main boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.site_banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  image_url text,
  cta_label text,
  cta_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_views (
  id bigint generated always as identity primary key,
  product_id uuid references public.products(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  source text,
  user_agent text
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  customer_name text,
  customer_email text,
  customer_phone text,
  amount numeric(12,2),
  status text not null default 'pending',
  payment_provider text,
  payment_reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_products_status_sort on public.products(status, sort_order, created_at);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_product_images_product on public.product_images(product_id, sort_order);
create index if not exists idx_categories_status_sort on public.categories(status, sort_order);

create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = auth.uid()
      and active = true
      and role in ('admin', 'manager')
  );
$$;

alter table public.admin_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.site_settings enable row level security;
alter table public.site_banners enable row level security;
alter table public.product_views enable row level security;
alter table public.orders enable row level security;
alter table public.audit_logs enable row level security;

create policy "admins can read admin profiles"
on public.admin_profiles for select
to authenticated
using (public.is_admin() or id = auth.uid());

create policy "admins can manage admin profiles"
on public.admin_profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "public can read active categories"
on public.categories for select
to anon, authenticated
using (status = 'active');

create policy "admins can manage categories"
on public.categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "public can read active products"
on public.products for select
to anon, authenticated
using (status = 'active');

create policy "admins can manage products"
on public.products for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "public can read images of active products"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.status = 'active'
  )
);

create policy "admins can manage product images"
on public.product_images for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "public can read site settings"
on public.site_settings for select
to anon, authenticated
using (true);

create policy "admins can manage site settings"
on public.site_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "public can read active banners"
on public.site_banners for select
to anon, authenticated
using (status = 'active');

create policy "admins can manage banners"
on public.site_banners for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "public can insert product views"
on public.product_views for insert
to anon, authenticated
with check (true);

create policy "admins can read product views"
on public.product_views for select
to authenticated
using (public.is_admin());

create policy "admins can manage orders"
on public.orders for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can read audit logs"
on public.audit_logs for select
to authenticated
using (public.is_admin());

create policy "admins can insert audit logs"
on public.audit_logs for insert
to authenticated
with check (public.is_admin());
