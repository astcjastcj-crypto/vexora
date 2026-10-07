create table if not exists public.product_benefits (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  text text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_benefits enable row level security;

drop policy if exists "Admins can view product benefits" on public.product_benefits;
drop policy if exists "Admins can insert product benefits" on public.product_benefits;
drop policy if exists "Admins can update product benefits" on public.product_benefits;
drop policy if exists "Admins can delete product benefits" on public.product_benefits;
drop policy if exists "Public can view active product benefits" on public.product_benefits;

create policy "Admins can view product benefits"
on public.product_benefits
for select
to authenticated
using (public.is_vexora_admin());

create policy "Admins can insert product benefits"
on public.product_benefits
for insert
to authenticated
with check (public.is_vexora_admin());

create policy "Admins can update product benefits"
on public.product_benefits
for update
to authenticated
using (public.is_vexora_admin())
with check (public.is_vexora_admin());

create policy "Admins can delete product benefits"
on public.product_benefits
for delete
to authenticated
using (public.is_vexora_admin());

create policy "Public can view active product benefits"
on public.product_benefits
for select
to anon, authenticated
using (active = true);

grant select on public.product_benefits to anon, authenticated;
grant insert, update, delete on public.product_benefits to authenticated;
