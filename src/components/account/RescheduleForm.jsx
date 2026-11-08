import { useEffect, useState } from 'react'
import { fetchBusyPeriods, rescheduleBooking } from '../../lib/bookingApi.js'
import { formatDateTime, fromRome, getBookingWindow, getFreeSlots, roundUpToSlot } from '../../lib/availability.js'
import MonthCalendar from '../booking/MonthCalendar.jsx'
import TimeSlots from '../booking/TimeSlots.jsx'

// "Sposta": lo stesso calendario e gli stessi orari della prenotazione, per un
// appuntamento della stessa durata. Il vecchio orario resta del cliente finché
// il database non conferma il nuovo (funzione reschedule_booking).

function RescheduleForm({ booking, onCancel, onDone }) {
  const [busy, setBusy] = useState(null) // null = sto caricando
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [bookingWindow] = useState(() => getBookingWindow())

  const slotMinutes = roundUpToSlot(booking.totalMinutes)

  useEffect(() => {
    let ignore = false
    fetchBusyPeriods(fromRome(bookingWindow.first, 0), fromRome(bookingWindow.last, 24 * 60))
      .then((periods) => {
        if (ignore) return
        // Il suo stesso appuntamento non conta come occupato: così può
        // spostarlo anche di mezz'ora, sovrapponendosi al vecchio orario.
        setBusy(
          periods.filter(
            (p) =>
              p.from.getTime() !== booking.startsAt.getTime() || p.to.getTime() !== booking.endsAt.getTime(),
          ),
        )
      })
      .catch(() => {
        if (!ignore) setError('Non siamo riusciti a caricare gli orari. La preghiamo di riprovare.')
      })
    return () => {
      ignore = true
    }
  }, [bookingWindow, booking])

  const slotsFor = (day) => (busy ? getFreeSlots(day, slotMinutes, busy) : [])
  const daySlots = selectedDay ? slotsFor(selectedDay) : []

  async function confirm() {
    setSending(true)
    setError(null)
    try {
      await rescheduleBooking(booking.id, fromRome(selectedDay, selectedSlot))
      onDone()
    } catch (failure) {
      setError(failure.message)
      setSending(false)
      // Orario preso nel frattempo: lo togliamo e il cliente ne sceglie un altro
      if (failure.slotTaken) setSelectedSlot(null)
    }
  }

  return (
    <div className="reschedule">
      {!busy && !error && <p className="booking__message">Caricamento degli orari…</p>}

      {busy && (
        <>
          <MonthCalendar
            id={null}
            first={bookingWindow.first}
            last={bookingWindow.last}
            isAvailable={(day) => slotsFor(day).length > 0}
            selectedDay={selectedDay}
            onSelect={(day) => {
              setSelectedDay(day)
              setSelectedSlot(null)
            }}
          />
          {selectedDay && <TimeSlots id={null} slots={daySlots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />}
        </>
      )}

      {error && (
        <p className="customer-form__error" role="alert">
          {error}
        </p>
      )}

      {selectedDay && selectedSlot !== null && (
        <p className="booking-card__question">
          Nuovo orario: {formatDateTime(fromRome(selectedDay, selectedSlot))}
        </p>
      )}

      <div className="booking-card__actions">
        <button type="button" className="account__secondary" onClick={onCancel} disabled={sending}>
          Annulla
        </button>
        <button
          type="button"
          className="booking-card__primary"
          onClick={confirm}
          disabled={sending || selectedDay === null || selectedSlot === null}
        >
          {sending ? 'Spostamento…' : 'Conferma'}
        </button>
      </div>
    </div>
  )
}

export default RescheduleForm
