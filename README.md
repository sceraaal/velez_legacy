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

## Documentazione

- [Regole del progetto](docs/regole-progetto.md): orari, servizi, regole di prenotazione
- [Guida di stile](docs/design.md): colori, caratteri e componenti
- [Registro delle decisioni](docs/decisioni.md): le scelte fatte e il perché
- [CLAUDE.md](CLAUDE.md): istruzioni per lavorare al progetto con Claude
