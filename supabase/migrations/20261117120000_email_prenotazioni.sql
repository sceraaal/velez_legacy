-- Migrazione 14 – Email delle prenotazioni (Fase 1, passo 6b)
--
-- Cosa fa: ogni volta che una prenotazione di un cliente CON account nasce,
-- viene disdetta o spostata, il database chiama la Edge Function
-- "booking-email", che spedisce l'email con Resend.
--
-- 1. Accende pg_net, l'estensione che permette al database di chiamare un
--    indirizzo web.
-- 2. get_booking_email_data(id): i dati che servono per scrivere l'email
--    (nome, email, giorno, servizi, prezzi). La può usare SOLO la Edge
--    Function (ruolo service_role), non il sito.
-- 3. send_booking_email(): la funzione del trigger. Capisce cosa è successo
--    (created / cancelled / moved) e chiama la Edge Function.
-- 4. Il trigger bookings_send_email sulla tabella bookings.
--
-- Indirizzo della Edge Function e parola segreta NON stanno in questo file:
-- stanno nel Vault di Supabase (la cassaforte del database), vedi
-- docs/database.md, sezione "Email delle prenotazioni".
--
-- Regola d'oro: un'email che non parte non deve MAI bloccare una
-- prenotazione. Per questo ogni errore qui diventa solo un avviso nei log.
-- Inoltre pg_net spedisce la chiamata solo DOPO che la prenotazione è stata
-- salvata davvero (fine della transazione): se la prenotazione fallisce,
-- nessuna email parte.
--
-- Come si usa: copia TUTTO il file nell'SQL Editor di Supabase e premi Run
-- UNA volta sola, dopo la migrazione 13.


-- ============================================================
-- 1. L'estensione pg_net
-- ============================================================

create extension if not exists pg_net with schema extensions;


-- ============================================================
-- 2. I dati per l'email (solo per la Edge Function)
-- ============================================================

-- Restituisce un oggetto JSON, per esempio:
-- { "first_name": "Mario", "email": "mario@esempio.it",
--   "starts_at": "...", "services": [ { "name": "Taglio Barber", "price": 18, "from_price": false } ] }
-- Se la prenotazione non è di un cliente con account risponde null.
create function public.get_booking_email_data(p_booking_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', b.id,
    'status', b.status,
    'source', b.source,
    'starts_at', b.starts_at,
    'ends_at', b.ends_at,
    'first_name', c.first_name,
    'last_name', c.last_name,
    'phone', c.phone,
    'email', u.email,
    'services', coalesce((
      select jsonb_agg(
        jsonb_build_object('name', s.name, 'price', bs.price, 'from_price', s.from_price)
        order by sc.position, s.position
      )
      from public.booking_services bs
      join public.services s on s.id = bs.service_id
      join public.service_categories sc on sc.id = s.category_id
      where bs.booking_id = b.id
    ), '[]'::jsonb)
  )
  from public.bookings b
  join public.customers c on c.id = b.customer_id
  join auth.users u on u.id = b.customer_id
  where b.id = p_booking_id;
$$;

-- Contiene email e telefono: né i visitatori né i clienti la possono usare.
revoke execute on function public.get_booking_email_data(uuid) from public, anon, authenticated;
grant execute on function public.get_booking_email_data(uuid) to service_role;


-- ============================================================
-- 3. La funzione del trigger
-- ============================================================

create function public.send_booking_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event text;
  v_old_starts_at timestamptz;
  v_url text;
  v_secret text;
begin
  -- Solo i clienti con account hanno un'email. Quelli inseriti a mano senza
  -- account (walk_in_customer_id) non ricevono nulla.
  if new.customer_id is null then
    return null;
  end if;

  -- Cosa è successo?
  if tg_op = 'INSERT' then
    if new.status <> 'confirmed' then
      return null;
    end if;
    v_event := 'created';
  elsif old.status = 'confirmed' and new.status = 'cancelled' then
    v_event := 'cancelled';
  elsif new.status = 'confirmed' and new.starts_at <> old.starts_at then
    v_event := 'moved';
    v_old_starts_at := old.starts_at;
  else
    return null;  -- nessun cambiamento che interessa al cliente
  end if;

  -- Indirizzo e parola segreta dal Vault
  select ds.decrypted_secret into v_url
  from vault.decrypted_secrets ds where ds.name = 'booking_email_url';
  select ds.decrypted_secret into v_secret
  from vault.decrypted_secrets ds where ds.name = 'booking_email_secret';

  if v_url is null or v_secret is null then
    raise warning 'Email prenotazione non inviata: mancano booking_email_url o booking_email_secret nel Vault.';
    return null;
  end if;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object(
      'booking_id', new.id,
      'event', v_event,
      'old_starts_at', v_old_starts_at,
      -- true se l'ha fatto Nicolas dall'agenda (disdetta o inserimento a mano)
      'by_staff', public.is_staff()
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    timeout_milliseconds := 10000
  );

  return null;
exception when others then
  -- Qualsiasi problema: avviso nei log (Logs → Postgres), prenotazione salva.
  raise warning 'Email prenotazione non inviata: %', sqlerrm;
  return null;
end;
$$;

revoke execute on function public.send_booking_email() from public, anon, authenticated;


-- ============================================================
-- 4. Il trigger
-- ============================================================

-- Scatta dopo ogni prenotazione nuova e dopo ogni cambio di stato o di orario.
create trigger bookings_send_email
after insert or update of status, starts_at on public.bookings
for each row execute function public.send_booking_email();
