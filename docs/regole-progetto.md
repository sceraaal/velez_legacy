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
- Nicolas può bloccare a mano giorni o fasce orarie (ferie, impegni).

## Servizi

| Servizio | Prezzo | Durata | Note |
| --- | --- | --- | --- |
| Luxury Cut Experience | €25 | 50 min | |
| Luxury Total Experience | €40 | 80 min | |
| Colorazione Uomo | da €20 | 30 min | servizio tecnico |
| Tonalizzante | da €30 | 30 min | servizio tecnico |
| Taglio + Ritual | €20 | 40 min | |
| Taglio Barber | €18 | 30 min | |
| Taglio Barber Under 14 | €15 | 30 min | |
| Rasatura Uniformata | €15 | 30 min | |
| Rasatura Tradizionale completa | €20 | 30 min | |
| Taglio Barber + Barba | €23 | 45 min | |
| Taglio Barber + Rituals + Barba | €25 | 45 min | |
| Patch Occhi | €3 | 10 min | |
| Barba City Man | €10 | 15 min | |
| Luxury Beard Experience | €18 | 30 min | |

- I prezzi sono visibili nell'app.
- **Servizi tecnici** (colorazione, tonalizzante): si prenotano normalmente; il prezzo
  è mostrato come "a partire da", con una nota che il prezzo finale si decide in
  salone dopo una consulenza.
- Il cliente può prenotare più servizi insieme: la durata totale è la somma.

## Lato cliente

- Registrazione con nome, cognome, telefono, email e accettazione dell'informativa
  privacy.
- Prenotazione al massimo 30 giorni prima e al minimo 1 ora prima, se ci sono slot
  liberi.
- Conferma automatica, senza approvazione di Nicolas.
- Disdetta o spostamento possibili fino a 1 ora prima dell'appuntamento.
- Promemoria SMS 1 giorno prima e 2 ore prima (Fase 2; solo promemoria, nessuna
  risposta richiesta).
- Pagamento solo in salone.

## Lato Nicolas (area riservata)

- Usabile da telefono e da computer.
- Agenda con gli appuntamenti.
- Notifica quando un cliente prenota o disdice: push dalla web app + email di
  riserva (niente SMS a Nicolas, per contenere i costi).
- Inserimento manuale di clienti senza prenotazione, dopo il servizio (nome e
  servizio svolto).
- Lista clienti con storico degli appuntamenti.
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
