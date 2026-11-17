-- ============================================================
-- Pulizia dei dati di prova, PRIMA DEL LANCIO (Fase 1, passo 7)
-- ============================================================
-- NON è una migrazione: non cambia la struttura del database, cancella solo
-- dati. Si lancia una volta sola, a mano, nell'SQL Editor di Supabase,
-- il giorno del lancio. Una cancellazione non si può annullare.
--
-- Cosa cancella:
--   - tutte le prenotazioni (e i servizi collegati, in automatico)
--   - tutti i clienti inseriti a mano da Nicolas (walk-in)
--   - tutti gli account TRANNE quelli in `staff` (cioè Nicolas): con l'account
--     sparisce anche il profilo in `customers` (on delete cascade)
-- Cosa NON tocca: listino, account di Nicolas, impostazioni email e promemoria.
-- I blocchi (ferie/impegni) li decide il PASSO 3: potrebbero essere veri.
--
-- Nessuna email parte: il trigger delle email scatta solo quando una
-- prenotazione viene creata o modificata, non quando viene cancellata.


-- ------------------------------------------------------------
-- PASSO 1 – Guardare prima di cancellare (lanciare da solo)
-- ------------------------------------------------------------
select
  (select count(*) from public.bookings)          as prenotazioni,
  (select count(*) from public.walk_in_customers) as clienti_a_mano,
  (select count(*) from public.blocked_periods)   as blocchi,
  (select count(*) from auth.users
     where id not in (select user_id from public.staff)) as account_da_cancellare,
  (select string_agg(email, ', ') from auth.users
     where id in (select user_id from public.staff))      as account_che_restano;
-- In "account_che_restano" deve esserci SOLO l'email di Nicolas.
-- Se c'è qualcos'altro o manca, fermarsi e chiedere.


-- ------------------------------------------------------------
-- PASSO 2 – Cancellare (selezionare da "begin" a "commit" e lanciare)
-- ------------------------------------------------------------
-- begin/commit = una "transazione": o va a buon fine tutto, o niente.
begin;

delete from public.bookings;            -- booking_services se ne va con loro
delete from public.walk_in_customers;   -- ora nessuna prenotazione li usa più
delete from auth.users
  where id not in (select user_id from public.staff);

commit;


-- ------------------------------------------------------------
-- PASSO 3 – I blocchi di prova (solo se servono)
-- ------------------------------------------------------------
-- Prima guardarli, con gli orari in ora italiana:
select id,
       starts_at at time zone 'Europe/Rome' as inizio,
       ends_at   at time zone 'Europe/Rome' as fine,
       reason
from public.blocked_periods
order by starts_at;
-- Poi cancellare solo quelli di prova, uno per uno, mettendo il numero
-- della colonna id al posto di 123:
-- delete from public.blocked_periods where id = 123;


-- ------------------------------------------------------------
-- PASSO 4 – Controllo finale (deve dare tutti zero, tranne i blocchi veri)
-- ------------------------------------------------------------
select
  (select count(*) from public.bookings)          as prenotazioni,
  (select count(*) from public.customers)         as clienti,
  (select count(*) from public.walk_in_customers) as clienti_a_mano;
