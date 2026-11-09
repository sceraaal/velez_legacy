-- Migrazione 11 – L'area riservata di Nicolas: l'agenda (Fase 1, passo 4)
--
-- Cosa fa:
-- 1. Crea la tabella "staff" (personale): gli account che sono del barbiere.
--    Si riempie SOLO dal pannello Supabase, con una riga di SQL: dal sito
--    nessuno può aggiungersi.
-- 2. is_staff():   controllo interno "chi ha fatto l'accesso è staff?",
--                  usato dalle altre funzioni. Il sito non può chiamarla.
-- 3. am_i_staff(): la stessa domanda, ma per il sito: dopo l'accesso il sito
--                  la usa per decidere se portare Nicolas all'agenda.
-- 4. get_agenda(dal, al): gli appuntamenti confermati in un periodo, con i
--                  dati del cliente. Solo per lo staff: a tutti gli altri
--                  risponde con un errore.
--
-- Le tabelle restano chiuse come prima: Nicolas legge i dati dei clienti solo
-- attraverso get_agenda, che decide esattamente quali colonne escono.
--
-- Come si usa: copia TUTTO il file nell'SQL Editor di Supabase e premi Run
-- UNA volta sola, dopo la migrazione 10. Poi aggiungi Nicolas a "staff"
-- (istruzioni in docs/database.md, "L'account di Nicolas").


-- ============================================================
-- 1. Chi è del personale
-- ============================================================

-- user_id è il codice dell'account (lo stesso di auth.users).
-- "on delete cascade": se l'account viene cancellato, sparisce anche da qui.
create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS accesa e nessuna regola: dal sito nessuno legge né scrive.
-- Le funzioni qui sotto la leggono perché sono "security definer".
alter table public.staff enable row level security;
revoke all on table public.staff from anon, authenticated;


-- ============================================================
-- 2. Il controllo interno
-- ============================================================

create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff s where s.user_id = auth.uid()
  );
$$;

revoke execute on function public.is_staff() from public, anon, authenticated;


-- ============================================================
-- 3. La domanda del sito: "sono Nicolas?"
-- ============================================================

-- Risponde solo true o false, e solo per chi ha fatto l'accesso.
create function public.am_i_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_staff();
$$;

revoke execute on function public.am_i_staff() from public, anon;
grant execute on function public.am_i_staff() to authenticated;


-- ============================================================
-- 4. L'agenda
-- ============================================================

-- Gli appuntamenti CONFERMATI che iniziano tra p_from e p_to, in ordine di ora.
-- Per ognuno: orari, cliente, servizi (nell'ordine del listino), prezzo e
-- durata del momento in cui è stato prenotato.
-- I dati del cliente arrivano dal suo profilo (customers + email del suo
-- account); per le prenotazioni vecchie della prova, che non hanno un cliente
-- collegato, dai campi scritti nella prenotazione stessa (coalesce = "il primo
-- dei due che non è vuoto").
create function public.get_agenda(p_from timestamptz, p_to timestamptz)
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

  -- Come per get_busy_periods: niente richieste enormi
  if p_from is null or p_to is null or p_to <= p_from or p_to - p_from > interval '40 days' then
    raise exception 'Intervallo di date non valido.';
  end if;

  return query
    select
      b.id,
      b.starts_at,
      b.ends_at,
      coalesce(c.first_name, b.first_name),
      coalesce(c.last_name, b.last_name),
      coalesce(c.phone, b.phone),
      coalesce(u.email::text, b.email),
      array_agg(s.name order by sc.position, s.position),
      sum(bs.price),
      bool_or(s.from_price),
      sum(bs.duration_minutes)::integer
    from public.bookings b
    left join public.customers c on c.id = b.customer_id
    left join auth.users u on u.id = b.customer_id
    join public.booking_services bs on bs.booking_id = b.id
    join public.services s on s.id = bs.service_id
    join public.service_categories sc on sc.id = s.category_id
    where b.status = 'confirmed'
      and b.starts_at >= p_from
      and b.starts_at < p_to
    group by b.id, c.id, u.id
    order by b.starts_at;
end;
$$;

revoke execute on function public.get_agenda(timestamptz, timestamptz) from public, anon;
grant execute on function public.get_agenda(timestamptz, timestamptz) to authenticated;
