-- VEXORA: seguimiento de entrega y vencimiento
-- La web no almacena credenciales de los servicios vendidos.

alter table public.orders
  add column if not exists expires_at timestamptz;

-- La tabla legacy "accesses" ya no forma parte del flujo de VEXORA.
-- Se bloquea su acceso desde el navegador para evitar que credenciales
-- antiguas o de pruebas puedan quedar expuestas mediante la API.
revoke all on table public.accesses from anon, authenticated;

-- Guest checkout: anonymous Supabase users keep orders linked to a real user id
-- without appearing as normal VEXORA customers.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    case
      when coalesce(new.is_anonymous, false)
        then coalesce(new.raw_user_meta_data->>'display_name', 'Invitado VEXORA')
      else new.raw_user_meta_data->>'full_name'
    end,
    case
      when coalesce(new.is_anonymous, false) then 'guest'
      else 'customer'
    end
  );

  return new;
end;
$$;
