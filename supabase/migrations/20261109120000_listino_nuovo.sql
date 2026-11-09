-- Migrazione 9 – Il nuovo listino di Nicolas (2026-11-09)
-- Aggiunge le descrizioni dei servizi, la sezione "Skincare & trattamenti viso"
-- e 6 servizi nuovi. I 14 servizi di prima restano uguali (prezzi e durate).
-- Come si usa: copia tutto il file nell'SQL Editor di Supabase e premi Run.
-- Va lanciato UNA volta sola, dopo le migrazioni 1-8.

-- 1. Una colonna nuova per la descrizione: testo facoltativo (null = nessuna
--    descrizione). Le regole RLS e il permesso SELECT valgono per tutta la riga,
--    quindi il sito la può leggere senza altre modifiche.
alter table public.services
  add column description text;

-- 2. La sezione nuova va tra "Barba e rasatura" (3) e "Servizi tecnici":
--    prima spostiamo in giù Servizi tecnici ed Extra, poi la inseriamo al 4° posto.
update public.service_categories set position = 5 where id = 'tecnici';
update public.service_categories set position = 6 where id = 'extra';

insert into public.service_categories (id, name, position) values
  ('skincare', 'Skincare & trattamenti viso', 4);

-- 3. Il Presidential va per primo tra i Luxury: spostiamo in giù gli altri tre.
update public.services set position = position + 1 where category_id = 'luxury';

-- 4. I 6 servizi nuovi. La durata del Presidential sul listino è "75-80 minuti":
--    al calendario serve un numero solo, quindi 80 (con gli inizi ogni mezz'ora
--    75 e 80 occupano comunque 1 ora e mezza).
insert into public.services
  (id, category_id, name, price, from_price, duration_minutes, position, description) values
  ('presidential-luxury', 'luxury', 'Presidential Luxury Experience', 55, false, 80, 1,
   'Taglio capelli sartoriale, rasatura o cura barba completa, uniti al trattamento viso high-tech completo con vapore, pulizia profonda a ultrasuoni, spazzola sonica, maschera detox, patch occhi e massaggio con sieri.'),
  ('rasatura-presidential', 'barba', 'Rasatura Presidential', 30, false, 45, 4,
   'Rasatura tradizionale completa con panni caldi e vapore, rifinitura di precisione e aggiunta di maschera viso purificante express o trattamento lenitivo post-rasatura con dispositivi tecnologici.'),
  ('deep-tech-facial', 'skincare', 'Deep Tech Facial', 25, false, 30, 1,
   'Trattamento purificante intensivo con vapore, pulizia profonda a ultrasuoni, spazzola sonica e maschera viso idratante/detox.'),
  ('royal-anti-fatigue', 'skincare', 'Royal Anti-Fatigue Treatment', 35, false, 40, 2,
   'Trattamento viso rivitalizzante anti-fatica con panni caldi, vapore, patch occhi specifici per borse e occhiaie, maschera in argilla e applicazione di siero protettivo.'),
  ('maschera-detox', 'extra', 'Maschera Viso Detox (Carbone/Argilla)', 10, false, 10, 2, null),
  ('vapore-panni-caldi', 'extra', 'Trattamento Vapore & Panni Caldi Extra', 7, false, 10, 3, null);
