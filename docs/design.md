# Guida di stile – Velez Legacy Barber

> **Stile scelto da Nicolas: proposta A, "Barocco classico"**, dalla tavola dei
> mockup, con il suo logo al posto della scritta e cornici barocche anche attorno
> al listino.

Ogni pagina dell'app usa **solo** i valori di questo documento, tramite le variabili
CSS elencate sotto. Così, se un colore cambia, si modifica in un punto solo
(`src/index.css`) e cambia in tutta l'app.

## Personalità

- **Barocco elegante**: nero profondo, oro, cornici con volute negli angoli e
  fregi tra le sezioni. Le decorazioni stanno ai bordi: il contenuto resta pulito
  e facile da leggere.
- **Il logo è il protagonista** della parte alta della pagina.
- **Prima il telefono**: quasi tutti i clienti prenoteranno dal cellulare.

## Logo e icone

- Logo: `src/assets/logo-velez-legacy.webp` (640×640 px, ricavato dal file
  originale di Nicolas). È quadrato con lo sfondo di marmo: nella pagina viene
  ritagliato a cerchio.
- **Sfondo della pagina**: la versione barocca ricca del logo (colonne, statue,
  angeli, drappi rossi, leone), scelta da Nicolas il 2026-11-02. Sta ferma dietro
  a tutta la pagina, coperta da un velo nero (`--veil-light` → `--veil-dark`).
  Due misure in `src/assets/`: `sfondo-barocco-800.webp` (circa 150 KB) per i
  telefoni e `sfondo-barocco-1254.webp` (circa 290 KB) dai 768 px in su.
- **Regola di leggibilità**: il testo non sta mai direttamente sull'immagine.
  Cornici e fondo pagina hanno il fondo `--veil-panel`; i pochi titoli fuori
  dalle cornici (es. "Il Listino") hanno l'ombra `--shadow-text`.
- Icona del sito e icona per la schermata home del telefono:
  `public/favicon.png` (64 px) e `public/apple-touch-icon.png` (180 px), dal logo
  rotondo.
- Se Nicolas manda una versione nuova del logo, vanno rigenerati questi file.

## Colori

| Nome | Variabile CSS | Valore | Uso |
| --- | --- | --- | --- |
| Nero | `--color-black` | `#0B0B0B` | Sfondo della pagina, testo sui bottoni dorati |
| Carbone | `--color-surface` | `#17140F` | Sfondo di riquadri (es. riepilogo della prenotazione) |
| Linea | `--color-line` | `#3A2E14` | Filetti tenui, separatori tra le righe |
| Oro scuro | `--color-gold-dark` | `#8C6D2C` | Bordi delle cornici, filetti, puntini. **Mai testo** |
| Oro | `--color-gold` | `#C9A54C` | Titoli, prezzi, volute, bottone principale |
| Oro chiaro | `--color-gold-light` | `#E3C878` | Titoli delle sezioni, passaggio del mouse, focus |
| Avorio | `--color-ivory` | `#F3EAD8` | Testo principale |
| Grigio caldo | `--color-muted` | `#A89F8E` | Durate, note, orari |

**Leggibilità (contrasto):** il minimo consigliato per il testo è 4,5:1.
Sul nero: avorio 16,5:1, oro chiaro 12,0:1, oro 8,4:1, grigio caldo 7,5:1. L'oro
scuro arriva a 4,1:1, per questo si usa solo per elementi decorativi.

## Caratteri

Gratuiti e **salvati dentro il progetto** con i pacchetti `@fontsource` (importati in
`src/main.jsx`), non caricati dai server di Google: così il telefono del cliente non
invia il suo indirizzo IP a Google.

| Uso | Carattere | Variabile CSS |
| --- | --- | --- |
| Titoli grandi ("Il Listino") | [Cinzel Decorative](https://fonts.google.com/specimen/Cinzel+Decorative) | `--font-decorative` |
| Titoli delle sezioni, prezzi, bottoni | [Cinzel](https://fonts.google.com/specimen/Cinzel) | `--font-display` |
| Testo, nomi dei servizi | [EB Garamond](https://fonts.google.com/specimen/EB+Garamond) | `--font-body` |

Cinzel ha solo lettere maiuscole: per questo "da €20" appare come "DA €20".
Il testo normale è a 17 px: EB Garamond è un carattere piccolo e sotto quella misura
si legge male sul telefono.

## Spaziature e forme

- **Spaziature** (`--space-1` … `--space-6`): 4, 8, 16, 24, 32, 48 px.
- **Angoli**: 2 px (`--radius`), quasi vivi.
- **Zone da toccare**: bottoni e link alti almeno 44 px, per il dito.

## Componenti

- **Cornice barocca** (`BaroqueFrame.jsx`): doppio filetto (oro scuro dentro,
  linea tenue 5 px fuori) con una voluta dorata in ogni angolo. Si riusa per
  qualsiasi riquadro importante: oggi la parte alta e il listino.
- **Fregio** (`Ornament.jsx`): linea con due foglie e un rombo al centro, tra il logo
  e la frase e nel fondo pagina.
- **Parte alta** (`Hero.jsx`): logo, fregio, frase in
  corsivo, bottone "Prenota" pieno d'oro, orari.
- **Listino** (`PriceList.jsx`): titolo "Il Listino", poi per ogni sezione un titolo
  tra due filetti e le righe "nome ...... prezzo" con la durata sotto.
- **Prenotazione** (`src/components/booking/`): sezione "Prenota" con titolo e
  cornice come il listino. Ogni passo (I Suoi servizi, Il giorno, L'orario) ha
  il titolo tra due filetti. Servizi con casella oro (`accent-color`); calendario
  a 7 colonne, giorni senza orari liberi spenti; orari come bottoni con bordo oro
  scuro. Scelta attiva = fondo oro e testo nero. Riepilogo fisso in fondo allo
  schermo con fondo `--color-surface`: è un bottone, con sotto il totale la
  scritta oro del passo successivo ("Scelga il giorno ›", poi "Scelga l'orario ›",
  poi "Inserisca i Suoi dati ›"); toccandolo la pagina scorre fin lì.
- **Modulo dati cliente** (`CustomerForm.jsx`): passo "I Suoi dati". Etichette in
  Cinzel maiuscolo grigio caldo, caselle con fondo nero e bordo oro scuro, alte
  48 px, testo a 17 px (sotto i 16 px l'iPhone ingrandisce la pagina). Errori in
  corsivo oro chiaro sotto il campo. Bottone "Conferma la prenotazione" pieno
  d'oro, come il bottone "Prenota" in alto.
- **Conferma** (`BookingConfirmation.jsx`): titolo "Appuntamento confermato" in
  Cinzel Decorative, giorno e ora in oro chiaro, servizi, prezzo, nota sul
  pagamento in salone e bottone secondario (solo bordo) "Nuova prenotazione".
- **Area clienti** (`src/components/account/`): pagina a sé, `/area-clienti`, con
  in alto "← Torna al sito" e il logo piccolo (56 px, rotondo) che riporta al
  sito; sotto il titolo "Area clienti" e la stessa cornice della prenotazione. Linguette Accedi / Registrati (attiva = fondo
  oro, testo nero), stesse caselle ed errori del modulo dati cliente, link
  testuale in corsivo oro chiaro ("Ha dimenticato la password?"), messaggi di
  conferma su fondo `--color-surface` con filetto oro a sinistra, bottone "Esci"
  secondario (solo bordo). In alto a destra della pagina il link "Accedi" / "Il
  mio account" in Cinzel maiuscolo oro chiaro.
- **Servizio tecnico**: prezzo "da €20" e la nota in corsivo "Prezzo finale dopo
  consulenza in salone".

## Testi e dati del salone

- **Tono**: ai clienti si dà del **Lei** (deciso da Nicolas il 2026-11-02). Per
  esempio "Scelga il servizio", "La aspettiamo", "Il Suo appuntamento".
- **Indirizzo**: Via Mario Alfani 84, 84098 Pontecagnano Faiano (SA), mostrato in
  fondo alla pagina.

## Da decidere con Nicolas

- Se mettere un link alla mappa sotto l'indirizzo.
