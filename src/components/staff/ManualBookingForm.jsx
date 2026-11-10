import { useEffect, useState } from 'react'
import { fetchBusyPeriods } from '../../lib/bookingApi.js'
import {
  addDays,
  formatDateTime,
  fromRome,
  getFreeSlots,
  roundUpToSlot,
  todayInRome,
} from '../../lib/availability.js'
import { formatDuration, formatPrice } from '../../utils/format.js'
import { fetchPriceList } from '../../lib/priceList.js'
import { fetchCustomers, staffCreateBooking } from '../../lib/staffApi.js'
import MonthCalendar from '../booking/MonthCalendar.jsx'
import ServicePicker from '../booking/ServicePicker.jsx'
import TimeSlots from '../booking/TimeSlots.jsx'

// "Nuovo appuntamento" inserito a mano da Nicolas (passo 5b): per chi telefona
// o per segnare un servizio già fatto a chi non ha l'account.
// 1. il cliente: uno dell'elenco, oppure uno nuovo (nome, cognome, telefono facoltativo)
// 2. i servizi
// 3. giorno e ora, con lo stesso calendario dei clienti: si vedono solo i
//    giorni e gli orari liberi per la durata dei servizi scelti
//    (occupati = appuntamenti e blocchi, da get_busy_periods).
// Come nella prenotazione dei clienti, ogni passo compare quando il precedente
// è fatto, e la barra in fondo allo schermo porta al passo successivo.
// Le regole le ricontrolla comunque il database: se nel frattempo qualcuno
// ha preso l'orario, mostriamo il suo messaggio.

// Il calendario va da 2 settimane fa (per segnare servizi già fatti) a 45
// giorni avanti (prenotazioni al telefono)
const DAYS_BACK = 14
const DAYS_AHEAD = 45

// get_busy_periods accetta al massimo 40 giorni per volta: due richieste
async function fetchBusyWindow(first, last) {
  const middle = addDays(first, 30)
  const [a, b] = await Promise.all([
    fetchBusyPeriods(fromRome(first, 0), fromRome(middle, 0)),
    fetchBusyPeriods(fromRome(middle, 0), fromRome(addDays(last, 1), 0)),
  ])
  return [...a, ...b]
}

function ManualBookingForm({ initialDay, onDone, onCancel }) {
  // 'existing' = cliente dell'elenco, 'new' = cliente nuovo senza account
  const [customerMode, setCustomerMode] = useState('existing')
  const [search, setSearch] = useState('')
  const [found, setFound] = useState(null) // { search, list }
  const [customer, setCustomer] = useState(null)
  const [newCustomer, setNewCustomer] = useState({ firstName: '', lastName: '', phone: '' })

  const [categories, setCategories] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  // Il periodo del calendario, fissato all'apertura del modulo
  const [window_] = useState(() => {
    const today = todayInRome()
    return { first: addDays(today, -DAYS_BACK), last: addDays(today, DAYS_AHEAD) }
  })
  // { list } quando arrivano i periodi occupati, { error } se qualcosa va storto
  const [busy, setBusy] = useState(null)
  const [day, setDay] = useState(initialDay)
  const [time, setTime] = useState(null)

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

  // Gli orari occupati del periodo, una volta sola
  useEffect(() => {
    let ignore = false
    fetchBusyWindow(window_.first, window_.last)
      .then((list) => {
        if (!ignore) setBusy({ list })
      })
      .catch(() => {
        if (!ignore) setBusy({ error: 'Non siamo riusciti a caricare gli orari occupati.' })
      })
    return () => {
      ignore = true
    }
  }, [window_])

  // Durata da occupare: la somma dei servizi scelti, arrotondata alla mezz'ora
  // (senza servizi scelti, mezz'ora)
  const chosen = (categories ?? [])
    .flatMap((category) => category.services)
    .filter((service) => selectedIds.includes(service.id))
  const totalMinutes = chosen.reduce((sum, service) => sum + service.duration, 0)
  const totalPrice = chosen.reduce((sum, service) => sum + service.price, 0)
  const hasFromPrice = chosen.some((service) => service.fromPrice)
  const slotMinutes = roundUpToSlot(Math.max(totalMinutes, 1))
  const freeSlots = (someDay) => getFreeSlots(someDay, slotMinutes, busy?.list ?? [], undefined, { withLimits: false })
  const daySlots = busy?.list && day ? freeSlots(day) : []
  // Se cambiando servizi o giorno l'ora scelta non è più libera, non vale più
  const chosenTime = daySlots.includes(time) ? time : null

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

  // La barra in fondo porta al primo passo ancora da fare (come per i clienti).
  // Gli id nuovo-giorno, nuovo-orario e nuovo-salva sono nel modulo qui sotto.
  const nextStep =
    !day
      ? { id: 'nuovo-giorno', label: 'Scegli il giorno' }
      : chosenTime === null
        ? { id: 'nuovo-orario', label: "Scegli l'orario" }
        : { id: 'nuovo-salva', label: "Salva l'appuntamento" }

  function goToNextStep() {
    document.getElementById(nextStep.id)?.scrollIntoView({ block: 'start' })
  }

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
    if (chosenTime === null) return setError("Scegli un orario libero.")

    setSending(true)
    try {
      await staffCreateBooking({
        customer: customerMode === 'existing' ? customer : null,
        newCustomer: customerMode === 'new' ? newCustomer : null,
        serviceIds: selectedIds,
        startsAt: fromRome(day, chosenTime),
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

      {/* 3. Giorno e ora: solo quelli liberi */}
      {busy?.error && (
        <p className="customer-form__error" role="alert">
          {busy.error}
        </p>
      )}
      {!busy && <p className="booking__message">Caricamento degli orari…</p>}
      {busy?.list && chosen.length > 0 && (
        <>
          <MonthCalendar
            id="nuovo-giorno"
            first={window_.first}
            last={window_.last}
            isAvailable={(someDay) => freeSlots(someDay).length > 0}
            selectedDay={day}
            onSelect={setDay}
          />
          {day && <TimeSlots id="nuovo-orario" slots={daySlots} selectedSlot={chosenTime} onSelect={setTime} />}
        </>
      )}

      {error && (
        <p className="customer-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="booking-card__actions" id="nuovo-salva">
        <button type="button" className="account__secondary" onClick={onCancel} disabled={sending}>
          Annulla
        </button>
        <button type="submit" className="booking-card__primary" disabled={sending}>
          {sending ? 'Salvataggio…' : 'Salva'}
        </button>
      </div>

      {/* Riepilogo fisso in fondo allo schermo, come nella prenotazione dei clienti */}
      {chosen.length > 0 && (
        <button type="button" className="booking-summary" onClick={goToNextStep}>
          <span className="booking-summary__row" aria-live="polite">
            <span className="booking-summary__line">
              {day && chosenTime !== null
                ? formatDateTime(fromRome(day, chosenTime))
                : `${chosen.length} ${chosen.length === 1 ? 'servizio' : 'servizi'} · ${formatDuration(totalMinutes)}`}
            </span>
            <span className="booking-summary__price">{formatPrice(totalPrice, hasFromPrice)}</span>
          </span>
          <span className="booking-summary__action">{nextStep.label} ›</span>
        </button>
      )}
    </form>
  )
}

export default ManualBookingForm
