-- Migrazione 5 – Il listino visibile anche a chi ha fatto l'accesso
--
-- Il problema: le regole RLS del listino (migrazione 1) valgono solo per il
-- ruolo "anon", cioè per i visitatori senza login. Quando un cliente entra nel
-- suo account, Supabase lo tratta con il ruolo "authenticated": per lui non
-- c'era nessuna regola, quindi il database gli restituiva un listino vuoto
-- (e senza servizi la prenotazione non si vede).
--
-- La correzione: le stesse due regole valgono per entrambi i ruoli.
-- La migrazione 1 non si modifica perché è già stata lanciata: si cambia la
-- regola qui con "alter policy". Il permesso di lettura per "authenticated"
-- c'è già (migrazione 2).
--
-- Come si usa: copia TUTTO il file nell'SQL Editor di Supabase e premi Run
-- UNA volta sola.

alter policy "Il listino è pubblico: categorie"
  on public.service_categories
  to anon, authenticated;

alter policy "Il listino è pubblico: servizi attivi"
  on public.services
  to anon, authenticated;
