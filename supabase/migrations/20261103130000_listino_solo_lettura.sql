-- Migrazione 2 – Il listino in sola lettura anche a livello di permessi
--
-- Perché: in alcuni progetti Supabase ogni tabella nuova riceve in automatico
-- TUTTI i permessi (lettura, inserimento, modifica, cancellazione) per i ruoli
-- "anon" (visitatori) e "authenticated" (utenti con login). Le regole RLS
-- bloccano comunque le modifiche, ma in silenzio: l'update "riesce" e cambia
-- zero righe. Togliendo i permessi, un tentativo di modifica viene rifiutato
-- con un errore chiaro. Sono due protezioni invece di una.
--
-- Come si usa: copia tutto nell'SQL Editor e premi Run UNA volta.
-- Si può rilanciare senza danni.

revoke insert, update, delete, truncate, references, trigger
  on public.service_categories, public.services
  from anon, authenticated;

-- La lettura resta permessa (le regole RLS decidono poi quali righe)
grant select on public.service_categories, public.services to anon, authenticated;

-- Controllo: deve mostrare solo righe con privilege_type = SELECT
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('service_categories', 'services')
  and grantee in ('anon', 'authenticated')
order by grantee, table_name;
