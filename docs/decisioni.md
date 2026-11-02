# Registro delle decisioni – Velez Legacy Barber

Una voce per ogni scelta importante: cosa abbiamo deciso e **perché**.
Serve a ricordarsi il motivo tra qualche mese, prima di cambiare idea.
Le voci più recenti stanno in alto.

---

## 2026-11-02 – Listino: stile "Dark luxury"

**Decisione**
- Tra i tre mockup, Simona ha scelto per ora la proposta C, "Dark luxury": nero
  profondo, oro champagne, Cormorant Garamond + Manrope, servizi come schede con
  il bottone "+" e una barra in basso con durata e prezzo totali.
- Caratteri salvati nel progetto con `@fontsource` invece di Google Fonts.
- I dati dei servizi stanno in `src/data/services.js`, separati dalla grafica.
- I servizi scelti sono tenuti in `App.jsx`, perché servono sia al listino sia
  alla barra in basso.

**Perché:** lo stile C è il più vicino al "lusso" richiesto; i caratteri locali
evitano di inviare a Google l'indirizzo IP dei clienti (in Germania un sito è stato
sanzionato per questo); i dati separati si potranno spostare nel database al passo 3
senza toccare la pagina. Scegliere i servizi dal listino prepara già la
prenotazione del passo 4.

**Prima proposta scartata:** listino impaginato come la carta di un ristorante con
Cinzel e Lato. Lo stile va ancora confermato con Nicolas.

---

## 2026-11-02 – Strumenti per lavorare con l'AI

**Decisione**
- `CLAUDE.md` con le regole per Claude, che rimanda ai documenti in `docs/`.
- `docs/design.md` come guida di stile unica.
- Plugin **frontend-design** (ufficiale Anthropic) attivato per il progetto in
  `.claude/settings.json`.
- **Context7** (documentazione aggiornata delle librerie) configurato in `.mcp.json`,
  senza chiave; una chiave gratuita alza i limiti di uso, se un giorno servisse.

**Perché:** un solo posto per ogni regola, e documentazione sempre aggiornata per
React, Vite e Supabase, che cambiano spesso.

**Non adottati:** `AGENTS.md` (duplicherebbe `CLAUDE.md`; da aggiungere solo se si
usano altri assistenti AI), Figma MCP (non disegniamo in Figma), Superpowers (il
metodo piano/implementazione/revisione/rifinitura è già scritto in `CLAUDE.md`).
Caveman non è nel repository: si installa per utente, non per progetto.

---

## 2026-11-02 – Tecnologie: React + Supabase + Cloudflare Pages

**Decisione**
- **Frontend:** React, creato con Vite.
- **Database e login:** Supabase, con i dati nella regione europea (Francoforte).
- **Hosting:** Cloudflare Pages.
- **Email (dalla Fase 1):** Resend.

**Perché**
- Costo 0 € al mese con i piani gratuiti; Cloudflare Pages permette l'uso
  commerciale (il piano gratuito di Vercel no).
- Supabase usa un database relazionale (PostgreSQL): possiamo far impedire al
  database stesso due prenotazioni sovrapposte.
- Con la Row Level Security di Supabase ogni cliente vede solo i propri dati.
- React è il framework più diffuso: tanta documentazione per la manutenzione.

**Alternative scartate**
- Firebase: le email automatiche richiedono il piano a consumo, e la logica anti
  doppia prenotazione va scritta a mano.
- Next.js + Vercel: circa 20 $ al mese per l'uso commerciale, più difficile da
  imparare.

**Limiti da ricordare**
- Il piano gratuito di Supabase mette in pausa il database dopo 7 giorni senza
  attività (es. ferie). Si riattiva dal pannello; il piano Pro costa 25 $/mese.
- Il servizio email integrato di Supabase va bene solo per le prove: per i clienti
  serve un servizio esterno (Resend, gratuito fino a 100 email al giorno).

---

## 2026-11-02 – Linter: ESLint

**Decisione:** ESLint (proposto da Vite insieme a Oxlint).

**Perché:** è il più diffuso, ha più documentazione e funziona con l'estensione
ESLint già installata in VS Code.

---

## 2026-11-01 – Editor: Visual Studio Code

**Decisione:** VS Code, con Git, Node.js (versione LTS) e le estensioni Prettier ed
ESLint.

**Perché:** gratuito, già conosciuto, è lo standard per le web app.
