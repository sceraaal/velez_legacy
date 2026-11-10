import { useEffect, useState } from 'react'
import { formatTime, fromRome, OPENING } from '../../lib/availability.js'
import { fetchPriceList } from '../../lib/priceList.js'
import { fetchCustomers, staffCreateBooking } from '../../lib/staffApi.js'
import ServicePicker from '../booking/ServicePicker.jsx'

// "Nuovo appuntamento" inserito a mano da Nicolas (passo 5b): per chi telefona
// o per segnare un servizio già fatto a chi non ha l'account.
// 1. il cliente: uno dell'elenco, oppure uno nuovo (nome, cognome, telefono facoltativo)
// 2. i servizi
// 3. giorno e ora
// Le regole (giorni, mezz'ore, 8:00–20:00, niente sovrapposizioni) le
// controlla il database: qui mostriamo il suo messaggio se dice di no.

// Gli orari di inizio: 8:00, 8:30 ... 19:30
const START_TIMES = []
for (let m = OPENING.openMinutes; m < OPENING.closeMinutes; m += OPENING.slotStep) START_TIMES.push(m)

function ManualBookingForm({ initialDay, onDone, onCancel }) {
  // 'existing' = cliente dell'elenco, 'new' = cliente nuovo senza account
  const [customerMode, setCustomerMode] = useState('existing')
  const [search, setSearch] = useState('')
  const [found, setFound] = useState(null) // { search, list }
  const [customer, setCustomer] = useState(null)
  const [newCustomer, setNewCustomer] = useState({ firstName: '', lastName: '', phone: '' })

  const [categories, setCategories] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [day, setDay] = useState(initialDay)
  const [time, setTime] = useState(OPENING.openMinutes)

  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  // Il listino, una volta sola
  useEffect(() => {
    let ignore = false
    fetchPriceList()
      .then((list) => {
        if (!ignore) setCategories(list)
      })
      .catch(() => {
        if (!ignore) setError('Non siamo riusciti a caricare il listino.')
      })
    return () => {
      ignore = true
    }
  }, [])

  // Ricerca dei clienti mentre si scrive (almeno 2 lettere)
  const searching = customerMode === 'existing' && !customer && search.trim().length >= 2
  useEffect(() => {
    if (!searching) return
    let ignore = false
    const timer = setTimeout(() => {
      fetchCustomers(search)
        .then((list) => {
          if (!ignore) setFound({ search, list })
        })
        .catch((failure) => {
          if (!ignore) setError(failure.message)
        })
    }, 300)
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [searching, search])

  const results = searching && found?.search === search ? found.list : null

  function toggleService(id) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (customerMode === 'existing' && !customer) return setError('Scegli il cliente dall\'elenco.')
    if (customerMode === 'new' && (!newCustomer.firstName.trim() || !newCustomer.lastName.trim())) {
      return setError('Scrivi nome e cognome del cliente.')
    }
    if (selectedIds.length === 0) return setError('Scegli almeno un servizio.')
    if (!day) return setError('Scegli il giorno.')

    setSending(true)
    try {
      await staffCreateBooking({
        customer: customerMode === 'existing' ? customer : null,
        newCustomer: customerMode === 'new' ? newCustomer : null,
        serviceIds: selectedIds,
        startsAt: fromRome(day, time),
      })
      onDone(day)
    } catch (failure) {
      setError(failure.message)
      setSending(false)
    }
  }

  return (
    <form className="manual-booking" onSubmit={handleSubmit} noValidate>
      <h3 className="booking-step__title">Nuovo appuntamento</h3>

      {/* 1. Il cliente */}
      <fieldset className="booking-step">
        <legend className="booking-step__title">Cliente</legend>
        <div className="account__tabs">
          <button
            type="button"
            className="account__tab"
            aria-pressed={customerMode === 'existing'}
            onClick={() => setCustomerMode('existing')}
          >
            Dall'elenco
          </button>
          <button
            type="button"
            className="account__tab"
            aria-pressed={customerMode === 'new'}
            onClick={() => setCustomerMode('new')}
          >
            Nuovo
          </button>
        </div>

        {customerMode === 'existing' && customer && (
          <div className="manual-booking__chosen">
            <span>
              {customer.firstName} {customer.lastName}
              {customer.phone && ` · ${customer.phone}`}
            </span>
            <button type="button" className="account__link" onClick={() => setCustomer(null)}>
              Cambia
            </button>
          </div>
        )}

        {customerMode === 'existing' && !customer && (
          <>
            <div className="customer-form__field">
              <label htmlFor="nuovo-cerca" className="customer-form__label">
                Cerca per nome, cognome o telefono
              </label>
              <input
                id="nuovo-cerca"
                className="customer-form__input"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            {results?.length === 0 && (
              <p className="account__hint">Nessun cliente trovato: usa "Nuovo" per aggiungerlo.</p>
            )}
            {results?.length > 0 && (
              <ul className="customers__list">
                {results.slice(0, 8).map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <button type="button" className="customer-row" onClick={() => setCustomer(item)}>
                      <span className="customer-row__name">
                        {item.lastName} {item.firstName}
                      </span>
                      <span className="customer-row__kind">{item.phone ?? ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {customerMode === 'new' && (
          <>
            {[
              ['firstName', 'Nome'],
              ['lastName', 'Cognome'],
              ['phone', 'Telefono (facoltativo)'],
            ].map(([field, label]) => (
              <div className="customer-form__field" key={field}>
                <label htmlFor={`nuovo-${field}`} className="customer-form__label">
                  {label}
                </label>
                <input
                  id={`nuovo-${field}`}
                  className="customer-form__input"
                  type={field === 'phone' ? 'tel' : 'text'}
                  autoComplete="off"
                  maxLength={field === 'phone' ? 20 : 60}
                  value={newCustomer[field]}
                  onChange={(event) => setNewCustomer({ ...newCustomer, [field]: event.target.value })}
                />
              </div>
            ))}
          </>
        )}
      </fieldset>

      {/* 2. I servizi */}
      {categories ? (
        <ServicePicker categories={categories} selectedIds={selectedIds} onToggle={toggleService} title="Servizi" />
      ) : (
        <p className="booking__message">Caricamento del listino…</p>
      )}

      {/* 3. Giorno e ora */}
      <fieldset className="booking-step">
        <legend className="booking-step__title">Giorno e ora</legend>
        <div className="block-form__row">
          <div className="customer-form__field">
            <label htmlFor="nuovo-giorno" className="customer-form__label">
              Giorno
            </label>
            <input
              id="nuovo-giorno"
              className="customer-form__input"
              type="date"
              value={day}
              onChange={(event) => setDay(event.target.value)}
            />
          </div>
          <div className="customer-form__field">
            <label htmlFor="nuovo-ora" className="customer-form__label">
              Ora
            </label>
            <select
              id="nuovo-ora"
              className="customer-form__input"
              value={time}
              onChange={(event) => setTime(Number(event.target.value))}
            >
              {START_TIMES.map((m) => (
                <option key={m} value={m}>
                  {formatTime(m)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {error && (
        <p className="customer-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="booking-card__actions">
        <button type="button" className="account__secondary" onClick={onCancel} disabled={sending}>
          Annulla
        </button>
        <button type="submit" className="booking-card__primary" disabled={sending}>
          {sending ? 'Salvataggio…' : 'Salva'}
        </button>
      </div>
    </form>
  )
}

export default ManualBookingForm
