-- Migrazione 4 – I profili dei clienti (Fase 1, passo 1)
--
-- Gli account (email e password) li gestisce Supabase Auth, nella tabella
-- auth.users, che non tocchiamo. Qui creiamo la tabella "customers" con gli
-- altri dati del cliente: nome, cognome, telefono e consenso all'informativa.
-- L'email resta solo in auth.users, così non la salviamo due volte.
--
-- Il profilo lo crea il database da solo, con un trigger (una regola che
-- scatta da sola) quando nasce un nuovo account dal modulo di registrazione.
--
-- Come si usa: copia TUTTO il file nell'SQL Editor di Supabase e premi Run
-- UNA volta sola.


-- ============================================================
-- 1. Tabella
-- ============================================================

create table public.customers (
  -- Lo stesso codice dell'account in auth.users. "on delete cascade": se un
  -- account viene cancellato, si cancella anche il suo profilo.
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 60),
  phone text not null check (char_length(phone) between 9 and 20),
  privacy_accepted_at timestamptz not null,       -- quando ha accettato l'informativa
  created_at timestamptz not null default now()
);


-- ============================================================
-- 2. Sicurezza: ognuno vede solo il proprio profilo
-- ============================================================

alter table public.customers enable row level security;

-- auth.uid() è il codice dell'utente che ha fatto il login (null per i
-- visitatori). "(select auth.uid())" invece di "auth.uid()" è il modo
-- consigliato da Supabase: il database lo calcola una volta sola.
create policy "Il cliente legge il proprio profilo"
  on public.customers for select
  to authenticated
  using ((select auth.uid()) = id);

-- Permessi: tolgo tutto e ridò solo quello che serve (come nella migrazione 2).
-- I visitatori (anon) non hanno nessun permesso; chi ha fatto il login può
-- solo leggere. Nessuno può aggiungere o cambiare righe dal sito: le crea solo
-- il trigger qui sotto. La modifica dei propri dati arriverà con una nuova
-- migrazione, con gli stessi controlli della registrazione.
revoke all on public.customers from anon, authenticated;
grant select on public.customers to authenticated;


-- ============================================================
-- 3. Trigger: crea il profilo quando nasce un account
-- ============================================================

-- Il sito, alla registrazione, manda nome, cognome, telefono e consenso
-- insieme a email e password (nei "metadati" dell'account, la colonna
-- raw_user_meta_data). Questa funzione li legge, li controlla e crea il profilo.
--
-- Se i metadati non ci sono (account creato a mano dal pannello, per esempio
-- quello di Nicolas) non crea nessun profilo e non blocca nulla.
-- Se ci sono ma non sono validi, blocca la registrazione: il sito fa gli stessi
-- controlli prima (src/lib/customer.js), quindi succede solo a chi lo aggira.
create function public.create_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_first_name text := trim(new.raw_user_meta_data ->> 'first_name');
  v_last_name text := trim(new.raw_user_meta_data ->> 'last_name');
  v_phone text := trim(new.raw_user_meta_data ->> 'phone');
  v_digits text;
begin
  if v_first_name is null then
    return new;
  end if;

  v_digits := regexp_replace(coalesce(v_phone, ''), '[^0-9]', '', 'g');

  if v_first_name = '' or coalesce(v_last_name, '') = ''
     or char_length(v_first_name) > 60 or char_length(v_last_name) > 60 then
    raise exception 'Nome o cognome non validi.';
  end if;
  if char_length(v_digits) not between 9 and 15
     or v_phone !~ '^\+?[0-9 ]+$' then
    raise exception 'Il numero di telefono non sembra valido.';
  end if;
  if new.raw_user_meta_data ->> 'privacy_accepted' is distinct from 'true' then
    raise exception 'Per registrarsi deve accettare l''informativa sulla privacy.';
  end if;

  insert into public.customers (id, first_name, last_name, phone, privacy_accepted_at)
  values (new.id, v_first_name, v_last_name, v_phone, now());

  return new;
end;
$$;

-- La funzione la usa solo il trigger: nessuno la può chiamare dal sito
revoke execute on function public.create_customer_profile() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_customer_profile();
