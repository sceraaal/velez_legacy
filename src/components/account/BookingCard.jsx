import { useState } from 'react'
import { cancelBooking } from '../../lib/bookingApi.js'
import { formatDateTime, OPENING } from '../../lib/availability.js'
import { formatPrice } from '../../utils/format.js'
import RescheduleForm from './RescheduleForm.jsx'

// Un appuntamento nella lista "I miei appuntamenti".
// Per i prossimi: Disdici (con conferma) e Sposta, fino a 1 ora prima.
// La regola dell'ora la ricontrolla comunque il database.

// now = l'ora in cui la lista è stata caricata (vedi MyBookings)
function BookingCard({ booking, now, past = false, onChanged }) {
  // 'view' = solo i dati, 'cancel' = domanda "vuole davvero disdire?",
  // 'reschedule' = calendario per il nuovo orario
  const [mode, setMode] = useState('view')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  const limit = booking.startsAt.getTime() - OPENING.minNoticeMinutes * 60_000
  const canChange = !past && now.getTime() < limit

  async function confirmCancel() {
    setSending(true)
    setError(null)
    try {
      await cancelBooking(booking.id)
      onChanged("L'appuntamento è stato disdetto.")
    } catch (failure) {
      setError(failure.message)
      setSending(false)
    }
  }

  return (
    <article className={`booking-card${past ? ' booking-card--past' : ''}`}>
      <p className="booking-card__when">{formatDateTime(booking.startsAt)}</p>
      <p className="booking-card__services">{booking.serviceNames.join(' · ')}</p>
      <p className="booking-card__price">{formatPrice(booking.totalPrice, booking.fromPrice)}</p>

      {error && (
        <p className="customer-form__error" role="alert">
          {error}
        </p>
      )}

      {!past && !canChange && (
        <p className="account__hint">Manca meno di un'ora: per modifiche contatti il salone.</p>
      )}

      {canChange && mode === 'view' && (
        <div className="booking-card__actions">
          <button type="button" className="account__secondary" onClick={() => setMode('reschedule')}>
            Sposta
          </button>
          <button type="button" className="account__secondary" onClick={() => setMode('cancel')}>
            Disdici
          </button>
        </div>
      )}

      {canChange && mode === 'cancel' && (
        <div className="booking-card__confirm" role="group" aria-label="Conferma la disdetta">
          <p className="booking-card__question">Vuole davvero disdire questo appuntamento?</p>
          <div className="booking-card__actions">
            <button type="button" className="account__secondary" onClick={() => setMode('view')} disabled={sending}>
              No
            </button>
            <button type="button" className="booking-card__danger" onClick={confirmCancel} disabled={sending}>
              {sending ? 'Disdetta…' : 'Sì, disdici'}
            </button>
          </div>
        </div>
      )}

      {canChange && mode === 'reschedule' && (
        <RescheduleForm
          booking={booking}
          onCancel={() => setMode('view')}
          onDone={() => onChanged("L'appuntamento è stato spostato.")}
        />
      )}
    </article>
  )
}

export default BookingCard
