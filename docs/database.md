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

### `bookings` – le prenotazioni (passo 4)

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id` | codice unico (uuid) | generato dal database |
| `starts_at` / `ends_at` | data e ora | fine arrotondata alla mezz'ora successiva |
| `first_name`, `last_name` | testo | |
| `phone`, `email` | testo | controllati da `create_booking` |
| `privacy_accepted_at` | data e ora | prova del consenso all'informativa |
| `status` | `confirmed` o `cancelled` | una disdetta libera l'orario |
| `created_at` | data e ora | |

Vincolo `bookings_no_overlap`: due prenotazioni confermate non possono
sovrapporsi nel tempo, nemmeno se arrivano nello stesso istante.

### `booking_services` – i servizi di ogni prenotazione

`booking_id`, `service_id`, e `price` / `duration_minutes` **copiati al momento
della prenotazione** (se un prezzo cambia, le prenotazioni vecchie restano giuste).

### `blocked_periods` – ferie e impegni di Nicolas

`starts_at`, `ends_at`, `reason` (nota interna). In quei periodi non si prenota.

## Funzioni

- `get_busy_periods(da, a)` – restituisce solo inizio e fine dei periodi occupati
  (prenotazioni confermate e blocchi), massimo 40 giorni per richiesta. Nessun dato
  personale.
- `create_booking(servizi, inizio, nome, cognome, telefono, email, privacy)` –
  controlla le regole di `docs/regole-progetto.md` (martedì–sabato, inizio ogni 30
  minuti, 8:00–20:00 servizio compreso, almeno 1 ora e al massimo 30 giorni prima,
  niente sovrapposizioni o blocchi, dati validi, informativa accettata), calcola
  durata e prezzo dal database e salva. Gli errori sono messaggi in italiano con il
  Lei, pronti da mostrare.

Entrambe sono `security definer`: lavorano con i permessi di chi le ha create,
così il visitatore può prenotare senza poter leggere la tabella `bookings`.

## Sicurezza (RLS)

RLS è attiva su entrambe le tabelle. Il sito usa la chiave **pubblica**
(`sb_publishable_...`), cioè il ruolo `anon`, che può solo:

- leggere tutte le categorie;
- leggere i servizi con `is_active = true`.

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
- **Bloccare ferie o un impegno**: Table Editor → `blocked_periods` → Insert row,
  con inizio e fine (attenzione al fuso orario: il pannello mostra gli orari in
  UTC, cioè un'ora indietro rispetto all'Italia d'inverno e due d'estate).
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
- `supabase/seed.sql` – i dati iniziali del listino (2026-11-03). Serve solo per
  un database nuovo: i prezzi aggiornati stanno nel database, non qui.

Quando cambiamo la struttura (per esempio le prenotazioni al passo 4) aggiungiamo
un nuovo file in `supabase/migrations/`, non modifichiamo quelli già lanciati.

## Collegamento dal sito

- `src/lib/supabase.js` crea il client con `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_PUBLISHABLE_KEY`, presi da `.env.local` (vedi `.env.example`).
- `src/lib/priceList.js` legge il listino.
- Online (Cloudflare Pages) le stesse due variabili andranno nelle impostazioni
  del progetto.

## Da tenere d'occhio

- **Pausa del piano Free**: dopo 7 giorni senza attività il progetto va in pausa e
  il listino smette di caricarsi finché non lo si riattiva dal pannello. Prima di
  andare online decidiamo se restare sul Free con un accorgimento o passare al Pro.
