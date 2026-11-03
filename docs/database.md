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

## Sicurezza (RLS)

RLS è attiva su entrambe le tabelle. Il sito usa la chiave **pubblica**
(`sb_publishable_...`), cioè il ruolo `anon`, che può solo:

- leggere tutte le categorie;
- leggere i servizi con `is_active = true`.

Non c'è nessuna regola per aggiungere, modificare o cancellare: dal sito non si può
cambiare nulla. La chiave **segreta** non si usa e non va mai nel codice.

## Come si fa a…

- **Cambiare un prezzo o un nome**: pannello Supabase → Table Editor → `services`
  → doppio clic sulla cella → modifica → invio. La pagina lo mostra al prossimo
  caricamento.
- **Nascondere un servizio**: metti `is_active` a `false`. Per farlo ricomparire,
  rimettilo a `true`.
- **Aggiungere un servizio**: Table Editor → `services` → Insert row. Servono
  `id` (nuovo, in minuscolo con i trattini), `category_id`, `name`, `price`,
  `duration_minutes`, `position`.

## File SQL nel repository

- `supabase/migrations/` – le modifiche alla struttura del database, una per file,
  in ordine di data. Ogni file si lancia **una volta sola** nell'SQL Editor.
  - `20261103120000_listino.sql` – tabelle del listino e regole RLS.
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
