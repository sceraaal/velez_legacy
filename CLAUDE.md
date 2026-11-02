# CLAUDE.md – Velez Legacy Barber

Istruzioni per Claude (e per chiunque lavori al progetto con un assistente AI).
Le regole di dettaglio stanno nella cartella `docs/`: questo file rimanda a quei
documenti invece di ripeterli, così ogni regola è scritta in un posto solo.

## Il progetto

Web app di prenotazione per Nicolas, barbiere (un solo barbiere). Fa anche da
vetrina: deve trasmettere un servizio curato e di livello superiore.

- Regole dell'app (orari, servizi, prenotazioni, fasi): [docs/regole-progetto.md](docs/regole-progetto.md)
- Guida di stile (colori, caratteri, componenti): [docs/design.md](docs/design.md)
- Decisioni prese e motivi: [docs/decisioni.md](docs/decisioni.md)

Se una richiesta contraddice uno di questi documenti, segnalalo prima di procedere.

## Con chi lavori

Simona sviluppa e manterrà l'app da sola. Il suo obiettivo è **capire** il codice,
non solo copiarlo.

- Scrivi in **italiano**, passo per passo, senza dare per scontati termini tecnici:
  la prima volta che usi un termine, spiegalo in una frase.
- **Prima** di scrivere codice, spiega cosa stai per fare e perché.
- **Dopo** ogni parte, spiega cosa fa e dove mettere le mani se qualcosa si rompe.
- Un pezzo alla volta: una funzionalità finita e provata prima della successiva.
- Le scelte tecniche importanti si decidono insieme: proponi opzioni, non decidere da solo.
- Se una richiesta complica troppo il progetto o aumenta i costi per Nicolas, dillo.
- Priorità: semplicità, costi bassi (piani gratuiti dove possibile), sicurezza dei
  dati dei clienti, facilità di manutenzione.
- Sii breve sulle cose meccaniche (comandi già noti, conferme), completo quando c'è
  da imparare qualcosa di nuovo.

## Metodo di lavoro

Per ogni funzionalità:

1. **Piano**: cosa facciamo, quali file tocchiamo, come lo proviamo. Aspetta l'ok.
2. **Implementazione**: modifiche piccole, con commenti in italiano dove il perché
   non è ovvio.
3. **Revisione**: prova l'app (`npm run dev`), lancia `npm run lint`, rileggi il diff.
4. **Rifinitura**: sistema ciò che è emerso e aggiorna i documenti in `docs/` se una
   regola o una decisione è cambiata.

## Tecnologie

- **React 19 + Vite 8** (JavaScript, non TypeScript) – le pagine
- **Supabase** (regione Francoforte) – database PostgreSQL e login
- **Cloudflare Pages** – hosting
- **Resend** – email (dalla Fase 1)
- **ESLint** – controllo del codice

Per la documentazione aggiornata di queste librerie usa Context7 (configurato in
`.mcp.json`) invece di affidarti alla memoria: le versioni cambiano spesso.

## Comandi

```bash
npm install      # installa le librerie
npm run dev      # avvia l'app su http://localhost:5173
npm run lint     # controlla il codice con ESLint
npm run build    # crea la versione da mettere online (cartella dist)
```

## Struttura

- `src/` – il codice dell'app (componenti React e stili)
- `public/` – file statici (icone)
- `docs/` – documentazione del progetto

## Regole sul codice

- Nomi di variabili, funzioni e componenti in inglese; commenti e testi visibili
  all'utente in italiano.
- Colori, caratteri e spaziature solo tramite le variabili CSS definite in
  `docs/design.md`, mai valori scritti a mano nei componenti.
- Pensato prima per il telefono, poi per lo schermo grande.

## Sicurezza e dati dei clienti

- Mai chiavi segrete nel repository. Le chiavi vanno in `.env.local` (escluso da Git
  grazie alla riga `*.local` di `.gitignore`).
- Nel frontend si usa solo la chiave **pubblica** (anon) di Supabase; la protezione
  dei dati passa dalle regole Row Level Security nel database.
- Raccogli solo i dati dei clienti che servono (nome, cognome, telefono, email).
