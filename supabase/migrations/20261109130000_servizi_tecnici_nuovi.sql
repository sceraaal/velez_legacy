-- Migrazione 10 – Due servizi tecnici nuovi (2026-11-09)
-- Colpi di sole e Decolorazione totale, dopo Tonalizzante nella sezione
-- "Servizi tecnici". Come gli altri servizi tecnici il prezzo è "da €X"
-- (from_price = true): il prezzo finale si decide in salone.
-- Come si usa: copia tutto il file nell'SQL Editor di Supabase e premi Run.
-- Va lanciato UNA volta sola, dopo la migrazione 9.

-- Durate: Nicolas ha indicato "60-90 minuti" e "più di 2 ore". Al calendario
-- serve un numero solo, e conviene il più lungo: se il servizio finisce prima
-- resta un po' di tempo libero, se finisce dopo si accavalla col cliente
-- successivo. Quindi 90 e 150 minuti. Si cambiano dal Table Editor
-- (services → duration_minutes) senza toccare il codice.
insert into public.services
  (id, category_id, name, price, from_price, duration_minutes, position) values
  ('colpi-di-sole', 'tecnici', 'Colpi di sole', 40, true, 90, 3),
  ('decolorazione-totale', 'tecnici', 'Decolorazione totale', 60, true, 150, 4);
