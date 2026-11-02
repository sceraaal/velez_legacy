# Registro delle decisioni – Velez Legacy Barber

Una voce per ogni scelta importante: cosa abbiamo deciso e **perché**.
Serve a ricordarsi il motivo tra qualche mese, prima di cambiare idea.
Le voci più recenti stanno in alto.

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
