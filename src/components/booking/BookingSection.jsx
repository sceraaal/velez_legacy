import { useEffect, useRef, useState } from 'react'
import { createBooking, fetchBusyPeriods } from '../../lib/bookingApi.js'
import { fetchPriceList } from '../../lib/priceList.js'
import {
  formatDateTime,
  fromRome,
  getBookingWindow,
  getFreeSlots,
  roundUpToSlot,
} from '../../lib/availability.js'
import { formatDuration, formatPrice } from '../../utils/format.js'
import BaroqueFrame from '../BaroqueFrame.jsx'
import ServicePicker from './ServicePicker.jsx'
import MonthCalendar from './MonthCalendar.jsx'
import TimeSlots from './TimeSlots.jsx'
import CustomerForm from './CustomerForm.jsx'
import BookingConfirmation from './BookingConfirmation.jsx'
import './Booking.css'

// La sezione "Prenota": il cliente sceglie servizi, giorno e orario, scrive
// i suoi dati e conferma.
// Questo componente è il "genitore": tiene lo stato (cosa è stato scelto) e
// lo passa ai componenti figli, che si occupano solo di mostrarlo.

function BookingSection() {
  // Dati che arrivano dal database
  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'ready'
  const [categories, setCategories] = useState([])
  const [busy, setBusy] = useState([])

  // Scelte del cliente
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)

  // Invio della prenotazione
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState(null) // messaggio da mostrare, o null
  const [confirmed, setConfirmed] = useState(null) // { booking, services, firstName } dopo il salvataggio

  // ref = un "segnaposto" per raggiungere la sezione nella pagina e scorrere fin lì
  const sectionRef = useRef(null)

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
    setSubmitError(null)
  }

  function selectSlot(minutes) {
    setSelectedSlot(minutes)
    setSubmitError(null)
  }

  // La barra del riepilogo in fondo allo schermo è un bottone: porta al
  // primo passo ancora da fare (giorno, poi orario, poi dati).
  // Gli id stanno in MonthCalendar, TimeSlots e CustomerForm.
  // scrollIntoView segue lo "scroll-behavior: smooth" di index.css, che è
  // spento per chi ha chiesto meno animazioni nelle impostazioni del telefono.
  const nextStep =
    selectedDay === null
      ? { id: 'prenota-giorno', label: 'Scelga il giorno' }
      : selectedSlot === null
        ? { id: 'prenota-orario', label: "Scelga l'orario" }
        : { id: 'prenota-dati', label: 'Inserisca i Suoi dati' }

  function goToNextStep() {
    document.getElementById(nextStep.id)?.scrollIntoView({ block: 'start' })
  }

  // Il cliente ha premuto "Conferma" e i suoi dati sono a posto.
  // async/await: aspettiamo la risposta del database prima di andare avanti.
  async function submitBooking(customer) {
    setSending(true)
    setSubmitError(null)
    try {
      const booking = await createBooking({
        serviceIds: selectedIds,
        startsAt: fromRome(selectedDay, selectedSlot),
        customer,
      })
      setConfirmed({ booking, services: chosen, firstName: customer.firstName.trim() })
      // La conferma è più corta del modulo: riportiamo il cliente in cima alla sezione
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (error) {
      setSubmitError(error.message)
      // Se nel frattempo qualcuno ha preso l'orario, ricarichiamo gli orari
      // occupati: così l'orario sparisce e il cliente ne sceglie un altro.
      if (error.slotTaken) {
        setSelectedSlot(null)
        try {
          const from = fromRome(bookingWindow.first, 0)
          const to = fromRome(bookingWindow.last, 24 * 60)
          setBusy(await fetchBusyPeriods(from, to))
        } catch (reloadError) {
          console.error('Orari non aggiornati:', reloadError)
        }
      }
    } finally {
      // finally: si esegue sempre, che sia andata bene o male
      setSending(false)
    }
  }

  // "Nuova prenotazione": si ricomincia da capo. Ricarichiamo la pagina, così
  // anche gli orari occupati sono aggiornati (compreso quello appena preso).
  function startOver() {
    window.location.hash = 'prenota'
    window.location.reload()
  }

  return (
    <section ref={sectionRef} id="prenota" className="booking" aria-labelledby="prenota-titolo">
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

        {status === 'ready' && confirmed && (
          <BookingConfirmation
            booking={confirmed.booking}
            services={confirmed.services}
            firstName={confirmed.firstName}
            onNewBooking={startOver}
          />
        )}

        {status === 'ready' && !confirmed && (
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
              <TimeSlots slots={daySlots} selectedSlot={selectedSlot} onSelect={selectSlot} />
            )}

            {/* Il messaggio d'errore sta fuori dal modulo: resta visibile anche
                quando l'orario viene tolto perché preso da un altro cliente */}
            {submitError && (
              <p className="booking__error" role="alert">
                {submitError}
              </p>
            )}

            {/* Il modulo resta sempre "montato" e viene solo nascosto finché non
                c'è un orario: così, se l'orario sparisce, il cliente non perde
                quello che ha già scritto */}
            <CustomerForm hidden={selectedSlot === null} sending={sending} onSubmit={submitBooking} />
          </>
        )}
      </BaroqueFrame>

      {/* Riepilogo fisso in fondo allo schermo, appena c'è almeno un servizio.
          Toccandolo si va al passo successivo. */}
      {chosen.length > 0 && !confirmed && (
        <button type="button" className="booking-summary" onClick={goToNextStep}>
          {/* aria-live: il lettore di schermo legge il totale quando cambia */}
          <span className="booking-summary__row" aria-live="polite">
            <span className="booking-summary__line">
              {selectedDay && selectedSlot !== null
                ? formatDateTime(fromRome(selectedDay, selectedSlot))
                : `${chosen.length} ${chosen.length === 1 ? 'servizio' : 'servizi'} · ${formatDuration(totalMinutes)}`}
            </span>
            <span className="booking-summary__price">{formatPrice(totalPrice, hasFromPrice)}</span>
          </span>
          <span className="booking-summary__action">{nextStep.label} ›</span>
        </button>
      )}
    </section>
  )
}

export default BookingSection
