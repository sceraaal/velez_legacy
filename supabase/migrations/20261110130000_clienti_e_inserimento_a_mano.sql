-- Migrazione 13 – Clienti, storico e inserimento a mano (Fase 1, passo 5b)
--
-- Cosa fa:
-- 1. Tabella "walk_in_customers": i clienti SENZA account, che Nicolas
--    registra a mano (chi telefona o passa in salone). Nome, cognome e, se
--    vuole, il telefono. Niente email: non serve.
-- 2. In "bookings": walk_in_customer_id (il cliente senza account) e
--    source ('online' = dal sito, 'manual' = inserita da Nicolas).
-- 3. Tre funzioni SOLO per lo staff (is_staff(), migrazione 11):
--    - get_customers(ricerca):          clienti con e senza account
--    - get_customer_history(tipo, id):  gli appuntamenti di un cliente
--    - staff_create_booking(...):       l'inserimento a mano
-- 4. Aggiorna get_agenda (migrazione 11) e add_blocked_period (migrazione 12)
--    perché mostrino anche il nome dei clienti senza account.
--
-- Come si usa: copia TUTTO il file nell'SQL Editor di Supabase e premi Run
-- UNA volta sola, dopo la migrazione 12.


-- ============================================================
-- 1. I clienti senza account
-- ============================================================

create table public.walk_in_customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 60),
  phone text check (char_length(phone) between 9 and 20),  -- facoltativo
  created_at timestamptz not null default now()
);

-- Chiusa al sito, come le altre: si passa solo dalle funzioni qui sotto
alter table public.walk_in_customers enable row level security;
revoke all on table public.walk_in_customers from anon, authenticated;

-- Iniziale maiuscola, con la stessa funzione dei clienti con account (migrazione 8)
create trigger walk_in_customers_capitalize_name
  before insert or update of first_name, last_name on public.walk_in_customers
  for each row execute function public.capitalize_customer_name();


-- ============================================================
-- 2. Le prenotazioni sanno chi è il cliente senza account e chi le ha inserite
-- ============================================================

alter table public.bookings
  add column walk_in_customer_id uuid references public.walk_in_customers (id),
  add column source text not null default 'online' check (source in ('online', 'manual'));

create index bookings_walk_in_customer_id_idx on public.bookings (walk_in_customer_id);

-- La regola "ogni prenotazione dice di chi è" (migrazione 6) ora accetta anche
-- il cliente senza account. E una prenotazione non può essere di due clienti.
alter table public.bookings drop constraint bookings_has_customer;
alter table public.bookings
  add constraint bookings_has_customer check (
    customer_id is not null
    or walk_in_customer_id is not null
    or (first_name is not null and last_name is not null)
  ),
  add constraint bookings_one_customer check (num_nonnulls(customer_id, walk_in_customer_id) <= 1);


-- ============================================================
-- 3. L'elenco dei clienti
-- ============================================================

-- Tutti i clienti, con e senza account, in ordine di cognome e nome.
-- p_search (facoltativo) cerca in nome, cognome e telefono.
-- kind = 'account' (registrato dal sito) oppure 'walk_in' (inserito a mano).
-- visits = appuntamenti confermati già passati; last_visit = l'ultimo;
-- next_visit = il prossimo, se c'è.
create function public.get_customers(p_search text)
returns table (
  kind text,
  id uuid,
  first_name text,
  last_name text,
  phone text,
  email text,
  visits integer,
  last_visit timestamptz,
  next_visit timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_search text := '%' || coalesce(trim(p_search), '') || '%';
begin
  if not public.is_staff() then
    raise exception 'Pagina riservata.';
  end if;

  return query
    with people as (
      select 'account'::text as kind, c.id, c.first_name, c.last_name, c.phone, u.email::text as email
      from public.customers c
      join auth.users u on u.id = c.id
      union all
      select 'walk_in', w.id, w.first_name, w.last_name, w.phone, null
      from public.walk_in_customers w
    )
    select
      p.kind, p.id, p.first_name, p.last_name, p.phone, p.email,
      count(b.id) filter (where b.starts_at < now())::integer,
      max(b.starts_at) filter (where b.starts_at < now()),
      min(b.starts_at) filter (where b.starts_at >= now())
    from people p
    left join public.bookings b
      on b.status = 'confirmed'
     and (b.customer_id = p.id or b.walk_in_customer_id = p.id)
    where p.first_name || ' ' || p.last_name ilike v_search
       or p.last_name || ' ' || p.first_name ilike v_search
       or coalesce(p.phone, '') ilike v_search
    group by p.kind, p.id, p.first_name, p.last_name, p.phone, p.email
    order by p.last_name, p.first_name
    limit 300;
end;
$$;


-- ============================================================
-- 4. Lo storico di un cliente
-- ============================================================

-- Gli appuntamenti confermati di un cliente (passati e futuri), dal più
-- recente. p_kind come in get_customers.
create function public.get_customer_history(p_kind text, p_customer_id uuid)
returns table (
  id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  service_names text[],
  total_price numeric,
  from_price boolean,
  source text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Pagina riservata.';
  end if;

  return query
    select
      b.id, b.starts_at, b.ends_at,
      array_agg(s.name order by sc.position, s.position),
      sum(bs.price),
      bool_or(s.from_price),
      b.source
    from public.bookings b
    join public.booking_services bs on bs.booking_id = b.id
    join public.services s on s.id = bs.service_id
    join public.service_categories sc on sc.id = s.category_id
    where b.status = 'confirmed'
      and case p_kind
            when 'account' then b.customer_id = p_customer_id
            when 'walk_in' then b.walk_in_customer_id = p_customer_id
            else false
          end
    group by b.id
    order by b.starts_at desc;
end;
$$;


-- ============================================================
-- 5. L'inserimento a mano
-- ============================================================

-- Il cliente si indica in uno di due modi:
-- - uno esistente: p_kind ('account' o 'walk_in') e p_customer_id
-- - uno nuovo senza account: p_customer_id null, e nome, cognome, telefono
--   (facoltativo) in p_first_name, p_last_name, p_phone
--
-- Regole sull'orario: martedì–sabato, inizio ogni mezz'ora, 8:00–20:00
-- servizio compreso, nessuna sovrapposizione (vincolo bookings_no_overlap).
-- NON valgono, perché decide Nicolas: il preavviso di un'ora, il limite dei
-- 30 giorni e i suoi blocchi. Può segnare anche un servizio già fatto
-- (fino a un anno indietro) o uno al telefono (fino a un anno avanti).
-- Restituisce l'id della prenotazione.
create function public.staff_create_booking(
  p_kind text,
  p_customer_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_service_ids text[],
  p_starts_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_first_name text := nullif(trim(p_first_name), '');
  v_last_name text := nullif(trim(p_last_name), '');
  v_phone text := nullif(trim(p_phone), '');
  v_customer_id uuid;      -- cliente con account
  v_walk_in_id uuid;       -- cliente senza account
  v_ids text[];
  v_found integer;
  v_total_minutes integer;
  v_slot_minutes integer;
  v_local timestamp;
  v_ends_at timestamptz;
  v_booking_id uuid;
begin
  if not public.is_staff() then
    raise exception 'Pagina riservata.';
  end if;

  -- Il cliente
  if p_customer_id is not null then
    if p_kind = 'account' and exists (select 1 from public.customers c where c.id = p_customer_id) then
      v_customer_id := p_customer_id;
    elsif p_kind = 'walk_in' and exists (select 1 from public.walk_in_customers w where w.id = p_customer_id) then
      v_walk_in_id := p_customer_id;
    else
      raise exception 'Cliente non trovato.';
    end if;
  else
    if v_first_name is null or v_last_name is null then
      raise exception 'Scrivi nome e cognome del cliente.';
    end if;
    if char_length(v_first_name) > 60 or char_length(v_last_name) > 60 then
      raise exception 'Nome e cognome possono avere al massimo 60 caratteri.';
    end if;
    -- Telefono facoltativo; se c'è, stesse regole della registrazione:
    -- da 9 a 15 cifre, "+" facoltativo all'inizio, spazi ammessi
    if v_phone is not null and (
         v_phone !~ '^\+?[0-9 ]+$'
         or char_length(regexp_replace(v_phone, '[^0-9]', '', 'g')) not between 9 and 15) then
      raise exception 'Il telefono deve avere da 9 a 15 cifre.';
    end if;
  end if;

  -- I servizi: almeno uno, tutti esistenti e attivi
  select array_agg(distinct x) into v_ids from unnest(p_service_ids) as x;
  if v_ids is null then
    raise exception 'Scegli almeno un servizio.';
  end if;

  select count(*), sum(s.duration_minutes)
    into v_found, v_total_minutes
  from public.services s
  where s.id = any (v_ids) and s.is_active;

  if v_found <> cardinality(v_ids) then
    raise exception 'Uno dei servizi scelti non è disponibile.';
  end if;

  -- L'orario, in ora italiana
  if p_starts_at is null then
    raise exception 'Scegli giorno e ora.';
  end if;
  if p_starts_at < now() - interval '1 year' or p_starts_at > now() + interval '1 year' then
    raise exception 'La data deve essere entro un anno da oggi.';
  end if;

  v_slot_minutes := ceil(v_total_minutes / 30.0) * 30;
  v_local := p_starts_at at time zone 'Europe/Rome';
  v_ends_at := (v_local + make_interval(mins => v_slot_minutes)) at time zone 'Europe/Rome';

  if extract(isodow from v_local) not between 2 and 6 then
    raise exception 'Il salone è aperto da martedì a sabato.';
  end if;
  if extract(minute from v_local) not in (0, 30) or extract(second from v_local) <> 0 then
    raise exception 'Gli appuntamenti iniziano ogni mezz''ora.';
  end if;
  if v_local::time < time '08:00'
     or v_local + make_interval(mins => v_slot_minutes) > v_local::date + time '20:00' then
    raise exception 'L''appuntamento deve stare tra le 8:00 e le 20:00.';
  end if;

  -- Il cliente nuovo lo salviamo solo adesso, quando tutto il resto va bene
  if p_customer_id is null then
    insert into public.walk_in_customers (first_name, last_name, phone)
    values (v_first_name, v_last_name, v_phone)
    returning id into v_walk_in_id;
  end if;

  begin
    insert into public.bookings (starts_at, ends_at, customer_id, walk_in_customer_id, source)
    values (p_starts_at, v_ends_at, v_customer_id, v_walk_in_id, 'manual')
    returning id into v_booking_id;
  exception when exclusion_violation then
    raise exception 'In questo orario c''è già un altro appuntamento.';
  end;

  insert into public.booking_services (booking_id, service_id, price, duration_minutes)
  select v_booking_id, s.id, s.price, s.duration_minutes
  from public.services s
  where s.id = any (v_ids);

  return v_booking_id;
end;
$$;


-- ============================================================
-- 6. Agenda e blocchi: anche i nomi dei clienti senza account
-- ============================================================

-- Stessa funzione della migrazione 11 ("create or replace" la sostituisce),
-- con in più il cliente senza account (w). I permessi restano quelli di prima.
create or replace function public.get_agenda(p_from timestamptz, p_to timestamptz)
returns table (
  id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  first_name text,
  last_name text,
  phone text,
  email text,
  service_names text[],
  total_price numeric,
  from_price boolean,
  total_minutes integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Pagina riservata.';
  end if;

  if p_from is null or p_to is null or p_to <= p_from or p_to - p_from > interval '40 days' then
    raise exception 'Intervallo di date non valido.';
  end if;

  return query
    select
      b.id,
      b.starts_at,
      b.ends_at,
      coalesce(c.first_name, w.first_name, b.first_name),
      coalesce(c.last_name, w.last_name, b.last_name),
      coalesce(c.phone, w.phone, b.phone),
      coalesce(u.email::text, b.email),
      array_agg(s.name order by sc.position, s.position),
      sum(bs.price),
      bool_or(s.from_price),
      sum(bs.duration_minutes)::integer
    from public.bookings b
    left join public.customers c on c.id = b.customer_id
    left join auth.users u on u.id = b.customer_id
    left join public.walk_in_customers w on w.id = b.walk_in_customer_id
    join public.booking_services bs on bs.booking_id = b.id
    join public.services s on s.id = bs.service_id
    join public.service_categories sc on sc.id = s.category_id
    where b.status = 'confirmed'
      and b.starts_at >= p_from
      and b.starts_at < p_to
    group by b.id, c.id, u.id, w.id
    order by b.starts_at;
end;
$$;


-- Stessa funzione della migrazione 12, con il nome anche dei clienti senza account
create or replace function public.add_blocked_period(p_starts_at timestamptz, p_ends_at timestamptz, p_reason text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text := nullif(trim(p_reason), '');
  v_conflicts text;
  v_id bigint;
begin
  if not public.is_staff() then
    raise exception 'Pagina riservata.';
  end if;

  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then
    raise exception 'La fine deve venire dopo l''inizio.';
  end if;
  if p_ends_at <= now() then
    raise exception 'Questo periodo è già passato.';
  end if;
  if p_ends_at - p_starts_at > interval '366 days' then
    raise exception 'Un blocco può durare al massimo un anno.';
  end if;
  if char_length(v_reason) > 100 then
    raise exception 'La nota può avere al massimo 100 caratteri.';
  end if;

  select string_agg(
           to_char(b.starts_at at time zone 'Europe/Rome', 'DD/MM "ore" HH24:MI')
             || ' ' || coalesce(c.first_name, w.first_name, b.first_name)
             || ' ' || coalesce(c.last_name, w.last_name, b.last_name),
           ', ' order by b.starts_at)
    into v_conflicts
  from public.bookings b
  left join public.customers c on c.id = b.customer_id
  left join public.walk_in_customers w on w.id = b.walk_in_customer_id
  where b.status = 'confirmed'
    and b.starts_at < p_ends_at
    and b.ends_at > p_starts_at;

  if v_conflicts is not null then
    raise exception 'In questo periodo ci sono appuntamenti: %. Disdicili dall''agenda (dopo aver avvisato i clienti) e poi riprova.', v_conflicts;
  end if;

  insert into public.blocked_periods (starts_at, ends_at, reason)
  values (p_starts_at, p_ends_at, v_reason)
  returning id into v_id;

  return v_id;
end;
$$;


-- ============================================================
-- 7. Chi può chiamarle: solo chi ha fatto l'accesso
--    (e poi, dentro, solo lo staff)
-- ============================================================

revoke execute on function public.get_customers(text) from public, anon;
revoke execute on function public.get_customer_history(text, uuid) from public, anon;
revoke execute on function public.staff_create_booking(text, uuid, text, text, text, text[], timestamptz) from public, anon;

grant execute on function public.get_customers(text) to authenticated;
grant execute on function public.get_customer_history(text, uuid) to authenticated;
grant execute on function public.staff_create_booking(text, uuid, text, text, text, text[], timestamptz) to authenticated;
