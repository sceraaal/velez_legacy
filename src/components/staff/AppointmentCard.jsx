import { useState } from 'react'
import { formatClock } from '../../lib/availability.js'
import { formatDuration, formatPrice } from '../../utils/format.js'

// Un appuntamento nell'agenda. Si vede l'essenziale (ora, cliente, servizi,
// prezzo); toccandolo si apre il dettaglio con telefono ed email.

function AppointmentCard({ appointment }) {
  const [open, setOpen] = useState(false)
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
    </article>
  )
}

export default AppointmentCard
