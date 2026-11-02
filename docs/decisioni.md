# Registro delle decisioni – Velez Legacy Barber

Una voce per ogni scelta importante: cosa abbiamo deciso e **perché**.
Serve a ricordarsi il motivo tra qualche mese, prima di cambiare idea.
Le voci più recenti stanno in alto.

---

## 2026-11-02 – Stile: "Barocco classico" con il logo di Nicolas

**Decisione**
- Nicolas ha scelto la proposta A, "Barocco classico", della tavola dei mockup:
  nero e oro, Cinzel Decorative, Cinzel ed EB Garamond, listino come una carta
  con nome, puntini e prezzo.
- Al posto della scritta del nome c'è il suo logo. Le cornici barocche (con le
  volute negli angoli) sono anche attorno al listino, come ha chiesto.
- Il logo è anche l'icona del sito e della schermata home del telefono.
- Caratteri salvati nel progetto con `@fontsource`, non caricati da Google.
- I dati dei servizi stanno in `src/data/services.js`, separati dalla grafica.

**Perché:** è la proposta che Nicolas ha approvato. I caratteri locali evitano di
inviare a Google l'indirizzo IP dei clienti (in Germania un sito è stato sanzionato
per questo). I dati separati si potranno spostare nel database al passo 3 senza
toccare la pagina.

**Scartate:** la proposta C "Dark luxury" (scelta provvisoria di Simona prima della
risposta di Nicolas) e la prima versione a "carta di ristorante" con Cinzel e Lato.
La scelta dei servizi con il bottone "+" della proposta C potrà tornare, in stile
barocco, con la prenotazione del passo 4, se serve.

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
