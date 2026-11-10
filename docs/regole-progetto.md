# Regole del progetto – Velez Legacy Barber

Questo file raccoglie le regole che l'app deve rispettare. Se una regola cambia
(per esempio Nicolas cambia gli orari), aggiornala **prima** qui e poi nel codice,
così questo file resta la fonte di verità.

## Il cliente

Nicolas lavora in un salone non suo e serve solo i propri clienti. L'app è solo per
lui (un solo barbiere) e deve fare anche da vetrina: il servizio deve sembrare di
livello superiore e curato.

- **Nome:** Velez Legacy Barber
- **Stile:** barocco, oro e nero, elegante e lussuoso
- **Tipo:** web app usabile da telefono e salvabile come icona sulla schermata home
  (niente App Store / Play Store)

## Orari

- Da martedì a sabato, 8:00–20:00. Domenica e lunedì chiuso.
- Nessuna pausa pranzo fissa: non si blocca nulla in automatico.
- Gli appuntamenti iniziano ogni 30 minuti (8:00, 8:30, 9:00…).
- Un servizio occupa la sua durata; il prossimo appuntamento parte dalla mezz'ora
  successiva libera. Esempio: un servizio da 50 minuti alle 9:00 finisce alle 9:50,
  quindi il prossimo appuntamento può iniziare alle 10:00.
- Nicolas può bloccare giorni o fasce orarie (ferie, impegni) dall'agenda.

## Servizi

Listino aggiornato da Nicolas il 2026-11-09, in ordine di sezione. Quando la
durata indicata è un intervallo, si usa il valore più lungo.

| Sezione | Servizio | Prezzo | Durata | Note |
| --- | --- | --- | --- | --- |
| Esperienze Luxury | Presidential Luxury Experience | €55 | 80 min | sul listino "75-80 min"; con descrizione |
| Esperienze Luxury | Luxury Cut Experience | €25 | 50 min | |
| Esperienze Luxury | Luxury Total Experience | €40 | 80 min | |
| Esperienze Luxury | Luxury Beard Experience | €18 | 30 min | |
| Taglio | Taglio Barber | €18 | 30 min | |
| Taglio | Taglio Barber Under 14 | €15 | 30 min | |
| Taglio | Taglio + Ritual | €20 | 40 min | |
| Taglio | Taglio Barber + Barba | €23 | 45 min | |
| Taglio | Taglio Barber + Rituals + Barba | €25 | 45 min | |
| Barba e rasatura | Barba City Man | €10 | 15 min | |
| Barba e rasatura | Rasatura Uniformata | €15 | 30 min | |
| Barba e rasatura | Rasatura Tradizionale completa | €20 | 30 min | |
| Barba e rasatura | Rasatura Presidential | €30 | 45 min | con descrizione |
| Skincare & trattamenti viso | Deep Tech Facial | €25 | 30 min | con descrizione |
| Skincare & trattamenti viso | Royal Anti-Fatigue Treatment | €35 | 40 min | con descrizione |
| Servizi tecnici | Colorazione Uomo | da €20 | 30 min | servizio tecnico |
| Servizi tecnici | Tonalizzante | da €30 | 30 min | servizio tecnico |
| Servizi tecnici | Colpi di sole | da €40 | 90 min | servizio tecnico; Nicolas dice 60-90 min (2026-11-09) |
| Servizi tecnici | Decolorazione totale | da €60 | 150 min | servizio tecnico; Nicolas dice "più di 2 ore" (2026-11-09) |
| Extra | Patch Occhi | €3 | 10 min | |
| Extra | Maschera Viso Detox (Carbone/Argilla) | €10 | 10 min | |
| Extra | Trattamento Vapore & Panni Caldi Extra | €7 | 10 min | |

- I prezzi sono visibili nell'app.
- **Servizi tecnici** (colorazione, tonalizzante, colpi di sole, decolorazione): si prenotano normalmente; il prezzo
  è mostrato come "a partire da", con una nota che il prezzo finale si decide in
  salone dopo una consulenza.
- Il cliente può prenotare più servizi insieme: la durata totale è la somma.
- Gli **Extra** si possono prenotare anche da soli, come gli altri servizi
  (confermato da Nicolas il 2026-11-09).
- Le **descrizioni** (cosa comprende il trattamento) si vedono solo nel listino,
  non nella scelta dei servizi della prenotazione.

## Lato cliente

- Registrazione con nome, cognome, telefono, email, password e accettazione
  dell'informativa privacy. Si accede con **email e password** (almeno 8
  caratteri). Prima del primo accesso il cliente conferma l'email con il link
  ricevuto. Chi dimentica la password ne sceglie una nuova da un link via email.
- **Per prenotare serve l'account.** Il cliente sceglie servizi, giorno e orario
  anche senza accesso; al momento di confermare vede "Per prenotare acceda al Suo
  account o si registri". Le scelte restano salvate nel browser per un'ora: dopo
  l'accesso (o dopo aver confermato l'email) torna alla prenotazione e deve solo
  premere Conferma.
- Telefono: da 9 a 15 cifre, con un "+" facoltativo all'inizio e spazi ammessi.
  Email: deve avere la forma nome@dominio.it.
- Prenotazione al massimo 30 giorni prima e al minimo 1 ora prima, se ci sono slot
  liberi.
- Conferma automatica, senza approvazione di Nicolas. Dopo l'invio il cliente vede
  la schermata "Appuntamento confermato" con giorno, ora, servizi e prezzo.
- Se l'orario viene preso da un altro cliente prima della conferma (anche mentre
  sta facendo l'accesso), vede un messaggio o l'orario non risulta più scelto,
  gli orari si aggiornano e ne sceglie un altro.
- Disdetta o spostamento possibili fino a 1 ora prima dell'appuntamento, dalla
  pagina Area clienti ("I miei appuntamenti"). Lo spostamento tiene gli stessi
  servizi; il vecchio orario si libera solo se il nuovo è preso. Dopo il limite
  di un'ora il cliente legge "per modifiche contatti il salone".
- In "I miei appuntamenti" il cliente vede i prossimi appuntamenti e gli ultimi
  5 passati (quelli disdetti non compaiono).
- Promemoria SMS 1 giorno prima e 2 ore prima (Fase 2; solo promemoria, nessuna
  risposta richiesta).
- Pagamento solo in salone.

## Lato Nicolas (area riservata)

- Usabile da telefono e da computer.
- Agenda con gli appuntamenti (pagina `/agenda`): un giorno alla volta, si apre
  su oggi, con ora, cliente, servizi e prezzo; toccando un appuntamento si
  vedono telefono ed email. Nicolas entra dallo stesso "Accedi" dei clienti; il
  suo account è segnato come "staff" dal pannello Supabase.
- Ferie e impegni si bloccano dall'agenda (linguetta Blocchi): giorni interi
  (8:00–20:00) o una fascia oraria, con una nota facoltativa. Se nel periodo ci
  sono già appuntamenti il blocco non si salva: Nicolas vede chi è prenotato,
  lo avvisa e lo disdice prima.
- Nicolas può disdire qualsiasi appuntamento non ancora finito, senza il limite
  di un'ora. Il cliente per ora va avvisato a voce (email dal passo 6).
- Notifica quando un cliente prenota o disdice: push dalla web app + email di
  riserva (niente SMS a Nicolas, per contenere i costi).
- Inserimento a mano ("+ Nuovo appuntamento" nell'agenda): per un cliente
  dell'elenco o per uno nuovo senza account (nome, cognome, telefono
  facoltativo). Va bene sia dopo il servizio (storico) sia per chi prenota al
  telefono (occupa l'orario). Valgono giorni, mezz'ore e niente sovrapposizioni;
  non valgono il preavviso di un'ora, i 30 giorni e i blocchi.
- Lista clienti (linguetta Clienti) con ricerca e storico degli appuntamenti,
  per i clienti con e senza account.
- Può segnare un cliente come "non presentato". **Dal secondo appuntamento saltato il
  cliente viene bloccato** e non può più prenotare. Nicolas può sbloccarlo.

## Galleria lavori (Fase 2)

- Sezione pubblica con foto e video dei lavori, nello stesso stile dell'app.
- Video ospitati su Instagram/YouTube e mostrati nell'app, per contenere i costi.
- Chi carica i contenuti: da decidere.

## Fasi di lavoro

0. **Prova:** listino in pagina + calendario che mostra gli slot liberi e salva una
   prenotazione.
1. **Fase 1:** vetrina e listino, registrazione e login, prenotazioni,
   disdette/spostamenti, area riservata di Nicolas, notifiche email.
2. **Fase 2:** promemoria SMS, notifiche push, storico clienti con appuntamenti
   saltati, galleria foto/video.

## Fuori dalla prima versione

- Pagamenti online
- Più barbieri
- App sugli store

## Ancora da decidere

- Servizio per gli SMS e relativi costi
- Nome del dominio
- Testo dell'informativa privacy
- Chi carica i contenuti della galleria
