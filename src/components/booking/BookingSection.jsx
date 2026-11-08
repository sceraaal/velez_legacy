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
import { clearPendingBooking, loadPendingBooking, savePendingBooking } from '../../lib/pendingBooking.js'
import { navigate, ROUTES } from '../../lib/router.js'
import BaroqueFrame from '../BaroqueFrame.jsx'
import ServicePicker from './ServicePicker.jsx'
import MonthCalendar from './MonthCalendar.jsx'
import TimeSlots from './TimeSlots.jsx'
import ConfirmStep from './ConfirmStep.jsx'
import BookingConfirmation from './BookingConfirmation.jsx'
import './Booking.css'

// La sezione "Prenota": il cliente sceglie servizi, giorno e orario e
// conferma. Per confermare serve l'account (passo 2 della Fase 1): chi non è
// dentro viene mandato all'area clienti e poi riportato qui, con le scelte
// ritrovate grazie a src/lib/pendingBooking.js.
// Questo componente è il "genitore": tiene lo stato (cosa è stato scelto) e
// lo passa ai componenti figli, che si occupano solo di mostrarlo.

function BookingSection({ auth }) {
  // Dati che arrivano dal database
  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'ready'
  const [categories, setCategories] = useState([])
  const [busy, setBusy] = useState([])

  // La prenotazione in sospeso, se il cliente torna dall'accesso. La leggiamo
  // una volta sola, all'apertura (useState con una funzione fa proprio questo).
  const [pending] = useState(() => loadPendingBooking())

  // Scelte del cliente: partono da quelle in sospeso, se ci sono
  const [selectedIds, setSelectedIds] = useState(pending?.serviceIds ?? [])
  const [selectedDay, setSelectedDay] = useState(pending?.day ?? null)
  const [selectedSlot, setSelectedSlot] = useState(pending?.slot ?? null)

  // Invio della prenotazione
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState(null) // messaggio da mostrare, o null
  const [confirmed, setConfirmed] = useState(null) // { booking, services } dopo il salvataggio

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

  // Quando i dati sono arrivati, portiamo il cliente al punto giusto:
  // - se l'indirizzo ha un "#" (es. /#prenota-conferma dopo l'accesso, o
  //   #prenota dopo "Nuova prenotazione") scorriamo fin lì;
  // - se ha ritrovato una prenotazione in sospeso ed è dentro, al passo Conferma.
  // Lo facciamo una volta sola (scrolledRef), non a ogni aggiornamento.
  const scrolledRef = useRef(false)
  const signedIn = Boolean(auth.session)
  useEffect(() => {
    if (status !== 'ready' || scrolledRef.current) return
    const targetId = window.location.hash.slice(1) || (pending && signedIn ? 'prenota-conferma' : '')
    if (!targetId) return
    scrolledRef.current = true
    document.getElementById(targetId)?.scrollIntoView({ block: 'start' })
  }, [status, pending, signedIn])

  // Cosa ha scelto il cliente, ricavato dallo stato (non serve salvarlo a parte)
  // (I servizi scelti che nel frattempo sono spariti dal listino non contano.)
  const allServices = categories.flatMap((category) => category.services)
  const chosen = allServices.filter((service) => selectedIds.includes(service.id))
  const totalMinutes = chosen.reduce((sum, service) => sum + service.duration, 0)
  const totalPrice = chosen.reduce((sum, service) => sum + service.price, 0)
  const hasFromPrice = chosen.some((service) => service.fromPrice)
  const slotMinutes = roundUpToSlot(totalMinutes)

  const slotsFor = (day) => getFreeSlots(day, slotMinutes, busy)
  const daySlots = selectedDay ? slotsFor(selectedDay) : []
  // Un orario ritrovato dopo l'accesso potrebbe essere stato preso da un altro
  // cliente nel frattempo: in quel caso è come se non fosse scelto.
  const chosenSlot = daySlots.includes(selectedSlot) ? selectedSlot : null

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
  // primo passo ancora da fare (giorno, poi orario, poi conferma).
  // Gli id stanno in MonthCalendar, TimeSlots e ConfirmStep.
  // scrollIntoView segue lo "scroll-behavior: smooth" di index.css, che è
  // spento per chi ha chiesto meno animazioni nelle impostazioni del telefono.
  const nextStep =
    selectedDay === null
      ? { id: 'prenota-giorno', label: 'Scelga il giorno' }
      : chosenSlot === null
        ? { id: 'prenota-orario', label: "Scelga l'orario" }
        : { id: 'prenota-conferma', label: 'Confermi la prenotazione' }

  function goToNextStep() {
    document.getElementById(nextStep.id)?.scrollIntoView({ block: 'start' })
  }

  // Chi non è dentro preme Accedi o Registrati: salviamo le scelte e lo
  // mandiamo all'area clienti (#registrati apre direttamente la registrazione).
  function goToLogin(mode) {
    savePendingBooking({ serviceIds: chosen.map((service) => service.id), day: selectedDay, slot: chosenSlot })
    navigate(mode === 'register' ? `${ROUTES.account}#registrati` : ROUTES.account)
  }

  // Il cliente (con l'account) ha premuto "Conferma".
  // async/await: aspettiamo la risposta del database prima di andare avanti.
  async function submitBooking() {
    setSending(true)
    setSubmitError(null)
    try {
      const booking = await createBooking({
        serviceIds: chosen.map((service) => service.id),
        startsAt: fromRome(selectedDay, chosenSlot),
      })
      clearPendingBooking()
      setConfirmed({ booking, services: chosen })
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
    clearPendingBooking()
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
            firstName={confirmed.booking.firstName}
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
              <TimeSlots slots={daySlots} selectedSlot={chosenSlot} onSelect={selectSlot} />
            )}

            {/* Il messaggio d'errore sta fuori dal passo Conferma: resta visibile
                anche quando l'orario viene tolto perché preso da un altro cliente */}
            {submitError && (
              <p className="booking__error" role="alert">
                {submitError}
              </p>
            )}

            <ConfirmStep
              hidden={chosenSlot === null}
              session={auth.session}
              authLoading={auth.loading}
              sending={sending}
              onLogin={goToLogin}
              onConfirm={submitBooking}
            />
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
              {selectedDay && chosenSlot !== null
                ? formatDateTime(fromRome(selectedDay, chosenSlot))
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
