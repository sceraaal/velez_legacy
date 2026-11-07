# Registro delle decisioni – Velez Legacy Barber

Una voce per ogni scelta importante: cosa abbiamo deciso e **perché**.
Serve a ricordarsi il motivo tra qualche mese, prima di cambiare idea.
Le voci più recenti stanno in alto.

---

## 2026-11-07 – Login dei clienti con email e password (Fase 1, passo 1)

**Decisione**
- Il cliente entra con email e password (scelta di Simona il 2026-11-05), con
  conferma dell'email obbligatoria e recupero della password via email.
- I dati del cliente stanno in `customers`, creati da un trigger alla
  registrazione; l'email resta solo nell'account di Supabase Auth.
- Per ora il cliente non può modificare i suoi dati dal sito: si aggiungerà con
  una migrazione nuova e gli stessi controlli della registrazione.
- L'area clienti è una **pagina a sé** (`/area-clienti`), scelta da Simona dopo
  aver provato la prima versione in fondo alla pagina principale (scomoda da
  raggiungere). Il passaggio tra le pagine lo fa un piccolo router scritto da noi
  (`src/lib/router.js` e `src/components/Link.jsx`), senza librerie; se le pagine
  diventano tante si valuta React Router.

**Perché:** email e password è il metodo che i clienti conoscono già. La
conferma dell'email impedisce di registrarsi con l'indirizzo di un altro. Il
trigger fa sì che non possa esistere un cliente senza i suoi dati.

**Scartate:** per l'area clienti, un pannello che si apre sopra la pagina
(stretto per gli appuntamenti) e la sezione spostata sotto il logo (pagina
lunga). Per il login, codice di 6 cifre via email (consigliato da Claude perché senza
password) e link via email (su iPhone si apre fuori dall'icona salvata); login
con Google o Apple (più configurazione; Apple richiede un account a pagamento).

**Da sapere:** i link delle email (conferma e nuova password) sul telefono si
aprono nel browser, non nell'icona salvata sulla schermata home.

---

## 2026-11-03 – Le prenotazioni della prova (passo 4)

**Decisione**
- Calendario e orari fatti a mano, senza librerie esterne.
- Tutte le regole (giorni, orari, mezz'ore, preavviso di 1 ora, 30 giorni,
  sovrapposizioni, ferie) le controlla il **database**, nella funzione
  `create_booking`. Il sito ripete solo i controlli sui dati del cliente, per
  dare subito un messaggio chiaro.
- La durata si arrotonda alla mezz'ora successiva (50 minuti occupano 1 ora).
- Per la prova il cliente prenota **senza account**: lascia nome, cognome,
  telefono ed email a ogni prenotazione. Registrazione e login arrivano nella
  Fase 1.
- La pagina di prenotazione resta **solo in locale, con dati di prova**, finché non
  ci sono il testo dell'informativa privacy e il login. La casella "Ho letto e
  accetto l'informativa" oggi non porta a nessun testo.

**Perché:** un calendario fatto a mano pesa poco ed è facile da capire e
modificare. Le regole nel database non si possono aggirare dal sito, e due
clienti nello stesso istante non riescono a prendere lo stesso orario. Senza
informativa non si possono raccogliere dati veri di clienti (GDPR).

**Scartate:** librerie di calendario già pronte (pesanti e difficili da adattare
allo stile barocco); controlli solo nel sito (aggirabili).

---

## 2026-11-03 – Il listino nel database Supabase

**Decisione**
- Progetto Supabase nella regione Central EU (Frankfurt), piano Free, con
  l'account di Simona.
- Due tabelle, `service_categories` e `services`, con `id` testuali leggibili.
- Il sito legge con la chiave pubblica; le regole RLS permettono solo di leggere.
- Le tabelle si creano copiando i file di `supabase/migrations/` nell'SQL Editor
  del pannello (niente Supabase CLI per ora).
- `src/data/services.js` è stato tolto: i prezzi stanno solo nel database.

**Perché:** i prezzi si cambiano dal pannello senza toccare il codice, ed è la base
per le prenotazioni del passo 4. Francoforte è nell'UE (GDPR) e vicina all'Italia.
L'SQL Editor non richiede programmi in più. Un solo posto per i prezzi evita
listini diversi tra sito e database.

**Scartate:** la regione Stoccolma proposta di default (va bene per il GDPR, ma
più lontana); la Supabase CLI (strumento in più da imparare, si potrà adottare se
il database cresce); tenere `services.js` come riserva.

---

## 2026-11-02 – Immagine barocca come sfondo di tutta la pagina

**Decisione**
- La versione barocca ricca del logo (colonne, statue, angeli, drappi rossi,
  leone) fa da sfondo fisso a tutta la pagina, coperta da un velo nero.
- In testata resta il logo rotondo. Cornici e fondo pagina hanno un fondo nero
  semitrasparente, i titoli fuori dalle cornici un'ombra scura.

**Perché:** Nicolas ha visto due anteprime e ha scelto questa. Il velo, i fondi
delle cornici e le ombre servono a tenere leggibili prezzi e testi.

**Da sapere:** l'immagine pesa circa 150 KB sul telefono e 290 KB sul computer.
Sul telefono se ne vede la fascia centrale. Dietro al logo si intravede di nuovo
la scritta "VELEZ LEGACY": Nicolas l'ha vista nell'anteprima.

**Scartata:** l'immagine solo in testata al posto del logo rotondo.

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
- I dati dei servizi stanno separati dalla grafica (oggi nel database, vedi
  `docs/database.md`).
- Ai clienti si dà del **Lei**: è il tono che Nicolas vuole per il salone.

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
