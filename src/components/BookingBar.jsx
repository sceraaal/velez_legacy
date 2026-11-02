import { formatDuration, formatPrice } from '../utils/format.js'
import './BookingBar.css'

// La barra dorata in basso: riassume i servizi scelti (quanti, durata, totale).
// Appare solo quando almeno un servizio è scelto.

function BookingBar({ selectedServices }) {
  if (selectedServices.length === 0) return null

  // reduce somma i valori di tutti i servizi scelti
  const totalMinutes = selectedServices.reduce((sum, service) => sum + service.duration, 0)
  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0)
  // Se c'è almeno un servizio tecnico, anche il totale è "a partire da"
  const hasFromPrice = selectedServices.some((service) => service.fromPrice)

  const count = selectedServices.length
  const countLabel = count === 1 ? '1 servizio' : `${count} servizi`

  return (
    <div className="booking-bar" role="status">
      <div className="booking-bar__summary">
        <span className="booking-bar__count">
          {countLabel} · {formatDuration(totalMinutes)}
        </span>
        <span className="booking-bar__total">{formatPrice(totalPrice, hasFromPrice)}</span>
      </div>
      {/* Il calendario arriva al passo 4: fino ad allora il bottone è disattivato */}
      <button type="button" className="booking-bar__cta" disabled>
        SCEGLI L'ORARIO
      </button>
    </div>
  )
}

export default BookingBar
