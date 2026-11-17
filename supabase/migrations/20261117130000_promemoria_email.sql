-- Migrazione 15 – Promemoria via email (Fase 1, dopo il passo 6)
--
-- Cosa fa: ogni 15 minuti il database controlla se ci sono appuntamenti tra
-- 24 ore o tra 2 ore che non hanno ancora avuto il promemoria, e per ognuno
-- chiama la Edge Function "booking-email" (la stessa della migrazione 14),
-- che spedisce l'email al cliente.
--
-- 1. Due colonne nuove in bookings: quando il promemoria è stato "sbrigato"
--    (inviato, oppure saltato perché non serviva).
-- 2. Trigger bookings_reset_reminders: a ogni prenotazione nuova o spostata
--    rimette a posto le due colonne. Se mancano meno di 24 ore (o 2 ore) il
--    promemoria si segna subito come sbrigato: il cliente ha appena ricevuto
--    la conferma, un promemoria sarebbe un doppione.
-- 3. send_due_reminders(): il controllo che trova i promemoria da mandare.
-- 4. pg_cron: l'orologio del database che lancia il controllo ogni 15 minuti.
--
-- Solo i clienti con account ricevono promemoria; Nicolas no.
-- Come la migrazione 14, usa i segreti booking_email_url e
-- booking_email_secret del Vault: se mancano, nessun promemoria parte.
--
-- Come si usa: copia TUTTO il file nell'SQL Editor di Supabase e premi Run
-- UNA volta sola, dopo la migrazione 14. Poi rimetti online la Edge Function
-- (npx supabase functions deploy ..., vedi docs/database.md), che contiene
-- i testi dei promemoria.


-- ============================================================
-- 1. Le colonne
-- ============================================================

alter table public.bookings
  add column reminder_24h_done_at timestamptz,
  add column reminder_2h_done_at timestamptz;

comment on column public.bookings.reminder_24h_done_at is
  'Quando il promemoria del giorno prima è stato inviato (o saltato perché non serviva). Vuoto = ancora da fare.';
comment on column public.bookings.reminder_2h_done_at is
  'Quando il promemoria di 2 ore prima è stato inviato (o saltato perché non serviva). Vuoto = ancora da fare.';

-- Le prenotazioni che già esistono: niente promemoria per quelle passate o
-- troppo vicine (stessa regola del trigger qui sotto).
update public.bookings
set reminder_24h_done_at = now()
where starts_at < now() + interval '24 hours';

update public.bookings
set reminder_2h_done_at = now()
where starts_at < now() + interval '2 hours';


-- ============================================================
-- 2. Prenotazione nuova o spostata: si riparte da capo
-- ============================================================

create function public.reset_booking_reminders()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.starts_at <> old.starts_at then
    -- Vuoto = da mandare; now() = saltato, perché manca troppo poco
    new.reminder_24h_done_at :=
      case when new.starts_at < now() + interval '24 hours' then now() end;
    new.reminder_2h_done_at :=
      case when new.starts_at < now() + interval '2 hours' then now() end;
  end if;
  return new;
end;
$$;

revoke execute on function public.reset_booking_reminders() from public, anon, authenticated;

-- BEFORE: cambia la riga prima che venga salvata
create trigger bookings_reset_reminders
before insert or update of starts_at on public.bookings
for each row execute function public.reset_booking_reminders();


-- ============================================================
-- 3. Il controllo dei promemoria da mandare
-- ============================================================

-- Restituisce quanti promemoria ha fatto partire (utile per provarla a mano
-- dall'SQL Editor: select public.send_due_reminders();).
create function public.send_due_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
  v_booking record;
  v_count integer := 0;
begin
  select ds.decrypted_secret into v_url
  from vault.decrypted_secrets ds where ds.name = 'booking_email_url';
  select ds.decrypted_secret into v_secret
  from vault.decrypted_secrets ds where ds.name = 'booking_email_secret';

  if v_url is null or v_secret is null then
    raise warning 'Promemoria non inviati: mancano booking_email_url o booking_email_secret nel Vault.';
    return 0;
  end if;

  -- Prima quelli di 2 ore: se per qualche motivo il promemoria del giorno
  -- prima non è partito (es. database in pausa), lo segniamo come sbrigato,
  -- così il cliente non riceve due promemoria uno dopo l'altro.
  -- L'update segna il promemoria e restituisce le righe: ognuna parte una
  -- volta sola, anche se il controllo girasse due volte insieme.
  for v_booking in
    update public.bookings b
    set reminder_2h_done_at = now(),
        reminder_24h_done_at = coalesce(b.reminder_24h_done_at, now())
    where b.status = 'confirmed'
      and b.customer_id is not null
      and b.reminder_2h_done_at is null
      and b.starts_at > now()
      and b.starts_at <= now() + interval '2 hours'
    returning b.id
  loop
    perform net.http_post(
      url := v_url,
      body := jsonb_build_object('booking_id', v_booking.id, 'event', 'reminder_2h', 'by_staff', false),
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_secret),
      timeout_milliseconds := 10000
    );
    v_count := v_count + 1;
  end loop;

  -- Poi quelli del giorno prima
  for v_booking in
    update public.bookings b
    set reminder_24h_done_at = now()
    where b.status = 'confirmed'
      and b.customer_id is not null
      and b.reminder_24h_done_at is null
      and b.starts_at > now()
      and b.starts_at <= now() + interval '24 hours'
    returning b.id
  loop
    perform net.http_post(
      url := v_url,
      body := jsonb_build_object('booking_id', v_booking.id, 'event', 'reminder_24h', 'by_staff', false),
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_secret),
      timeout_milliseconds := 10000
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- La lancia solo l'orologio del database (o tu dall'SQL Editor)
revoke execute on function public.send_due_reminders() from public, anon, authenticated;


-- ============================================================
-- 4. L'orologio: pg_cron, ogni 15 minuti
-- ============================================================

create extension if not exists pg_cron with schema pg_catalog;

-- "*/15 * * * *" = al minuto 0, 15, 30 e 45 di ogni ora.
-- Il lavoro si vede in Integrations → Cron del pannello Supabase.
-- Per fermarlo: select cron.unschedule('promemoria-email');
select cron.schedule('promemoria-email', '*/15 * * * *', 'select public.send_due_reminders()');
