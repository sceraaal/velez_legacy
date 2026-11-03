-- Dati iniziali del listino (passo 3)
-- I 14 servizi di Nicolas, presi da src/data/services.js il 2026-11-03.
-- Come si usa: dopo la migrazione, copia questo file nell'SQL Editor e premi Run.
-- Per cambiare un prezzo in seguito NON serve rilanciarlo: si usa il Table Editor.

insert into public.service_categories (id, name, position) values
  ('luxury', 'Esperienze Luxury', 1),
  ('taglio', 'Taglio', 2),
  ('barba', 'Barba e rasatura', 3),
  ('tecnici', 'Servizi tecnici', 4),
  ('extra', 'Extra', 5);

insert into public.services
  (id, category_id, name, price, from_price, duration_minutes, position) values
  ('luxury-cut', 'luxury', 'Luxury Cut Experience', 25, false, 50, 1),
  ('luxury-total', 'luxury', 'Luxury Total Experience', 40, false, 80, 2),
  ('luxury-beard', 'luxury', 'Luxury Beard Experience', 18, false, 30, 3),
  ('taglio-barber', 'taglio', 'Taglio Barber', 18, false, 30, 1),
  ('taglio-under-14', 'taglio', 'Taglio Barber Under 14', 15, false, 30, 2),
  ('taglio-ritual', 'taglio', 'Taglio + Ritual', 20, false, 40, 3),
  ('taglio-barba', 'taglio', 'Taglio Barber + Barba', 23, false, 45, 4),
  ('taglio-rituals-barba', 'taglio', 'Taglio Barber + Rituals + Barba', 25, false, 45, 5),
  ('barba-city-man', 'barba', 'Barba City Man', 10, false, 15, 1),
  ('rasatura-uniformata', 'barba', 'Rasatura Uniformata', 15, false, 30, 2),
  ('rasatura-tradizionale', 'barba', 'Rasatura Tradizionale completa', 20, false, 30, 3),
  ('colorazione', 'tecnici', 'Colorazione Uomo', 20, true, 30, 1),
  ('tonalizzante', 'tecnici', 'Tonalizzante', 30, true, 30, 2),
  ('patch-occhi', 'extra', 'Patch Occhi', 3, false, 10, 1);
