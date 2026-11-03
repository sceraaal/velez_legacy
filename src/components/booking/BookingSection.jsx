import { useEffect, useState } from 'react'
import { fetchBusyPeriods } from '../../lib/bookingApi.js'
import { fetchPriceList } from '../../lib/priceList.js'
import {
  fromRome,
  getBookingWindow,
  getFreeSlots,
  roundUpToSlot,
  formatTime,
} from '../../lib/availability.js'
import { formatDuration, formatPrice } from '../../utils/format.js'
import BaroqueFrame from '../BaroqueFrame.jsx'
import ServicePicker from './ServicePicker.jsx'
import MonthCalendar from './MonthCalendar.jsx'
import TimeSlots from './TimeSlots.jsx'
import './Booking.css'

// La sezione "Prenota": il cliente sceglie servizi, giorno e orario.
// Questo componente è il "genitore": tiene lo stato (cosa è stato scelto) e
// lo passa ai componenti figli, che si occupano solo di mostrarlo.
// Nella parte 4c qui sotto arriverà il modulo con i dati del cliente.

const dayFormatter = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Rome',
})

function BookingSection() {
  // Dati che arrivano dal database
  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'ready'
  const [categories, setCategories] = useState([])
  const [busy, setBusy] = useState([])

  // Scelte del cliente
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)

  // La "finestra" dei giorni prenotabili: calcolata una volta all'apertura
  const [bookingWindow] = useState(() => getBookingWindow())

  // All'apertura: listino e orari occupati, insieme.
  // Promise.all aspetta che arrivino tutte e due le risposte.
  useEffect(() => {
    let ignore = false
    const from = fromRome(bookingWindow.first, 0)
    const to = fromRome(bookingWindow.last, 24 * 60)

    Promise.all([fetchPriceList(), fetchBusyPeriods(from, to)])
      .then(([priceList, busyPeriods]) => {
        if (ignore) return
        setCategories(priceList)
        setBusy(busyPeriods)
        setStatus('ready')
      })
      .catch((error) => {
        if (ignore) return
        console.error('Prenotazioni non disponibili:', error)
        setStatus('error')
      })

    return () => {
      ignore = true
    }
  }, [bookingWindow])

  // Cosa ha scelto il cliente, ricavato dallo stato (non serve salvarlo a parte)
  const allServices = categories.flatMap((category) => category.services)
  const chosen = allServices.filter((service) => selectedIds.includes(service.id))
  const totalMinutes = chosen.reduce((sum, service) => sum + service.duration, 0)
  const totalPrice = chosen.reduce((sum, service) => sum + service.price, 0)
  const hasFromPrice = chosen.some((service) => service.fromPrice)
  const slotMinutes = roundUpToSlot(totalMinutes)

  const slotsFor = (day) => getFreeSlots(day, slotMinutes, busy)
  const daySlots = selectedDay ? slotsFor(selectedDay) : []

  // Se cambiano i servizi, cambia la durata: giorno e orario scelti potrebbero
  // non andare più bene, quindi li azzeriamo.
  function toggleService(id) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
    setSelectedDay(null)
    setSelectedSlot(null)
  }

  function selectDay(day) {
    setSelectedDay(day)
    setSelectedSlot(null)
  }

  return (
    <section id="prenota" className="booking" aria-labelledby="prenota-titolo">
      <h2 id="prenota-titolo" className="booking__title">
        Prenota
      </h2>
      <p className="booking__subtitle">Scelga i servizi, il giorno e l'orario</p>

      <BaroqueFrame className="booking__frame">
        {status === 'loading' && <p className="booking__message">Caricamento…</p>}

        {status === 'error' && (
          <p className="booking__message" role="alert">
            La prenotazione non è disponibile al momento.
            <br />
            La preghiamo di riprovare più tardi.
          </p>
        )}

        {status === 'ready' && (
          <>
            <ServicePicker categories={categories} selectedIds={selectedIds} onToggle={toggleService} />

            {chosen.length > 0 && (
              <MonthCalendar
                first={bookingWindow.first}
                last={bookingWindow.last}
                isAvailable={(day) => slotsFor(day).length > 0}
                selectedDay={selectedDay}
                onSelect={selectDay}
              />
            )}

            {selectedDay && (
              <TimeSlots slots={daySlots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
            )}
          </>
        )}
      </BaroqueFrame>

      {/* Riepilogo fisso in fondo allo schermo, appena c'è almeno un servizio */}
      {chosen.length > 0 && (
        <div className="booking-summary" aria-live="polite">
          <p className="booking-summary__line">
            {selectedDay && selectedSlot !== null
              ? `${dayFormatter.format(fromRome(selectedDay, selectedSlot))}, ore ${formatTime(selectedSlot)}`
              : `${chosen.length} ${chosen.length === 1 ? 'servizio' : 'servizi'} · ${formatDuration(totalMinutes)}`}
          </p>
          <p className="booking-summary__price">{formatPrice(totalPrice, hasFromPrice)}</p>
        </div>
      )}
    </section>
  )
}

export default BookingSection
