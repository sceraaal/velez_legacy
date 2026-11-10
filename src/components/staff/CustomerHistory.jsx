import { useEffect, useState } from 'react'
import { formatDateTime } from '../../lib/availability.js'
import { fetchCustomerHistory } from '../../lib/staffApi.js'
import { formatPrice } from '../../utils/format.js'

// La scheda di un cliente: contatti e appuntamenti (prossimi e passati),
// dal più recente. Gli appuntamenti inseriti a mano hanno la scritta "a mano".

function CustomerHistory({ customer, onBack }) {
  // null = sto caricando; altrimenti { list, loadedAt }
  const [history, setHistory] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false
    fetchCustomerHistory(customer)
      .then((list) => {
        if (!ignore) setHistory({ list, loadedAt: new Date() })
      })
      .catch((failure) => {
        if (!ignore) setError(failure.message)
      })
    return () => {
      ignore = true
    }
  }, [customer])

  return (
    <div className="customer-history">
      <button type="button" className="account__link customer-history__back" onClick={onBack}>
        ← Tutti i clienti
      </button>

      <h3 className="customer-history__name">
        {customer.firstName} {customer.lastName}
      </h3>
      <p className="customer-row__kind">{customer.kind === 'account' ? 'Cliente con account' : 'Cliente senza account'}</p>

      <dl className="appointment__details customer-history__contacts">
        {customer.phone && (
          <>
            <dt>Telefono</dt>
            <dd>
              <a href={`tel:${customer.phone.replace(/\s/g, '')}`}>{customer.phone}</a>
            </dd>
          </>
        )}
        {customer.email && (
          <>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${customer.email}`}>{customer.email}</a>
            </dd>
          </>
        )}
        <dt>Visite</dt>
        <dd>
          {customer.visits}
          {customer.lastVisit && ` · l'ultima ${formatDateTime(customer.lastVisit)}`}
        </dd>
      </dl>

      <h4 className="booking-step__title">Appuntamenti</h4>

      {error && (
        <p className="customer-form__error" role="alert">
          {error}
        </p>
      )}

      {!history && !error && <p className="booking__message">Caricamento…</p>}

      {history?.list.length === 0 && <p className="booking__message">Nessun appuntamento.</p>}

      {history?.list.map((item) => {
        const upcoming = item.endsAt > history.loadedAt
        return (
          <article key={item.id} className={`booking-card${upcoming ? '' : ' booking-card--past'}`}>
            <p className="booking-card__when">
              {formatDateTime(item.startsAt)}
              {upcoming && ' · prossimo'}
            </p>
            <p className="booking-card__services">{item.serviceNames.join(' · ')}</p>
            <p className="booking-card__price">
              {formatPrice(item.totalPrice, item.fromPrice)}
              {item.manual && <span className="customer-history__manual"> · a mano</span>}
            </p>
          </article>
        )
      })}
    </div>
  )
}

export default CustomerHistory
