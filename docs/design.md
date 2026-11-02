# Guida di stile – Velez Legacy Barber

> **Bozza da confermare con Nicolas.** Colori e caratteri sono una prima proposta
> basata su "barocco, oro e nero, elegante e lussuoso". Se Nicolas ha un logo o un
> listino stampato, i colori vanno presi da lì e aggiornati qui.

Ogni pagina dell'app usa **solo** i valori di questo documento, tramite le variabili
CSS elencate sotto. Così, se un colore cambia, si modifica in un punto solo e
cambia in tutta l'app.

## Personalità

- **Lusso sobrio**: nero profondo, oro usato con misura, molto spazio vuoto.
  L'eleganza viene dalla calma, non dagli effetti.
- **Barocco nei dettagli**: cornici sottili, ornamenti e caratteri classici solo su
  titoli e separatori. Il resto resta pulito e facile da usare.
- **Prima il telefono**: quasi tutti i clienti prenoteranno dal cellulare.

## Colori

| Nome | Variabile CSS | Valore | Uso |
| --- | --- | --- | --- |
| Nero | `--color-black` | `#0B0B0B` | Sfondo principale |
| Carbone | `--color-charcoal` | `#17140F` | Sfondo di schede e riquadri |
| Oro | `--color-gold` | `#C9A54C` | Titoli, prezzi, bottoni principali |
| Oro chiaro | `--color-gold-light` | `#E3C878` | Bottone al passaggio del dito/mouse, evidenze |
| Oro scuro | `--color-gold-dark` | `#8C6D2C` | Solo bordi e linee decorative, **mai testo** |
| Avorio | `--color-ivory` | `#F3EAD8` | Testo normale |
| Grigio caldo | `--color-muted` | `#A89F8E` | Testo secondario (durate, note) |

**Leggibilità (contrasto):** il minimo consigliato per il testo è 4,5:1.
Su sfondo nero: avorio 16,5:1, oro 8,4:1, grigio caldo 7,5:1, tutti ampiamente
sopra. L'oro scuro arriva a 4,1:1, per questo si usa solo per elementi decorativi.

## Caratteri

Tutti gratuiti. Sono **salvati dentro il progetto** con i pacchetti `@fontsource/cinzel`
e `@fontsource/lato` (importati in `src/main.jsx`), non caricati dai server di
Google: così il telefono del cliente non invia il suo indirizzo IP a Google.

| Uso | Carattere | Variabile CSS | Note |
| --- | --- | --- | --- |
| Logo e titoli | [Cinzel](https://fonts.google.com/specimen/Cinzel) | `--font-display` | Maiuscole classiche in stile romano, solo per testi brevi |
| Testo, bottoni, prezzi | [Lato](https://fonts.google.com/specimen/Lato) | `--font-body` | Molto leggibile anche piccolo sul telefono |

| Livello | Dimensione | Carattere |
| --- | --- | --- |
| Titolo pagina | 2rem (32 px) | Cinzel |
| Titolo sezione | 1.5rem (24 px) | Cinzel |
| Testo | 1rem (16 px) | Lato |
| Testo piccolo | 0.875rem (14 px) | Lato |

Il testo normale non scende mai sotto 16 px: sotto quella misura i telefoni
ingrandiscono la pagina quando si tocca un campo.

## Spaziature e forme

- **Spaziature** (`--space-1` … `--space-6`): 4, 8, 16, 24, 32, 48 px. Usa sempre
  uno di questi valori, così gli spazi restano regolari in tutta l'app.
- **Angoli**: 2 px (`--radius`). Angoli quasi vivi danno un'aria più sartoriale
  rispetto agli angoli molto arrotondati.
- **Bordi**: 1 px oro scuro per schede e separatori.
- **Zone da toccare**: bottoni e link alti almeno 44 px, per il dito.

## Componenti

- **Bottone principale** (es. "Prenota"): sfondo oro, testo nero, maiuscolo con un
  po' di spazio tra le lettere. Al tocco diventa oro chiaro.
- **Bottone secondario** (es. "Annulla"): sfondo trasparente, bordo e testo oro.
- **Riga del listino**: impaginata come la carta di un ristorante. Nome in avorio a
  sinistra, una fila di puntini oro scuro, prezzo in oro (grassetto) a destra;
  durata in grigio caldo sotto il nome. Niente schede: le sezioni sono separate
  da un titolo in Cinzel con un filetto oro scuro sotto.
- **Cornice del titolo**: il nome dentro due filetti (oro all'interno, oro scuro
  all'esterno) con un fregio barocco sopra e sotto. È l'unico elemento vistoso.
- **Servizio tecnico**: prezzo scritto come "da €20", con una nota in corsivo grigio
  caldo sotto la sezione: "Il prezzo finale si decide in salone, dopo una breve
  consulenza".
- **Separatore**: una linea sottile oro scuro, con un piccolo ornamento al centro.

## Variabili CSS

Sono definite in `src/index.css`:

```css
:root {
  --color-black: #0B0B0B;
  --color-charcoal: #17140F;
  --color-gold: #C9A54C;
  --color-gold-light: #E3C878;
  --color-gold-dark: #8C6D2C;
  --color-ivory: #F3EAD8;
  --color-muted: #A89F8E;

  --font-display: 'Cinzel', serif;
  --font-body: 'Lato', sans-serif;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;
  --space-6: 48px;

  --radius: 2px;
}
```

## Da decidere con Nicolas

- Ha già un logo? In che formato?
- I colori del listino stampato o dell'insegna, da confrontare con questa palette.
- Tono dei testi: "tu" o "Lei" con i clienti?
- Le sezioni del listino (Esperienze Luxury, Taglio, Taglio e barba, Barba e
  rasatura, Colore, Extra) e il loro ordine.
