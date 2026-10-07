-- VEXORA: seguimiento de entrega y vencimiento
-- La web no almacena credenciales de los servicios vendidos.

alter table public.orders
  add column if not exists expires_at timestamptz;

-- La tabla legacy "accesses" ya no forma parte del flujo de VEXORA.
-- Se bloquea su acceso desde el navegador para evitar que credenciales
-- antiguas o de pruebas puedan quedar expuestas mediante la API.
revoke all on table public.accesses from anon, authenticated;
