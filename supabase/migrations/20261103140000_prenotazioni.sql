-- Migrazione 3 – Le prenotazioni (passo 4a)
--
-- Crea le tabelle delle prenotazioni e dei blocchi di Nicolas, e due funzioni:
-- - get_busy_periods: dice quali orari sono occupati (solo orari, nessun dato personale)
-- - create_booking:   controlla tutte le regole e salva una prenotazione
--
-- Come si usa: copia TUTTO il file nell'SQL Editor di Supabase e premi Run
-- UNA volta sola (non riga per riga).
--
-- Regole di sicurezza: i visitatori NON possono leggere né scrivere queste
-- tabelle. Possono solo chiamare le due funzioni.


-- ============================================================
-- 1. Tabelle
-- ============================================================

-- Le prenotazioni
create table public.bookings (
  id uuid primary key default gen_random_uuid(),  -- codice unico generato dal database
  starts_at timestamptz not null,                 -- inizio
  ends_at timestamptz not null,                   -- fine, arrotondata alla mezz'ora
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 60),
  phone text not null check (char_length(phone) between 9 and 20),
  email text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  privacy_accepted_at timestamptz not null,       -- quando ha accettato l'informativa
  status text not null default 'confirmed'
    check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),

  check (ends_at > starts_at),

  -- Vincolo di esclusione: due prenotazioni confermate non possono
  -- sovrapporsi nel tempo. tstzrange(inizio, fine) è un "intervallo di tempo";
  -- && vuol dire "si sovrappone a". Anche con due clienti nello stesso istante,
  -- il database ne accetta uno solo.
  constraint bookings_no_overlap
    exclude using gist (tstzrange(starts_at, ends_at) with &&)
    where (status = 'confirmed')
);

-- I servizi di ogni prenotazione, con prezzo e durata del momento in cui è stata
-- fatta: se Nicolas cambia un prezzo, le prenotazioni vecchie restano giuste.
create table public.booking_services (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  service_id text not null references public.services (id),
  price numeric(6, 2) not null,
  duration_minutes smallint not null,
  primary key (booking_id, service_id)
);

-- Ferie e impegni di Nicolas: in questi periodi non si prenota
create table public.blocked_periods (
  id bigint generated always as identity primary key,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,                                    -- nota per Nicolas, mai mostrata ai clienti
  check (ends_at > starts_at)
);


-- ============================================================
-- 2. Sicurezza: tabelle chiuse ai visitatori
-- ============================================================

alter table public.bookings enable row level security;
alter table public.booking_services enable row level security;
alter table public.blocked_periods enable row level security;

-- Nessuna regola RLS = nessuno può leggere o scrivere dal sito.
-- In più togliamo i permessi che Supabase a volte assegna in automatico
-- (vedi migrazione 2), così un tentativo dà un errore chiaro.
revoke all on public.bookings, public.booking_services, public.blocked_periods
  from anon, authenticated;


-- ============================================================
-- 3. Funzione: orari occupati
-- ============================================================

-- Restituisce SOLO inizio e fine dei periodi occupati (prenotazioni confermate
-- e blocchi di Nicolas) tra due istanti. Nessun nome, telefono o email.
-- security definer = lavora con i nostri permessi, non con quelli del visitatore.
-- set search_path = '' = una protezione standard per le funzioni security definer.
create function public.get_busy_periods(p_from timestamptz, p_to timestamptz)
returns table (busy_from timestamptz, busy_to timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  -- Limite: al massimo 40 giorni per richiesta (il calendario ne usa 30)
  if p_to <= p_from or p_to - p_from > interval '40 days' then
    raise exception 'Intervallo di date non valido.';
  end if;

  return query
    select b.starts_at, b.ends_at
    from public.bookings b
    where b.status = 'confirmed'
      and b.starts_at < p_to and b.ends_at > p_from
    union all
    select bp.starts_at, bp.ends_at
    from public.blocked_periods bp
    where bp.starts_at < p_to and bp.ends_at > p_from
    order by 1;
end;
$$;


-- ============================================================
-- 4. Funzione: crea una prenotazione
-- ============================================================

-- Controlla tutte le regole di docs/regole-progetto.md e salva.
-- Ogni errore ha un messaggio in italiano, con il Lei, pronto da mostrare.
-- Restituisce il riepilogo della prenotazione.
create function public.create_booking(
  p_service_ids text[],
  p_starts_at timestamptz,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_privacy_accepted boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids text[];                 -- i servizi scelti, senza doppioni
  v_found integer;              -- quanti di questi esistono e sono attivi
  v_total_minutes integer;      -- somma delle durate
  v_total_price numeric;        -- somma dei prezzi
  v_has_from_price boolean;     -- c'è almeno un servizio tecnico ("da €X")?
  v_slot_minutes integer;       -- durata arrotondata alla mezz'ora successiva
  v_local timestamp;            -- inizio in ora italiana
  v_ends_at timestamptz;
  v_booking_id uuid;
  v_digits text;                -- solo le cifre del telefono
begin
  -- Dati del cliente: tolgo gli spazi all'inizio e alla fine
  p_first_name := trim(p_first_name);
  p_last_name := trim(p_last_name);
  p_phone := trim(p_phone);
  p_email := lower(trim(p_email));
  v_digits := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');

  if coalesce(p_first_name, '') = '' or coalesce(p_last_name, '') = '' then
    raise exception 'Inserisca nome e cognome.';
  end if;
  if char_length(p_first_name) > 60 or char_length(p_last_name) > 60 then
    raise exception 'Nome o cognome troppo lunghi.';
  end if;
  if char_length(v_digits) not between 9 and 15
     or p_phone !~ '^\+?[0-9 ]+$' then
    raise exception 'Il numero di telefono non sembra valido.';
  end if;
  if coalesce(p_email, '') !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
     or char_length(p_email) > 254 then
    raise exception 'L''indirizzo email non sembra valido.';
  end if;
  if p_privacy_accepted is not true then
    raise exception 'Per prenotare deve accettare l''informativa sulla privacy.';
  end if;

  -- Servizi: almeno uno, tutti esistenti e attivi. Durata e prezzo li
  -- prendiamo dal database, non dal sito.
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

  -- Salvataggio. Se l'orario è già occupato, il vincolo di esclusione
  -- blocca l'inserimento e noi traduciamo l'errore in un messaggio gentile.
  begin
    insert into public.bookings
      (starts_at, ends_at, first_name, last_name, phone, email, privacy_accepted_at)
    values
      (p_starts_at, v_ends_at, p_first_name, p_last_name, p_phone, p_email, now())
    returning id into v_booking_id;
  exception when exclusion_violation then
    raise exception 'Questo orario non è più disponibile. La preghiamo di sceglierne un altro.';
  end;

  insert into public.booking_services (booking_id, service_id, price, duration_minutes)
  select v_booking_id, s.id, s.price, s.duration_minutes
  from public.services s
  where s.id = any (v_ids);

  -- Il riepilogo per la schermata di conferma (nessun dato di altri clienti)
  return jsonb_build_object(
    'id', v_booking_id,
    'starts_at', p_starts_at,
    'ends_at', v_ends_at,
    'total_price', v_total_price,
    'from_price', v_has_from_price,
    'total_minutes', v_total_minutes
  );
end;
$$;


-- ============================================================
-- 5. Chi può chiamare le funzioni
-- ============================================================

-- Di base PostgreSQL permette a tutti di eseguire le funzioni nuove:
-- togliamo questo permesso generico e lo diamo solo a chi serve.
revoke execute on function public.get_busy_periods(timestamptz, timestamptz) from public;
revoke execute on function public.create_booking(text[], timestamptz, text, text, text, text, boolean) from public;

grant execute on function public.get_busy_periods(timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.create_booking(text[], timestamptz, text, text, text, text, boolean) to anon, authenticated;
