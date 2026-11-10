import { useState } from 'react'
import { addDays, formatTime, fromRome, OPENING, todayInRome } from '../../lib/availability.js'
import { addBlockedPeriod } from '../../lib/staffApi.js'

// Modulo per un blocco nuovo. Due tipi:
// - "Giorni interi" (ferie): primo e ultimo giorno, dalle 8:00 alle 20:00
// - "Fascia oraria" (un impegno): un giorno, ora di inizio e di fine
// I giorni e le ore sono in ora italiana: la conversione la fa fromRome.

// Le ore che si possono scegliere: 8:00, 8:30 ... 20:00 (in minuti)
const TIMES = []
for (let m = OPENING.openMinutes; m <= OPENING.closeMinutes; m += OPENING.slotStep) TIMES.push(m)

function BlockForm({ onSaved }) {
  // Il giorno di oggi, letto una volta all'apertura del modulo
  const [today] = useState(() => todayInRome())
  const [kind, setKind] = useState('days') // 'days' oppure 'hours'
  const [firstDay, setFirstDay] = useState(today)
  const [lastDay, setLastDay] = useState(today)
  const [day, setDay] = useState(today)
  const [from, setFrom] = useState(OPENING.openMinutes)
  const [to, setTo] = useState(OPENING.openMinutes + 60)
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    // Inizio e fine come istanti, a partire da giorni e ore italiani
    let startsAt
    let endsAt
    if (kind === 'days') {
      if (!firstDay || !lastDay) return setError('Scegli il primo e l\'ultimo giorno.')
      if (lastDay < firstDay) return setError('L\'ultimo giorno non può venire prima del primo.')
      startsAt = fromRome(firstDay, OPENING.openMinutes)
      endsAt = fromRome(lastDay, OPENING.closeMinutes)
    } else {
      if (!day) return setError('Scegli il giorno.')
      if (to <= from) return setError('L\'ora di fine deve venire dopo quella di inizio.')
      startsAt = fromRome(day, from)
      endsAt = fromRome(day, to)
    }

    setSending(true)
    try {
      await addBlockedPeriod({ startsAt, endsAt, reason })
      setReason('')
      onSaved()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <form className="block-form" onSubmit={handleSubmit} noValidate>
      <h3 className="booking-step__title">Blocca giorni o orari</h3>

      {/* Le due linguette, come Accedi / Registrati */}
      <div className="account__tabs">
        <button type="button" className="account__tab" aria-pressed={kind === 'days'} onClick={() => setKind('days')}>
          Giorni interi
        </button>
        <button type="button" className="account__tab" aria-pressed={kind === 'hours'} onClick={() => setKind('hours')}>
          Fascia oraria
        </button>
      </div>

      {kind === 'days' ? (
        <div className="block-form__row">
          <div className="customer-form__field">
            <label htmlFor="blocco-dal" className="customer-form__label">
              Dal
            </label>
            <input
              id="blocco-dal"
              className="customer-form__input"
              type="date"
              min={today}
              value={firstDay}
              onChange={(event) => {
                setFirstDay(event.target.value)
                // Se l'ultimo giorno resta prima del primo, lo spostiamo insieme
                if (event.target.value > lastDay) setLastDay(event.target.value)
              }}
            />
          </div>
          <div className="customer-form__field">
            <label htmlFor="blocco-al" className="customer-form__label">
              Al (compreso)
            </label>
            <input
              id="blocco-al"
              className="customer-form__input"
              type="date"
              min={firstDay || today}
              max={addDays(today, 366)}
              value={lastDay}
              onChange={(event) => setLastDay(event.target.value)}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="customer-form__field">
            <label htmlFor="blocco-giorno" className="customer-form__label">
              Giorno
            </label>
            <input
              id="blocco-giorno"
              className="customer-form__input"
              type="date"
              min={today}
              value={day}
              onChange={(event) => setDay(event.target.value)}
            />
          </div>
          <div className="block-form__row">
            <div className="customer-form__field">
              <label htmlFor="blocco-inizio" className="customer-form__label">
                Dalle
              </label>
              <select
                id="blocco-inizio"
                className="customer-form__input"
                value={from}
                onChange={(event) => setFrom(Number(event.target.value))}
              >
                {TIMES.slice(0, -1).map((m) => (
                  <option key={m} value={m}>
                    {formatTime(m)}
                  </option>
                ))}
              </select>
            </div>
            <div className="customer-form__field">
              <label htmlFor="blocco-fine" className="customer-form__label">
                Alle
              </label>
              <select
                id="blocco-fine"
                className="customer-form__input"
                value={to}
                onChange={(event) => setTo(Number(event.target.value))}
              >
                {TIMES.slice(1).map((m) => (
                  <option key={m} value={m}>
                    {formatTime(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      <div className="customer-form__field">
        <label htmlFor="blocco-nota" className="customer-form__label">
          Nota (facoltativa)
        </label>
        <input
          id="blocco-nota"
          className="customer-form__input"
          type="text"
          maxLength={100}
          placeholder="es. ferie, dentista"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>

      {error && (
        <p className="customer-form__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="customer-form__submit" disabled={sending}>
        {sending ? 'Salvataggio…' : 'Blocca'}
      </button>
    </form>
  )
}

export default BlockForm
