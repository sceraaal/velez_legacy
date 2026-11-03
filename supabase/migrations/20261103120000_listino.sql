-- Migrazione 1 – Il listino (passo 3)
-- Crea le due tabelle del listino e le regole di sicurezza (RLS).
-- Come si usa: copia tutto il file nell'SQL Editor di Supabase e premi Run.
-- Va lanciato UNA volta sola, su un database ancora vuoto.

-- 1. Le categorie del listino (Esperienze Luxury, Taglio, ...)
create table public.service_categories (
  id text primary key,                 -- es. 'taglio': un nome breve, leggibile
  name text not null,                  -- il titolo mostrato nel listino
  position smallint not null           -- l'ordine in cui compare (1 = prima)
);

-- 2. I servizi, ognuno dentro una categoria
create table public.services (
  id text primary key,                 -- es. 'taglio-barber'
  category_id text not null
    references public.service_categories (id),  -- chiave esterna: la categoria deve esistere
  name text not null,
  price numeric(6, 2) not null
    check (price >= 0),                -- controllo: niente prezzi negativi
  from_price boolean not null default false,    -- true = mostra "da €X"
  duration_minutes smallint not null
    check (duration_minutes > 0),      -- controllo: la durata deve essere positiva
  position smallint not null,          -- l'ordine dentro la categoria
  is_active boolean not null default true       -- false = nascosto dal sito, ma non cancellato
);

-- 3. Sicurezza: Row Level Security (RLS)
-- Con RLS attiva, nessuno può leggere o scrivere finché una regola non lo permette.
alter table public.service_categories enable row level security;
alter table public.services enable row level security;

-- Il ruolo "anon" è chi visita il sito con la chiave pubblica.
-- Gli diamo solo il permesso di LEGGERE (select), mai di scrivere.
grant select on public.service_categories to anon;
grant select on public.services to anon;

-- Regola: chiunque può leggere tutte le categorie
create policy "Il listino è pubblico: categorie"
  on public.service_categories
  for select
  to anon
  using (true);

-- Regola: chiunque può leggere i servizi, ma solo quelli attivi
create policy "Il listino è pubblico: servizi attivi"
  on public.services
  for select
  to anon
  using (is_active);

-- Nessuna regola per insert, update o delete: dal sito non si può modificare
-- nulla. I prezzi si cambiano dal pannello di Supabase (Table Editor).
