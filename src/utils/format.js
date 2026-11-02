// Piccole funzioni per scrivere prezzi e durate sempre nello stesso modo.
// Stanno qui, e non dentro i componenti, così si possono riusare (per esempio
// nella pagina di prenotazione del passo 4).

// 25 → "€25"; con fromPrice (servizi tecnici) → "da €25"
export function formatPrice(price, fromPrice = false) {
  return fromPrice ? `da €${price}` : `€${price}`
}

// 50 → "50 minuti"
export function formatDuration(minutes) {
  return `${minutes} minuti`
}
