import { useEffect, useState } from 'react'
import { formatClock, formatDay, formatTime, OPENING, todayInRome } from '../../lib/availability.js'
import { deleteBlockedPeriod, fetchBlockedPeriods } from '../../lib/staffApi.js'
import BlockForm from './BlockForm.jsx'

// Linguetta "Blocchi": il modulo per bloccare ferie o impegni e, sotto,
// i blocchi non ancora finiti, ognuno con il tasto Togli.
// Nei giorni bloccati i clienti non vedono orari liberi (get_busy_periods).

// Un blocco scritto per Nicolas:
// - giorni interi (8:00–20:00): "martedì 17 novembre" oppure
//   "da martedì 17 novembre a venerdì 20 novembre"
// - fascia oraria in un giorno: "martedì 17 novembre, 11:00–12:00"
// - altro: "da martedì 17 novembre ore 15:00 a mercoledì 18 novembre ore 12:00"
function describeBlock({ startsAt, endsAt }) {
  const firstDay = todayInRome(startsAt)
  const lastDay = todayInRome(endsAt)
  const open = formatTime(OPENING.openMinutes)
  const close = formatTime(OPENING.closeMinutes)
  const wholeDays = formatClock(startsAt) === open && formatClock(endsAt) === close

  if (wholeDays) {
    return firstDay === lastDay ? formatDay(firstDay) : `da ${formatDay(firstDay)} a ${formatDay(lastDay)}`
  }
  if (firstDay === lastDay) {
    return `${formatDay(firstDay)}, ${formatClock(startsAt)}–${formatClock(endsAt)}`
  }
  return `da ${formatDay(firstDay)} ore ${formatClock(startsAt)} a ${formatDay(lastDay)} ore ${formatClock(endsAt)}`
}

function BlockedPeriods() {
  // null = sto caricando; altrimenti la lista
  const [blocks, setBlocks] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  // Cambiando questo numero si ricarica la lista (dopo un'aggiunta o una rimozione)
  const [version, setVersion] = useState(0)
  // Il blocco per cui stiamo chiedendo "vuoi davvero toglierlo?"
  const [confirmId, setConfirmId] = useState(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    let ignore = false
    fetchBlockedPeriods()
      .then((found) => {
        if (!ignore) setBlocks(found)
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
    setConfirmId(null)
    setVersion((v) => v + 1)
  }

  async function remove(id) {
    setRemoving(true)
    setError(null)
    try {
      await deleteBlockedPeriod(id)
      reload('Il blocco è stato tolto: gli orari tornano prenotabili.')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="blocks">
      <BlockForm onSaved={() => reload('Blocco salvato: in quel periodo i clienti non possono prenotare.')} />

      <h3 className="booking-step__title blocks__title">Blocchi in programma</h3>

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

      {blocks === null && !error && <p className="booking__message">Caricamento…</p>}

      {blocks?.length === 0 && <p className="booking__message">Nessun blocco in programma.</p>}

      {blocks?.length > 0 && (
        <ul className="blocks__list">
          {blocks.map((block) => (
            <li key={block.id} className="block-card">
              <p className="block-card__when">{describeBlock(block)}</p>
              {block.reason && <p className="block-card__reason">{block.reason}</p>}

              {confirmId === block.id ? (
                <div className="booking-card__confirm" role="group" aria-label="Conferma">
                  <p className="booking-card__question">Togliere questo blocco?</p>
                  <div className="booking-card__actions">
                    <button type="button" className="account__secondary" onClick={() => setConfirmId(null)} disabled={removing}>
                      No
                    </button>
                    <button type="button" className="booking-card__danger" onClick={() => remove(block.id)} disabled={removing}>
                      {removing ? 'Rimozione…' : 'Sì, togli'}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="account__secondary block-card__remove" onClick={() => setConfirmId(block.id)}>
                  Togli
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default BlockedPeriods
