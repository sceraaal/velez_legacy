import { useState } from 'react'
import { formatClock } from '../../lib/availability.js'
import { staffCancelBooking } from '../../lib/staffApi.js'
import { formatDuration, formatPrice } from '../../utils/format.js'

// Un appuntamento nell'agenda. Si vede l'essenziale (ora, cliente, servizi,
// prezzo); toccandolo si apre il dettaglio con telefono ed email e, per gli
// appuntamenti non ancora finiti, il tasto Disdici (passo 5a).
// now = l'ora in cui l'agenda è stata caricata (vedi AgendaDay).

function AppointmentCard({ appointment, now, onCancelled }) {
  const [open, setOpen] = useState(false)
  // 'view' oppure 'cancel' (domanda "vuoi davvero disdire?")
  const [mode, setMode] = useState('view')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const canCancel = appointment.endsAt > now

  async function confirmCancel() {
    setSending(true)
    setError(null)
    try {
      await staffCancelBooking(appointment.id)
      onCancelled()
    } catch (failure) {
      setError(failure.message)
      setSending(false)
    }
  }
  const { startsAt, endsAt, firstName, lastName, phone, email } = appointment
  const detailsId = `appuntamento-${appointment.id}`

  return (
    <article className="appointment">
      <button
        type="button"
        className="appointment__summary"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen(!open)}
      >
        <span className="appointment__time">
          {formatClock(startsAt)}–{formatClock(endsAt)}
        </span>
        <span className="appointment__name">
          {firstName} {lastName}
        </span>
        <span className="appointment__services">{appointment.serviceNames.join(' · ')}</span>
        <span className="appointment__price">{formatPrice(appointment.totalPrice, appointment.fromPrice)}</span>
      </button>

      {open && (
        <dl className="appointment__details" id={detailsId}>
          {phone && (
            <>
              <dt>Telefono</dt>
              {/* tel: apre la chiamata sul telefono; gli spazi li togliamo */}
              <dd>
                <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
              </dd>
            </>
          )}
          {email && (
            <>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${email}`}>{email}</a>
              </dd>
            </>
          )}
          <dt>Durata dei servizi</dt>
          <dd>{formatDuration(appointment.totalMinutes)}</dd>
        </dl>
      )}

      {open && canCancel && (
        <div className="appointment__actions">
          {error && (
            <p className="customer-form__error" role="alert">
              {error}
            </p>
          )}
          {mode === 'view' ? (
            <button type="button" className="account__secondary" onClick={() => setMode('cancel')}>
              Disdici
            </button>
          ) : (
            <div className="booking-card__confirm" role="group" aria-label="Conferma la disdetta">
              <p className="booking-card__question">
                Disdire l'appuntamento di {firstName} {lastName}? Ricordati di avvisare il cliente.
              </p>
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
        </div>
      )}
    </article>
  )
}

export default AppointmentCard
