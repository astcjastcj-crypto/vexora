create table if not exists public.product_conditions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  description text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_conditions enable row level security;
revoke all on table public.product_conditions from anon, authenticated;
grant select on table public.product_conditions to anon, authenticated;
grant insert, update, delete on table public.product_conditions to authenticated;

create policy "Admins can view product conditions"
on public.product_conditions for select to authenticated
using (private.is_vexora_admin());

create policy "Admins can insert product conditions"
on public.product_conditions for insert to authenticated
with check (private.is_vexora_admin());

create policy "Admins can update product conditions"
on public.product_conditions for update to authenticated
using (private.is_vexora_admin())
with check (private.is_vexora_admin());

create policy "Admins can delete product conditions"
on public.product_conditions for delete to authenticated
using (private.is_vexora_admin());

create policy "Public can view active product conditions"
on public.product_conditions for select to anon, authenticated
using (active = true);
