import { useEffect, useState } from 'react'
import { fetchMyBookings } from '../../lib/bookingApi.js'
import BookingCard from './BookingCard.jsx'

// "I miei appuntamenti": i prossimi (con Disdici e Sposta) e gli ultimi 5
// passati. Le prenotazioni arrivano dal database già filtrate: solo quelle
// confermate di chi ha fatto l'accesso (funzione get_my_bookings).

const PAST_TO_SHOW = 5

function MyBookings() {
  // null = sto caricando; altrimenti { list, loadedAt }. loadedAt è l'ora del
  // caricamento: la usiamo come "adesso" per dividere prossimi e passati
  // (React vuole che il disegno della pagina non legga l'orologio).
  const [bookings, setBookings] = useState(null)
  const [error, setError] = useState(null)
  // Ogni volta che questo numero cambia, ricarichiamo la lista
  // (dopo una disdetta o uno spostamento)
  const [version, setVersion] = useState(0)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    let ignore = false
    fetchMyBookings()
      .then((found) => {
        if (!ignore) setBookings({ list: found, loadedAt: new Date() })
      })
      .catch((failure) => {
        if (!ignore) setError(failure.message)
      })
    return () => {
      ignore = true
    }
  }, [version])

  function reload(message) {
    setNotice(message)
    setVersion((v) => v + 1)
  }

  const now = bookings?.loadedAt
  const upcoming = bookings ? bookings.list.filter((b) => b.endsAt > now) : []
  // I passati dal più recente al più vecchio
  const past = bookings ? bookings.list.filter((b) => b.endsAt <= now).reverse().slice(0, PAST_TO_SHOW) : []

  return (
    <section className="my-bookings" aria-labelledby="miei-appuntamenti">
      <h3 id="miei-appuntamenti" className="booking-step__title">
        I miei appuntamenti
      </h3>

      {notice && (
        <p className="account__notice" role="status">
          {notice}
        </p>
      )}

      {error && (
        <p className="customer-form__error" role="alert">
          {error}
        </p>
      )}

      {!bookings && !error && <p className="booking__message">Caricamento…</p>}

      {bookings && upcoming.length === 0 && (
        <p className="booking__message">Non ha appuntamenti in programma.</p>
      )}

      {upcoming.map((booking) => (
        <BookingCard key={booking.id} booking={booking} now={now} onChanged={reload} />
      ))}

      {past.length > 0 && (
        <>
          <p className="my-bookings__past-title">Appuntamenti passati</p>
          {past.map((booking) => (
            <BookingCard key={booking.id} booking={booking} now={now} past />
          ))}
        </>
      )}
    </section>
  )
}

export default MyBookings
