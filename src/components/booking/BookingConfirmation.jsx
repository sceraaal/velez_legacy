import { formatDateTime } from '../../lib/availability.js'
import { formatPrice } from '../../utils/format.js'

// La schermata finale: la prenotazione è salvata.
// Mostra solo quello che il database ha restituito più i nomi dei servizi
// scelti: nessun dato di altri clienti.

function BookingConfirmation({ booking, services, firstName, onNewBooking }) {
  return (
    <div className="booking-confirmation" role="status">
      <h3 className="booking-confirmation__title">Appuntamento confermato</h3>
      <p className="booking-confirmation__greeting">Grazie, {firstName}. La aspettiamo.</p>

      <p className="booking-confirmation__when">{formatDateTime(booking.startsAt)}</p>

      <ul className="booking-confirmation__services">
        {services.map((service) => (
          <li key={service.id}>{service.name}</li>
        ))}
      </ul>

      <p className="booking-confirmation__price">{formatPrice(booking.totalPrice, booking.fromPrice)}</p>
      {booking.fromPrice && (
        <p className="booking-confirmation__note">Prezzo finale dopo consulenza in salone.</p>
      )}
      <p className="booking-confirmation__note">
        Il pagamento si effettua in salone.
        <br />
        Via Mario Alfani 84, Pontecagnano Faiano (SA)
      </p>

      <button type="button" className="booking-confirmation__again" onClick={onNewBooking}>
        Nuova prenotazione
      </button>
    </div>
  )
}

export default BookingConfirmation
