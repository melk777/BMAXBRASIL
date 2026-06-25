create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  cpf text not null,
  email text not null,
  phone text not null,
  cep text not null,
  address text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  state text not null,
  reference_point text not null,
  product_name text,
  product_amount numeric(12,2),
  payment_provider text not null default 'mercado_pago',
  payment_preference_id text,
  payment_status text not null default 'checkout_created',
  source text not null default 'checkout',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_created_at on public.customers(created_at desc);
create index if not exists idx_customers_email on public.customers(email);
create index if not exists idx_customers_cpf on public.customers(cpf);
create index if not exists idx_customers_payment_status on public.customers(payment_status);

create trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

alter table public.customers enable row level security;

create policy "public can create checkout customers"
on public.customers for insert
to anon, authenticated
with check (true);

create policy "admins can read customers"
on public.customers for select
to authenticated
using (public.is_admin());

create policy "admins can manage customers"
on public.customers for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
