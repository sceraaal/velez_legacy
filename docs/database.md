# Database – Velez Legacy Barber

Il database è un progetto **Supabase** (PostgreSQL) nella regione **Central EU
(Frankfurt)**, `eu-central-1`, piano Free. L'account è di Simona.

## Tabelle

### `service_categories` – le sezioni del listino

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id` | testo, chiave primaria | nome breve, es. `taglio` |
| `name` | testo | titolo mostrato, es. "Taglio" |
| `position` | numero | ordine nel listino (1 = prima) |

### `services` – i servizi

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id` | testo, chiave primaria | es. `taglio-barber` |
| `category_id` | testo, chiave esterna → `service_categories.id` | la sezione |
| `name` | testo | nome mostrato |
| `price` | numero con 2 decimali, mai negativo | prezzo in euro |
| `from_price` | sì/no | `true` = mostra "da €X" (servizi tecnici) |
| `duration_minutes` | numero intero, maggiore di zero | durata, servirà al calendario |
| `position` | numero | ordine dentro la sezione |
| `is_active` | sì/no | `false` = nascosto dal sito, ma non cancellato |

### `bookings` – le prenotazioni (passo 4, cliente dalla Fase 1 passo 2)

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id` | codice unico (uuid) | generato dal database |
| `starts_at` / `ends_at` | data e ora | fine arrotondata alla mezz'ora successiva |
| `customer_id` | uuid → `customers.id`, facoltativo | il cliente con l'account che ha prenotato |
| `first_name`, `last_name` | testo, facoltativi | solo prenotazioni della prova e, dal passo 5, quelle inserite a mano |
| `phone`, `email` | testo, facoltativi | come sopra |
| `privacy_accepted_at` | data e ora, facoltativo | come sopra |
| `status` | `confirmed` o `cancelled` | una disdetta libera l'orario |
| `cancelled_at` | data e ora, facoltativo | quando è stata disdetta (migrazione 7) |
| `created_at` | data e ora | |

Vincolo `bookings_no_overlap`: due prenotazioni confermate non possono
sovrapporsi nel tempo, nemmeno se arrivano nello stesso istante.
Vincolo `bookings_has_customer`: ogni prenotazione ha `customer_id` oppure nome
e cognome. Per i clienti con l'account i dati si leggono da `customers`.

### `booking_services` – i servizi di ogni prenotazione

`booking_id`, `service_id`, e `price` / `duration_minutes` **copiati al momento
della prenotazione** (se un prezzo cambia, le prenotazioni vecchie restano giuste).

### `blocked_periods` – ferie e impegni di Nicolas

`starts_at`, `ends_at`, `reason` (nota interna). In quei periodi non si prenota.

### `customers` – i profili dei clienti (Fase 1, passo 1)

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id` | uuid, chiave primaria → `auth.users.id` | lo stesso codice dell'account |
| `first_name`, `last_name` | testo | |
| `phone` | testo | stessi controlli di `create_booking` |
| `privacy_accepted_at` | data e ora | prova del consenso all'informativa |
| `created_at` | data e ora | |

Email e password stanno solo negli account di Supabase Auth (`auth.users`, la
password cifrata). Il profilo lo crea il trigger `on_auth_user_created` con la
funzione `create_customer_profile`, leggendo nome, cognome, telefono e consenso
che il sito manda alla registrazione. Il trigger `customers_capitalize_name`
(migrazione 8) mette la maiuscola all'iniziale di ogni parola di nome e cognome
se manca ("simona d'angelo" → "Simona D'Angelo"), senza toccare il resto. Un account creato a mano dal pannello
(senza questi dati) non ha profilo: servirà per l'account di Nicolas.

## Funzioni

- `get_busy_periods(da, a)` – restituisce solo inizio e fine dei periodi occupati
  (prenotazioni confermate e blocchi), massimo 40 giorni per richiesta. Nessun dato
  personale.
- `create_booking(servizi, inizio)` (migrazione 6) – prende il cliente dal login
  (`auth.uid()`): serve l'accesso e un profilo in `customers`. Controlla le regole
  di `docs/regole-progetto.md` (martedì–sabato, inizio ogni 30 minuti, 8:00–20:00
  servizio compreso, almeno 1 ora e al massimo 30 giorni prima, niente
  sovrapposizioni o blocchi), calcola durata e prezzo dal database e salva.
  Restituisce anche il nome del cliente per la schermata di conferma. Gli errori
  sono messaggi in italiano con il Lei, pronti da mostrare. La può chiamare solo
  il ruolo `authenticated`. (La versione della migrazione 3, con nome, telefono
  ed email, è stata tolta.)

- `check_booking_slot(inizio, minuti)` (migrazione 7) – **le regole sugli orari in
  un posto solo**: giorni, mezz'ore, 8:00–20:00, preavviso di 1 ora, 30 giorni,
  ferie. La usano `create_booking` e `reschedule_booking`; dal sito non si può
  chiamare. Se Nicolas cambia gli orari, si cambia qui (con una nuova migrazione)
  e in `src/lib/availability.js`.
- `get_my_bookings()` – le prenotazioni confermate di chi ha fatto l'accesso, con
  nomi dei servizi, prezzo e durata. Solo le sue.
- `cancel_booking(id)` – disdice una sua prenotazione confermata, se manca più di
  un'ora; segna `cancelled_at`.
- `reschedule_booking(id, nuovo inizio)` – sposta una sua prenotazione (stessi
  servizi), se manca più di un'ora. Aggiorna la stessa riga: se il nuovo orario
  non va bene, il vecchio resta.

Sono tutte `security definer`: lavorano con i permessi di chi le ha create, così
il cliente prenota, legge, disdice e sposta solo le sue prenotazioni senza poter
leggere la tabella `bookings`. Le ultime tre e `create_booking` le può chiamare
solo il ruolo `authenticated`.

## Sicurezza (RLS)

`customers`: chi ha fatto il login legge **solo la propria riga**; nessuno
(nemmeno il cliente) può aggiungere o modificare righe dal sito. I visitatori
non vedono nulla.

RLS è attiva su entrambe le tabelle. Il sito usa la chiave **pubblica**
(`sb_publishable_...`), cioè il ruolo `anon`, che può solo:

- leggere tutte le categorie;
- leggere i servizi con `is_active = true`.

Chi ha fatto l'accesso usa il ruolo `authenticated`, che per il listino ha le
stesse regole (migrazione 5). **Da ricordare:** ogni regola RLS pensata "per
tutti" va scritta `to anon, authenticated`, altrimenti i clienti dentro il loro
account non vedono nulla.

Le tabelle `bookings`, `booking_services` e `blocked_periods` hanno RLS attiva e
**nessun permesso** per `anon` e `authenticated`: dal sito si possono solo chiamare
le due funzioni.

Sul listino non c'è nessuna regola per aggiungere, modificare o cancellare, e in più i ruoli
`anon` e `authenticated` hanno solo il permesso SELECT (migrazione 2): dal sito non
si può cambiare nulla. Due protezioni: senza la migrazione 2 un tentativo di
modifica "riesce" ma cambia zero righe; con la migrazione 2 viene rifiutato con
`permission denied`. La chiave **segreta** non si usa e non va mai nel codice.

## Come si fa a…

- **Cambiare un prezzo o un nome**: pannello Supabase → Table Editor → `services`
  → doppio clic sulla cella → modifica → invio. La pagina lo mostra al prossimo
  caricamento.
- **Nascondere un servizio**: metti `is_active` a `false`. Per farlo ricomparire,
  rimettilo a `true`.
- **Vedere le prenotazioni**: Table Editor → `bookings` (i servizi di ognuna in
  `booking_services`).
- **Bloccare ferie o un impegno**: dall'SQL Editor, scrivendo l'ora italiana in
  chiaro (il Table Editor mostra gli orari in UTC, un'ora indietro d'inverno e due
  d'estate, ed è facile sbagliare):
  ```sql
  insert into public.blocked_periods (starts_at, ends_at, reason)
  values ('2026-11-04 08:00 Europe/Rome', '2026-11-04 20:00 Europe/Rome', 'ferie');
  ```
  Per più giorni di fila basta mettere il primo giorno alle 8:00 e l'ultimo alle
  20:00. Per togliere un blocco: Table Editor → `blocked_periods` → cancella la riga.
- **Vedere i clienti registrati**: Table Editor → `customers`; le email sono in
  Authentication → Users.
- **Creare un cliente di prova senza email**: Authentication → Users → Add user →
  Create new user, con "Auto Confirm User" acceso. Poi, nell'SQL Editor:
  ```sql
  insert into public.customers (id, first_name, last_name, phone, privacy_accepted_at)
  select id, 'Prova', 'Due', '3330000000', now() from auth.users
  where email = 'email-del-cliente-di-prova@esempio.it';
  ```
- **Aggiungere un servizio**: Table Editor → `services` → Insert row. Servono
  `id` (nuovo, in minuscolo con i trattini), `category_id`, `name`, `price`,
  `duration_minutes`, `position`.

## File SQL nel repository

- `supabase/migrations/` – le modifiche alla struttura del database, una per file,
  in ordine di data. Ogni file si lancia **una volta sola** nell'SQL Editor.
  - `20261103120000_listino.sql` – tabelle del listino e regole RLS.
  - `20261103130000_listino_solo_lettura.sql` – toglie ai ruoli `anon` e
    `authenticated` i permessi di modifica che Supabase può dare in automatico.
  - `20261103140000_prenotazioni.sql` – prenotazioni, blocchi e le due funzioni.
  - `20261107120000_clienti.sql` – profili dei clienti e trigger di registrazione.
  - `20261107130000_listino_per_clienti.sql` – le regole del listino valgono anche
    per chi ha fatto l'accesso (prima vedeva un listino vuoto).
  - `20261108120000_prenotazioni_clienti.sql` – si prenota solo con l'account:
    `customer_id` e nuova `create_booking`.
  - `20261108130000_miei_appuntamenti.sql` – regole sugli orari in comune,
    `get_my_bookings`, `cancel_booking`, `reschedule_booking`, `cancelled_at`.
  - `20261108140000_nomi_maiuscola.sql` – iniziale maiuscola automatica per nome
    e cognome dei clienti, anche quelli già salvati.
- `supabase/seed.sql` – i dati iniziali del listino (2026-11-03). Serve solo per
  un database nuovo: i prezzi aggiornati stanno nel database, non qui.

Quando cambiamo la struttura (per esempio le prenotazioni al passo 4) aggiungiamo
un nuovo file in `supabase/migrations/`, non modifichiamo quelli già lanciati.

## Impostazioni del login (pannello Supabase)

- Authentication → Sign In / Providers → **Email**: attivo, "Confirm email"
  acceso, lunghezza minima della password **8** (lo stesso numero sta in
  `src/lib/customer.js`).
- Authentication → URL Configuration: **Site URL** `http://localhost:5173` finché
  si prova in locale; in **Redirect URLs** va aggiunto ogni indirizzo dove gira il
  sito (in locale `http://localhost:5173`, per il link di prova
  `https://velez-legacy.pages.dev`). È
  dove i link delle email riportano il cliente.
- Le email di Supabase incluse nel piano Free partono solo verso gli indirizzi del
  team del progetto e poche all'ora: bastano per le prove. Per i clienti veri
  serve Resend (passo 6).

## Collegamento dal sito

- `src/lib/supabase.js` crea il client con `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_PUBLISHABLE_KEY`, presi da `.env.local` (vedi `.env.example`).
- `src/lib/priceList.js` legge il listino.
- `src/lib/auth.js` registrazione, accesso, uscita, password dimenticata e
  lettura del profilo; `src/lib/useAuth.js` dice alla pagina chi ha fatto il login.
- Online (Cloudflare Pages) le stesse due variabili andranno nelle impostazioni
  del progetto.

## Da tenere d'occhio

- **Pausa del piano Free**: dopo 7 giorni senza attività il progetto va in pausa e
  il listino smette di caricarsi finché non lo si riattiva dal pannello. Prima di
  andare online decidiamo se restare sul Free con un accorgimento o passare al Pro.
