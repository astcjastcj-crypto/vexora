-- VEXORA ADMIN POLICIES
-- Ejecutar una sola vez en Supabase SQL Editor.
-- La autorización sensible vive en RLS, no solo en el panel web.

create or replace function public.is_vexora_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_vexora_admin() from public;
grant execute on function public.is_vexora_admin() to authenticated;

create or replace function public.current_vexora_role()
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select role
  from public.profiles
  where id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.current_vexora_role() from public;
grant execute on function public.current_vexora_role() to authenticated;

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id or (select public.is_vexora_admin()));

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id or (select public.is_vexora_admin()))
with check (
  (select public.is_vexora_admin())
  or (
    (select auth.uid()) = id
    and role = (select public.current_vexora_role())
  )
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.accesses enable row level security;

drop policy if exists "Users can create own orders" on public.orders;
create policy "Users can create own orders"
on public.orders
for insert
to authenticated
with check ((select auth.uid()) = user_id or (select public.is_vexora_admin()));

drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders"
on public.orders
for select
to authenticated
using ((select auth.uid()) = user_id or (select public.is_vexora_admin()));

drop policy if exists "VEXORA order ownership guard" on public.orders;
create policy "VEXORA order ownership guard"
on public.orders
as restrictive
for select
to authenticated
using ((select auth.uid()) = user_id or (select public.is_vexora_admin()));

drop policy if exists "VEXORA order insert guard" on public.orders;
create policy "VEXORA order insert guard"
on public.orders
as restrictive
for insert
to authenticated
with check ((select auth.uid()) = user_id or (select public.is_vexora_admin()));

drop policy if exists "Admins can update all orders" on public.orders;
create policy "Admins can update all orders"
on public.orders
for update
to authenticated
using ((select public.is_vexora_admin()))
with check ((select public.is_vexora_admin()));

drop policy if exists "VEXORA order update guard" on public.orders;
create policy "VEXORA order update guard"
on public.orders
as restrictive
for update
to authenticated
using ((select public.is_vexora_admin()))
with check ((select public.is_vexora_admin()));

drop policy if exists "VEXORA order delete guard" on public.orders;
create policy "VEXORA order delete guard"
on public.orders
as restrictive
for delete
to authenticated
using ((select public.is_vexora_admin()));

drop policy if exists "Admins can view all order items" on public.order_items;
create policy "Admins can view all order items"
on public.order_items
for select
to authenticated
using (
  (select public.is_vexora_admin())
  or exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can insert order items" on public.order_items;
create policy "Admins can insert order items"
on public.order_items
for insert
to authenticated
with check (
  (select public.is_vexora_admin())
  or exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = (select auth.uid())
  )
);

drop policy if exists "VEXORA order item ownership guard" on public.order_items;
create policy "VEXORA order item ownership guard"
on public.order_items
as restrictive
for select
to authenticated
using (
  (select public.is_vexora_admin())
  or exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = (select auth.uid())
  )
);

drop policy if exists "VEXORA order item insert guard" on public.order_items;
create policy "VEXORA order item insert guard"
on public.order_items
as restrictive
for insert
to authenticated
with check (
  (select public.is_vexora_admin())
  or exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = (select auth.uid())
  )
);

drop policy if exists "VEXORA order item update guard" on public.order_items;
create policy "VEXORA order item update guard"
on public.order_items
as restrictive
for update
to authenticated
using ((select public.is_vexora_admin()))
with check ((select public.is_vexora_admin()));

drop policy if exists "VEXORA order item delete guard" on public.order_items;
create policy "VEXORA order item delete guard"
on public.order_items
as restrictive
for delete
to authenticated
using ((select public.is_vexora_admin()));

drop policy if exists "Admins can update order items" on public.order_items;
create policy "Admins can update order items"
on public.order_items
for update
to authenticated
using ((select public.is_vexora_admin()))
with check ((select public.is_vexora_admin()));

drop policy if exists "Admins can view all accesses" on public.accesses;
create policy "Admins can view all accesses"
on public.accesses
for select
to authenticated
using (
  (select public.is_vexora_admin())
  or exists (
    select 1
    from public.order_items
    join public.orders on orders.id = order_items.order_id
    where order_items.id = accesses.order_item_id
      and orders.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can insert accesses" on public.accesses;
create policy "Admins can insert accesses"
on public.accesses
for insert
to authenticated
with check ((select public.is_vexora_admin()));

drop policy if exists "Admins can update accesses" on public.accesses;
create policy "Admins can update accesses"
on public.accesses
for update
to authenticated
using ((select public.is_vexora_admin()))
with check ((select public.is_vexora_admin()));

drop policy if exists "Admins can delete accesses" on public.accesses;
create policy "Admins can delete accesses"
on public.accesses
for delete
to authenticated
using ((select public.is_vexora_admin()));
