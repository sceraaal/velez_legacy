-- Migrazione 6 – Si prenota solo con l'account (Fase 1, passo 2)
--
-- Cosa cambia:
-- 1. Ogni prenotazione è collegata al cliente che l'ha fatta (customer_id).
-- 2. Nome, cognome, telefono ed email in "bookings" diventano facoltativi:
--    per i clienti con l'account stanno già in "customers" e non li copiamo.
--    Restano per le prenotazioni della prova e serviranno al passo 5, quando
--    Nicolas inserirà a mano i clienti senza account.
-- 3. La vecchia funzione create_booking (con nome, telefono, email...) viene
--    tolta. Quella nuova riceve solo servizi e orario, e prende il cliente dal
--    login: nessuno può prenotare a nome di un altro, e senza account non si
--    prenota.
--
-- Come si usa: copia TUTTO il file nell'SQL Editor di Supabase e premi Run
-- UNA volta sola.


-- ============================================================
-- 1. La prenotazione ricorda il cliente
-- ============================================================

-- references = "deve essere un cliente che esiste". Se un giorno si volesse
-- cancellare un cliente che ha delle prenotazioni, il database lo impedisce:
-- prima si decide cosa fare delle sue prenotazioni.
alter table public.bookings
  add column customer_id uuid references public.customers (id);

-- Serve a trovare in fretta le prenotazioni di un cliente ("I miei appuntamenti")
create index bookings_customer_id_idx on public.bookings (customer_id);

alter table public.bookings
  alter column first_name drop not null,
  alter column last_name drop not null,
  alter column phone drop not null,
  alter column email drop not null,
  alter column privacy_accepted_at drop not null;

-- Ma una prenotazione deve sempre dire di chi è: o il cliente con l'account,
-- o almeno nome e cognome (prenotazioni vecchie e, dal passo 5, quelle a mano).
alter table public.bookings
  add constraint bookings_has_customer
  check (customer_id is not null or (first_name is not null and last_name is not null));


-- ============================================================
-- 2. Via la vecchia funzione di prenotazione
-- ============================================================

drop function public.create_booking(text[], timestamptz, text, text, text, text, boolean);


-- ============================================================
-- 3. La nuova funzione: servizi e orario, il cliente dal login
-- ============================================================

-- Le regole su giorni, orari, durata e sovrapposizioni sono le stesse della
-- migrazione 3: se ne cambi una, cambiala qui (con una nuova migrazione).
create function public.create_booking(
  p_service_ids text[],
  p_starts_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := auth.uid();  -- chi ha fatto il login (null se nessuno)
  v_first_name text;
  v_ids text[];
  v_found integer;
  v_total_minutes integer;
  v_total_price numeric;
  v_has_from_price boolean;
  v_slot_minutes integer;
  v_local timestamp;
  v_ends_at timestamptz;
  v_booking_id uuid;
begin
  -- Il cliente: deve aver fatto il login e avere un profilo
  if v_customer_id is null then
    raise exception 'Per prenotare deve accedere al Suo account.';
  end if;

  select c.first_name into v_first_name
  from public.customers c
  where c.id = v_customer_id;

  if v_first_name is null then
    raise exception 'Questo account non può prenotare. Acceda con un account cliente.';
  end if;

  -- Servizi: almeno uno, tutti esistenti e attivi
  select array_agg(distinct x) into v_ids
  from unnest(p_service_ids) as x;

  if v_ids is null then
    raise exception 'Scelga almeno un servizio.';
  end if;

  select count(*), sum(s.duration_minutes), sum(s.price), bool_or(s.from_price)
    into v_found, v_total_minutes, v_total_price, v_has_from_price
  from public.services s
  where s.id = any (v_ids) and s.is_active;

  if v_found <> cardinality(v_ids) then
    raise exception 'Uno dei servizi scelti non è disponibile.';
  end if;

  -- Arrotondamento alla mezz'ora successiva: 50 → 60, 45 → 60, 30 → 30
  v_slot_minutes := ceil(v_total_minutes / 30.0) * 30;

  -- Orario: tutto si ragiona in ora italiana
  if p_starts_at is null then
    raise exception 'Scelga un orario.';
  end if;
  v_local := p_starts_at at time zone 'Europe/Rome';
  v_ends_at := (v_local + make_interval(mins => v_slot_minutes)) at time zone 'Europe/Rome';

  -- Martedì (2) – sabato (6)
  if extract(isodow from v_local) not between 2 and 6 then
    raise exception 'Il salone è aperto da martedì a sabato.';
  end if;

  -- Inizio ogni 30 minuti: 8:00, 8:30, 9:00...
  if extract(minute from v_local) not in (0, 30) or extract(second from v_local) <> 0 then
    raise exception 'Gli appuntamenti iniziano ogni mezz''ora.';
  end if;

  -- Dalle 8:00 alle 20:00, servizio compreso
  if v_local::time < time '08:00'
     or v_local + make_interval(mins => v_slot_minutes) > v_local::date + time '20:00' then
    raise exception 'L''appuntamento deve stare tra le 8:00 e le 20:00.';
  end if;

  -- Almeno 1 ora prima, al massimo 30 giorni prima
  if p_starts_at < now() + interval '1 hour' then
    raise exception 'Si può prenotare fino a un''ora prima.';
  end if;
  if p_starts_at > now() + interval '30 days' then
    raise exception 'Si può prenotare al massimo 30 giorni prima.';
  end if;

  -- Ferie e impegni di Nicolas
  if exists (
    select 1 from public.blocked_periods bp
    where bp.starts_at < v_ends_at and bp.ends_at > p_starts_at
  ) then
    raise exception 'Questo orario non è disponibile. La preghiamo di sceglierne un altro.';
  end if;

  -- Salvataggio: solo il codice del cliente, i suoi dati stanno in "customers"
  begin
    insert into public.bookings (starts_at, ends_at, customer_id)
    values (p_starts_at, v_ends_at, v_customer_id)
    returning id into v_booking_id;
  exception when exclusion_violation then
    raise exception 'Questo orario non è più disponibile. La preghiamo di sceglierne un altro.';
  end;

  insert into public.booking_services (booking_id, service_id, price, duration_minutes)
  select v_booking_id, s.id, s.price, s.duration_minutes
  from public.services s
  where s.id = any (v_ids);

  return jsonb_build_object(
    'id', v_booking_id,
    'starts_at', p_starts_at,
    'ends_at', v_ends_at,
    'total_price', v_total_price,
    'from_price', v_has_from_price,
    'total_minutes', v_total_minutes,
    'first_name', v_first_name
  );
end;
$$;

-- Solo chi ha fatto il login può chiamarla (i visitatori ricevono un errore)
revoke execute on function public.create_booking(text[], timestamptz) from public, anon;
grant execute on function public.create_booking(text[], timestamptz) to authenticated;
