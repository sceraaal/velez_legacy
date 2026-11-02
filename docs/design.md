# Guida di stile – Velez Legacy Barber

> **Stile scelto (per ora): proposta C, "Dark luxury"**, dalla tavola dei mockup.
> Da confermare con Nicolas. Se Nicolas ha un logo o colori della sua insegna,
> vanno confrontati con questa palette e aggiornati qui.

Ogni pagina dell'app usa **solo** i valori di questo documento, tramite le variabili
CSS elencate sotto. Così, se un colore cambia, si modifica in un punto solo
(`src/index.css`) e cambia in tutta l'app.

## Personalità

- **Lusso scuro e silenzioso**: nero profondo, oro champagne usato con misura,
  molto spazio vuoto. L'eleganza viene dalla calma, non dagli effetti.
- **Un carattere classico per i titoli** (corsivo per l'accento), uno moderno e
  pulito per tutto il resto.
- **Prima il telefono**: quasi tutti i clienti prenoteranno dal cellulare.

## Colori

| Nome | Variabile CSS | Valore | Uso |
| --- | --- | --- | --- |
| Nero | `--color-black` | `#050505` | Sfondo della pagina, testo sui bottoni dorati |
| Superficie | `--color-surface` | `#0F0E0C` | Sfondo delle schede dei servizi |
| Superficie alta | `--color-surface-raised` | `#141210` | Sfondo della parte alta (hero) |
| Linea | `--color-line` | `#221F1A` | Bordo delle schede e separatori |
| Linea forte | `--color-line-strong` | `#3A352D` | Bordo dei filtri |
| Linea bottone | `--color-line-button` | `#5A5244` | Bordo del bottone "+" (solo decorativo) |
| Oro champagne | `--color-gold` | `#D8C08A` | Accenti, prezzi, bottoni principali |
| Oro chiaro | `--color-gold-light` | `#F0DFB4` | Passaggio del mouse, contorno di focus |
| Testo | `--color-text` | `#ECE8E1` | Testo principale |
| Testo secondario | `--color-text-secondary` | `#B3ADA3` | Paragrafi di presentazione, filtri |
| Testo tenue | `--color-text-muted` | `#8E887E` | Durate, note, suggerimenti |

**Leggibilità (contrasto):** il minimo consigliato per il testo è 4,5:1.
Sul nero: testo 16,7:1, oro 11,5:1, secondario 9,1:1, tenue 5,8:1; il nero sui
bottoni dorati 11,5:1. La "linea bottone" arriva a 2,6:1, per questo non si usa mai
per il testo: il bottone "+" si riconosce dall'icona dorata.

## Caratteri

Gratuiti e **salvati dentro il progetto** con i pacchetti `@fontsource` (importati in
`src/main.jsx`), non caricati dai server di Google: così il telefono del cliente non
invia il suo indirizzo IP a Google.

| Uso | Carattere | Variabile CSS | Pesi usati |
| --- | --- | --- | --- |
| Titoli e nomi dei servizi | [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) | `--font-display` | 300, 300 corsivo, 500 |
| Testo, bottoni, prezzi | [Manrope](https://fonts.google.com/specimen/Manrope) | `--font-body` | 400, 600 |

| Elemento | Dimensione | Carattere |
| --- | --- | --- |
| Titolo principale (hero) | da 3rem a 4rem, secondo lo schermo | Cormorant 300 |
| Titolo di sezione | 2.5rem (40 px) | Cormorant 300 |
| Nome del servizio | 1.375rem (22 px) | Cormorant 500 |
| Testo | 1rem (16 px) | Manrope 400 |
| Etichette, durate, note | 0.75–0.875rem (12–14 px) | Manrope |

Le etichette brevi (marchio, filtri, bottoni) sono in maiuscolo con le lettere
spaziate: è parte dello stile del mockup.

## Spaziature e forme

- **Spaziature** (`--space-1` … `--space-6`): 4, 8, 16, 24, 40, 64 px.
- **Angoli vivi** su schede, filtri e bottoni; l'unico elemento rotondo è il
  bottone "+".
- **Zone da toccare**: bottoni e filtri alti almeno 44 px, per il dito.

## Componenti

- **Hero** (`Hero.jsx`): marchio "VELEZ", frase d'apertura con la seconda riga in
  corsivo oro, breve presentazione e bottone "Prenota ora" con solo il bordo oro.
  Qui andrà la foto in bianco e nero di Nicolas al lavoro.
- **Filtri** (`ServiceMenu.jsx`): bottoni con bordo; quello attivo è pieno d'oro.
- **Scheda servizio** (`ServiceCard.jsx`): nome in Cormorant, durata e prezzo sotto
  (prezzo in oro), bottone rotondo "+" a destra. Scelta: bordo oro e bottone pieno
  d'oro con la spunta.
- **Servizio tecnico**: prezzo "da €20" e la nota "Prezzo finale dopo consulenza in
  salone".
- **Barra di prenotazione** (`BookingBar.jsx`): fissa in basso, dorata, compare
  quando si sceglie almeno un servizio. Mostra numero di servizi, durata totale e
  prezzo totale ("da" se c'è un servizio tecnico).

## Da decidere con Nicolas

- Conferma dello stile Dark luxury.
- Una foto in bianco e nero per la parte alta della pagina.
- Ha già un logo? In che formato?
- Tono dei testi: "tu" o "Lei" con i clienti? Va bene la frase "Il dettaglio fa
  la differenza."?
- Indirizzo del salone, da mostrare in fondo alla pagina.
- Le sezioni del listino (Luxury, Taglio, Taglio e barba, Barba, Colore, Extra).
