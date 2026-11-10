-- Migrazione 12 – Ferie, impegni e disdetta da parte di Nicolas (Fase 1, passo 5a)
--
-- Cosa fa: quattro funzioni nuove, tutte SOLO per lo staff (is_staff(),
-- migrazione 11). A chiunque altro rispondono "Pagina riservata.".
-- - get_blocked_periods():          i blocchi non ancora finiti
-- - add_blocked_period(da, a, nota): salva un blocco, ma NON se in quel periodo
--                                   ci sono appuntamenti (li elenca)
-- - delete_blocked_period(id):      toglie un blocco
-- - staff_cancel_booking(id):       Nicolas disdice un appuntamento, senza il
--                                   limite di un'ora che vale per i clienti
--
-- Nessuna tabella nuova: i blocchi stanno già in "blocked_periods"
-- (migrazione 3), le disdette in "bookings" (status + cancelled_at).
--
-- Come si usa: copia TUTTO il file nell'SQL Editor di Supabase e premi Run
-- UNA volta sola, dopo la migrazione 11.


-- ============================================================
-- 1. I blocchi
-- ============================================================

-- Quelli che finiscono da adesso in poi, dal più vicino. I blocchi già
-- passati restano nel database ma non servono a Nicolas.
create function public.get_blocked_periods()
returns table (id bigint, starts_at timestamptz, ends_at timestamptz, reason text)
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
    select bp.id, bp.starts_at, bp.ends_at, bp.reason
    from public.blocked_periods bp
    where bp.ends_at > now()
    order by bp.starts_at;
end;
$$;


-- Salva un blocco. Se nel periodo c'è anche un solo appuntamento confermato,
-- si ferma e scrive chi è prenotato: Nicolas li avvisa, li disdice e poi
-- blocca di nuovo. Così nessun cliente resta prenotato durante le ferie.
create function public.add_blocked_period(p_starts_at timestamptz, p_ends_at timestamptz, p_reason text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text := nullif(trim(p_reason), '');  -- nota vuota = nessuna nota
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

  -- Chi è prenotato nel periodo? Es. "17/11 ore 09:00 Mario Rossi".
  -- coalesce: per le prenotazioni della prova il nome sta nella prenotazione.
  select string_agg(
           to_char(b.starts_at at time zone 'Europe/Rome', 'DD/MM "ore" HH24:MI')
             || ' ' || coalesce(c.first_name, b.first_name) || ' ' || coalesce(c.last_name, b.last_name),
           ', ' order by b.starts_at)
    into v_conflicts
  from public.bookings b
  left join public.customers c on c.id = b.customer_id
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


create function public.delete_blocked_period(p_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Pagina riservata.';
  end if;

  delete from public.blocked_periods where id = p_id;
  if not found then
    raise exception 'Blocco non trovato.';
  end if;
end;
$$;


-- ============================================================
-- 2. La disdetta da parte di Nicolas
-- ============================================================

-- Come cancel_booking (migrazione 7), ma per qualsiasi appuntamento
-- confermato e senza il limite di un'ora. L'orario torna libero.
create function public.staff_cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Pagina riservata.';
  end if;

  update public.bookings
  set status = 'cancelled', cancelled_at = now()
  where id = p_booking_id and status = 'confirmed';

  if not found then
    raise exception 'Appuntamento non trovato o già disdetto.';
  end if;
end;
$$;


-- ============================================================
-- 3. Chi può chiamarle: solo chi ha fatto l'accesso
--    (e poi, dentro, solo lo staff)
-- ============================================================

revoke execute on function public.get_blocked_periods() from public, anon;
revoke execute on function public.add_blocked_period(timestamptz, timestamptz, text) from public, anon;
revoke execute on function public.delete_blocked_period(bigint) from public, anon;
revoke execute on function public.staff_cancel_booking(uuid) from public, anon;

grant execute on function public.get_blocked_periods() to authenticated;
grant execute on function public.add_blocked_period(timestamptz, timestamptz, text) to authenticated;
grant execute on function public.delete_blocked_period(bigint) to authenticated;
grant execute on function public.staff_cancel_booking(uuid) to authenticated;
