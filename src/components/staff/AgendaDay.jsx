import { useEffect, useState } from 'react'
import { addDays, formatDay, OPENING, todayInRome, weekday } from '../../lib/availability.js'
import { fetchAgenda } from '../../lib/staffApi.js'
import { formatPrice } from '../../utils/format.js'
import AppointmentCard from './AppointmentCard.jsx'
import ManualBookingForm from './ManualBookingForm.jsx'

// Un giorno dell'agenda: in alto il giorno con ← → e "Oggi", sotto gli
// appuntamenti in ordine di ora. Si apre sempre su oggi.

function AgendaDay() {
  // Il giorno mostrato, come 'AAAA-MM-GG' in ora italiana
  const [day, setDay] = useState(() => todayInRome())
  // Ultima risposta del database: { day, list } oppure { day, error }.
  // Ricordiamo il giorno, così mentre carica un giorno nuovo non mostriamo
  // per sbaglio gli appuntamenti di quello prima.
  const [result, setResult] = useState(null)
  // Cambiando questo numero si ricarica lo stesso giorno (tasto Aggiorna)
  const [version, setVersion] = useState(0)
  // Messaggio dopo una disdetta o un inserimento; sparisce cambiando giorno
  const [notice, setNotice] = useState(null)
  // true = al posto della lista c'è il modulo "Nuovo appuntamento" (passo 5b)
  const [adding, setAdding] = useState(false)

  function changeDay(next) {
    setNotice(null)
    setDay(next)
  }

  useEffect(() => {
    let ignore = false
    fetchAgenda(day)
      .then((list) => {
        if (!ignore) setResult({ day, list, loadedAt: new Date() })
      })
      .catch((failure) => {
        if (!ignore) setResult({ day, error: failure.message })
      })
    return () => {
      ignore = true
    }
  }, [day, version])

  const current = result?.day === day ? result : null
  const closed = !OPENING.days.includes(weekday(day))
  const list = current?.list ?? []
  const total = list.reduce((sum, item) => sum + item.totalPrice, 0)
  const anyFromPrice = list.some((item) => item.fromPrice)

  if (adding) {
    return (
      <ManualBookingForm
        initialDay={day}
        onCancel={() => setAdding(false)}
        onDone={(savedDay) => {
          setAdding(false)
          setDay(savedDay)
          setNotice("L'appuntamento è stato salvato.")
          setVersion((v) => v + 1)
        }}
      />
    )
  }

  return (
    <div className="agenda">
      <div className="agenda__nav">
        <button type="button" className="agenda__arrow" onClick={() => changeDay(addDays(day, -1))} aria-label="Giorno prima">
          ←
        </button>
        <h3 className="agenda__day" aria-live="polite">
          {formatDay(day)}
        </h3>
        <button type="button" className="agenda__arrow" onClick={() => changeDay(addDays(day, 1))} aria-label="Giorno dopo">
          →
        </button>
      </div>

      <div className="agenda__tools">
        <button type="button" className="account__secondary" onClick={() => changeDay(todayInRome())}>
          Oggi
        </button>
        <button type="button" className="account__secondary" onClick={() => setVersion((v) => v + 1)}>
          Aggiorna
        </button>
      </div>

      <button type="button" className="customer-form__submit agenda__add" onClick={() => setAdding(true)}>
        + Nuovo appuntamento
      </button>

      {notice && (
        <p className="account__notice" role="status">
          {notice}
        </p>
      )}

      {!current && <p className="booking__message">Caricamento…</p>}

      {current?.error && (
        <p className="customer-form__error" role="alert">
          {current.error}
        </p>
      )}

      {current?.list && list.length === 0 && (
        <p className="booking__message">{closed ? 'Salone chiuso' : 'Nessun appuntamento'}</p>
      )}

      {list.length > 0 && (
        <>
          <p className="agenda__summary">
            {list.length} {list.length === 1 ? 'appuntamento' : 'appuntamenti'} · {formatPrice(total, anyFromPrice)}
          </p>
          <ol className="agenda__list">
            {list.map((item) => (
              <li key={item.id}>
                <AppointmentCard
                  appointment={item}
                  now={current.loadedAt}
                  onCancelled={() => {
                    setNotice("L'appuntamento è stato disdetto: l'orario è di nuovo libero.")
                    setVersion((v) => v + 1)
                  }}
                />
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}

export default AgendaDay
