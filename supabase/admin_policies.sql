-- VEXORA ADMIN POLICIES
-- Ejecutar una sola vez en Supabase SQL Editor.
-- Usa una función security definer para evitar recursión en las políticas de profiles.

create or replace function public.is_vexora_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_vexora_admin() from public;
grant execute on function public.is_vexora_admin() to authenticated;

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_vexora_admin());

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_vexora_admin())
with check (auth.uid() = id or public.is_vexora_admin());

drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders"
on public.orders
for select
to authenticated
using (auth.uid() = user_id or public.is_vexora_admin());

drop policy if exists "Admins can update all orders" on public.orders;
create policy "Admins can update all orders"
on public.orders
for update
to authenticated
using (public.is_vexora_admin())
with check (public.is_vexora_admin());

drop policy if exists "Admins can view all order items" on public.order_items;
create policy "Admins can view all order items"
on public.order_items
for select
to authenticated
using (
  public.is_vexora_admin()
  or exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists "Admins can insert order items" on public.order_items;
create policy "Admins can insert order items"
on public.order_items
for insert
to authenticated
with check (public.is_vexora_admin());

drop policy if exists "Admins can update order items" on public.order_items;
create policy "Admins can update order items"
on public.order_items
for update
to authenticated
using (public.is_vexora_admin())
with check (public.is_vexora_admin());

drop policy if exists "Admins can view all accesses" on public.accesses;
create policy "Admins can view all accesses"
on public.accesses
for select
to authenticated
using (
  public.is_vexora_admin()
  or exists (
    select 1
    from public.order_items
    join public.orders on orders.id = order_items.order_id
    where order_items.id = accesses.order_item_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists "Admins can insert accesses" on public.accesses;
create policy "Admins can insert accesses"
on public.accesses
for insert
to authenticated
with check (public.is_vexora_admin());

drop policy if exists "Admins can update accesses" on public.accesses;
create policy "Admins can update accesses"
on public.accesses
for update
to authenticated
using (public.is_vexora_admin())
with check (public.is_vexora_admin());

drop policy if exists "Admins can delete accesses" on public.accesses;
create policy "Admins can delete accesses"
on public.accesses
for delete
to authenticated
using (public.is_vexora_admin());
