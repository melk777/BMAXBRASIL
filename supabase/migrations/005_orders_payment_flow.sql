alter table public.orders
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists preference_id text,
  add column if not exists external_reference text,
  add column if not exists color text,
  add column if not exists quantity int not null default 1 check (quantity > 0),
  add column if not exists product_snapshot jsonb not null default '{}',
  add column if not exists customer_snapshot jsonb not null default '{}',
  add column if not exists raw_payment jsonb not null default '{}',
  add column if not exists paid_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_orders_preference_id
on public.orders(preference_id)
where preference_id is not null;

create unique index if not exists idx_orders_payment_reference
on public.orders(payment_reference)
where payment_reference is not null;

create index if not exists idx_orders_external_reference
on public.orders(external_reference);

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.complete_order_from_payment(
  p_order_id uuid,
  p_payment_reference text,
  p_payment_status text,
  p_raw_payment jsonb default '{}'::jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_previous_status text;
begin
  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;

  v_previous_status := v_order.status;

  update public.orders
  set status = coalesce(p_payment_status, status),
      payment_reference = coalesce(p_payment_reference, payment_reference),
      raw_payment = coalesce(p_raw_payment, raw_payment),
      paid_at = case
        when p_payment_status = 'approved' and paid_at is null then now()
        else paid_at
      end
  where id = p_order_id
  returning * into v_order;

  if p_payment_status = 'approved'
     and v_previous_status is distinct from 'approved'
     and v_order.product_id is not null then
    update public.products
    set stock = greatest(stock - greatest(v_order.quantity, 1), 0)
    where id = v_order.product_id;
  end if;

  if v_order.customer_id is not null then
    update public.customers
    set payment_status = p_payment_status,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
          'payment_reference', p_payment_reference,
          'order_id', v_order.id
        )
    where id = v_order.customer_id;
  end if;

  return v_order;
end;
$$;
