// Piccole funzioni per scrivere prezzi e durate sempre nello stesso modo.
// Stanno qui, e non dentro i componenti, perché le usano più componenti.

// 25 → "€25"; con fromPrice (servizi tecnici) → "da €25"
export function formatPrice(price, fromPrice = false) {
  return fromPrice ? `da €${price}` : `€${price}`
}

// 50 → "50 min"; 80 → "1 h 20 min"; 60 → "1 h"
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}
