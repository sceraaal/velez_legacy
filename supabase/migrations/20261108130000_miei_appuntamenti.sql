-- Migrazione 7 – "I miei appuntamenti": vedere, disdire, spostare (Fase 1, passo 3)
--
-- Cosa fa:
-- 1. Aggiunge a "bookings" la colonna cancelled_at (quando è stata disdetta).
-- 2. Mette le regole sugli orari in UNA funzione, check_booking_slot, usata sia
--    per prenotare sia per spostare. Se Nicolas cambia gli orari, si cambia qui.
-- 3. Riscrive create_booking (stesso comportamento) perché usi quella funzione.
-- 4. Tre funzioni nuove per il cliente con l'account:
--    - get_my_bookings:    le SUE prenotazioni confermate
--    - cancel_booking:     disdice una SUA prenotazione, fino a 1 ora prima
--    - reschedule_booking: sposta una SUA prenotazione, fino a 1 ora prima
--
-- La tabella "bookings" resta chiusa: il cliente la legge e la modifica solo
-- attraverso queste funzioni, che controllano sempre che la prenotazione sia sua.
--
-- Come si usa: copia TUTTO il file nell'SQL Editor di Supabase e premi Run
-- UNA volta sola.


-- ============================================================
-- 1. Quando è stata disdetta
-- ============================================================

alter table public.bookings add column cancelled_at timestamptz;


-- ============================================================
-- 2. Le regole sugli orari, in un posto solo
-- ============================================================

-- Riceve l'inizio e la durata (già arrotondata alla mezz'ora) e controlla:
-- martedì–sabato, inizio ogni mezz'ora, 8:00–20:00 servizio compreso, almeno
-- 1 ora e al massimo 30 giorni prima, niente ferie o impegni di Nicolas.
-- Se va tutto bene restituisce la fine; se no, si ferma con un messaggio.
-- (Le sovrapposizioni con altre prenotazioni le blocca il vincolo
-- bookings_no_overlap, al momento del salvataggio.)
-- Le stesse regole stanno anche nel sito, in src/lib/availability.js.
create function public.check_booking_slot(p_starts_at timestamptz, p_slot_minutes integer)
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_local timestamp;
  v_ends_at timestamptz;
begin
  if p_starts_at is null then
    raise exception 'Scelga un orario.';
  end if;

  -- Tutto si ragiona in ora italiana
  v_local := p_starts_at at time zone 'Europe/Rome';
  v_ends_at := (v_local + make_interval(mins => p_slot_minutes)) at time zone 'Europe/Rome';

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
     or v_local + make_interval(mins => p_slot_minutes) > v_local::date + time '20:00' then
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

  return v_ends_at;
end;
$$;

-- La usano solo le altre funzioni, non il sito
revoke execute on function public.check_booking_slot(timestamptz, integer) from public, anon, authenticated;


-- ============================================================
-- 3. create_booking, ora con le regole in comune
-- ============================================================

-- "create or replace" sostituisce la funzione della migrazione 6 con questa,
-- che fa esattamente le stesse cose. I permessi restano quelli di prima.
create or replace function public.create_booking(
  p_service_ids text[],
  p_starts_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := auth.uid();
  v_first_name text;
  v_ids text[];
  v_found integer;
  v_total_minutes integer;
  v_total_price numeric;
  v_has_from_price boolean;
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

  -- Orario: durata arrotondata alla mezz'ora (50 → 60) e regole in comune
  v_ends_at := public.check_booking_slot(p_starts_at, (ceil(v_total_minutes / 30.0) * 30)::integer);

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


-- ============================================================
-- 4a. Le mie prenotazioni
-- ============================================================

-- Solo le prenotazioni CONFERMATE di chi ha fatto l'accesso, dalla più vecchia
-- alla più nuova. Il sito le divide in "prossimi" e "passati".
-- Per ogni prenotazione: i nomi dei servizi, il prezzo totale (quello del
-- momento in cui è stata fatta) e la durata totale.
create function public.get_my_bookings()
returns table (
  id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  service_ids text[],
  service_names text[],
  total_price numeric,
  from_price boolean,
  total_minutes integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    b.id,
    b.starts_at,
    b.ends_at,
    array_agg(s.id order by s.position),
    array_agg(s.name order by s.position),
    sum(bs.price),
    bool_or(s.from_price),
    sum(bs.duration_minutes)::integer
  from public.bookings b
  join public.booking_services bs on bs.booking_id = b.id
  join public.services s on s.id = bs.service_id
  where b.customer_id = auth.uid()   -- solo le sue
    and b.status = 'confirmed'
  group by b.id
  order by b.starts_at;
$$;


-- ============================================================
-- 4b. Disdire
-- ============================================================

create function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_starts_at timestamptz;
begin
  -- "for update" blocca la riga finché non abbiamo finito: se il cliente
  -- preme due volte, la seconda aspetta la prima.
  select b.starts_at into v_starts_at
  from public.bookings b
  where b.id = p_booking_id
    and b.customer_id = auth.uid()
    and b.status = 'confirmed'
  for update;

  if v_starts_at is null then
    raise exception 'Appuntamento non trovato.';
  end if;
  if v_starts_at < now() + interval '1 hour' then
    raise exception 'Manca meno di un''ora: per disdire contatti il salone.';
  end if;

  update public.bookings
  set status = 'cancelled', cancelled_at = now()
  where id = p_booking_id;
end;
$$;


-- ============================================================
-- 4c. Spostare
-- ============================================================

-- Stessi servizi, nuovo orario. Si aggiorna la stessa riga: se il nuovo
-- orario non va bene (regole o già occupato) non cambia nulla, e il cliente
-- tiene il vecchio appuntamento.
create function public.reschedule_booking(p_booking_id uuid, p_starts_at timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_starts_at timestamptz;
  v_total_minutes integer;
  v_ends_at timestamptz;
begin
  select b.starts_at into v_old_starts_at
  from public.bookings b
  where b.id = p_booking_id
    and b.customer_id = auth.uid()
    and b.status = 'confirmed'
  for update;

  if v_old_starts_at is null then
    raise exception 'Appuntamento non trovato.';
  end if;
  if v_old_starts_at < now() + interval '1 hour' then
    raise exception 'Manca meno di un''ora: per spostare l''appuntamento contatti il salone.';
  end if;

  -- La durata è quella dei servizi già prenotati
  select sum(bs.duration_minutes) into v_total_minutes
  from public.booking_services bs
  where bs.booking_id = p_booking_id;

  v_ends_at := public.check_booking_slot(p_starts_at, (ceil(v_total_minutes / 30.0) * 30)::integer);

  -- Il vincolo bookings_no_overlap confronta con le ALTRE prenotazioni:
  -- spostare di mezz'ora sopra il proprio vecchio orario va bene.
  begin
    update public.bookings
    set starts_at = p_starts_at, ends_at = v_ends_at
    where id = p_booking_id;
  exception when exclusion_violation then
    raise exception 'Questo orario non è più disponibile. La preghiamo di sceglierne un altro.';
  end;

  return jsonb_build_object('id', p_booking_id, 'starts_at', p_starts_at, 'ends_at', v_ends_at);
end;
$$;


-- ============================================================
-- 5. Chi può chiamare le funzioni nuove: solo chi ha fatto l'accesso
-- ============================================================

revoke execute on function public.get_my_bookings() from public, anon;
revoke execute on function public.cancel_booking(uuid) from public, anon;
revoke execute on function public.reschedule_booking(uuid, timestamptz) from public, anon;

grant execute on function public.get_my_bookings() to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.reschedule_booking(uuid, timestamptz) to authenticated;
