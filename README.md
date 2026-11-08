# Velez Legacy Barber

Web app di prenotazione per **Velez Legacy Barber**, il barbiere Nicolas.
I clienti vedono il listino, prenotano un appuntamento e possono disdirlo o
spostarlo; Nicolas gestisce la sua agenda da un'area riservata.

## Tecnologie

- [React](https://react.dev/) + [Vite](https://vite.dev/) per le pagine
- [Supabase](https://supabase.com/) per database e login
- [Cloudflare Pages](https://pages.cloudflare.com/) per mettere l'app online

## Come avviare l'app sul proprio computer

Serve [Node.js](https://nodejs.org/) (versione LTS).

La prima volta crea il file `.env.local` copiando `.env.example` e mettendoci
l'indirizzo e la chiave pubblica del progetto Supabase (pannello Supabase →
bottone Connect). Senza questo file il listino non si carica.

```bash
npm install     # scarica le librerie (solo la prima volta o dopo un aggiornamento)
npm run dev     # avvia l'app su http://localhost:5173
```

Per fermarla: `Ctrl+C` nel terminale.

## Comandi utili

| Comando | Cosa fa |
| --- | --- |
| `npm run dev` | Avvia l'app in modalità sviluppo; si aggiorna da sola quando salvi |
| `npm run build` | Prepara la versione finale da mettere online (cartella `dist`) |
| `npm run preview` | Mostra in locale la versione finale |
| `npm run lint` | Controlla il codice con ESLint |

## Link di prova online (Cloudflare Pages)

Il sito è collegato a Cloudflare Pages: ogni volta che si unisce una PR in `main`,
Cloudflare ricostruisce il sito e aggiorna il link `….pages.dev` da solo.

Impostazioni del progetto su Cloudflare:

- Comando di build: `npm run build` · cartella di uscita: `dist`
- Variabili: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (le stesse di
  `.env.local`, solo chiavi pubbliche) e `VITE_TEST_VERSION=true`, che mostra la
  fascia "Versione di prova".
- `public/_headers` chiede ai motori di ricerca di non mostrare il link
  `.pages.dev` nei risultati.

## Documentazione

- [Regole del progetto](docs/regole-progetto.md): orari, servizi, regole di prenotazione
- [Guida di stile](docs/design.md): colori, caratteri e componenti
- [Database](docs/database.md): tabelle, regole di sicurezza, come cambiare un prezzo
- [Registro delle decisioni](docs/decisioni.md): le scelte fatte e il perché
- [CLAUDE.md](CLAUDE.md): istruzioni per lavorare al progetto con Claude
