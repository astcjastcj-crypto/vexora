create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Otros',
  description text not null default '',
  logo_url text,
  price_from numeric(10,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Admins can view products" on public.products;
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;
drop policy if exists "Public can view active products" on public.products;

create policy "Admins can view products" on public.products
for select to authenticated using (public.is_vexora_admin());

create policy "Admins can insert products" on public.products
for insert to authenticated with check (public.is_vexora_admin());

create policy "Admins can update products" on public.products
for update to authenticated using (public.is_vexora_admin()) with check (public.is_vexora_admin());

create policy "Admins can delete products" on public.products
for delete to authenticated using (public.is_vexora_admin());

create policy "Public can view active products" on public.products
for select to anon, authenticated using (active = true);

insert into storage.buckets (id, name, public)
values ('product-logos', 'product-logos', true)
on conflict (id) do update set public = true;

drop policy if exists "Admins can upload product logos" on storage.objects;
drop policy if exists "Admins can update product logos" on storage.objects;
drop policy if exists "Admins can delete product logos" on storage.objects;
drop policy if exists "Anyone can view product logos" on storage.objects;

create policy "Admins can upload product logos" on storage.objects
for insert to authenticated
with check (bucket_id = 'product-logos' and public.is_vexora_admin());

create policy "Admins can update product logos" on storage.objects
for update to authenticated
using (bucket_id = 'product-logos' and public.is_vexora_admin())
with check (bucket_id = 'product-logos' and public.is_vexora_admin());

create policy "Admins can delete product logos" on storage.objects
for delete to authenticated
using (bucket_id = 'product-logos' and public.is_vexora_admin());

create policy "Anyone can view product logos" on storage.objects
for select to anon, authenticated
using (bucket_id = 'product-logos');
