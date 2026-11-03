import { addDays, weekday } from '../../lib/availability.js'

// Passo 2: il calendario. Mostra i giorni dal primo all'ultimo prenotabile,
// divisi per mese, in una griglia di 7 colonne (da lunedì a domenica).
// I giorni senza orari liberi sono spenti (disabled).

const WEEKDAY_LABELS = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do']
const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

// Raggruppa i giorni per mese: { '2026-11': ['2026-11-03', ...], ... }
function groupByMonth(first, last) {
  const months = new Map()
  for (let day = first; day <= last; day = addDays(day, 1)) {
    const key = day.slice(0, 7)
    if (!months.has(key)) months.set(key, [])
    months.get(key).push(day)
  }
  return months
}

function MonthCalendar({ first, last, isAvailable, selectedDay, onSelect }) {
  const months = groupByMonth(first, last)

  return (
    <fieldset className="booking-step">
      <legend className="booking-step__title">Il giorno</legend>

      {[...months].map(([key, days]) => {
        const monthName = MONTHS[Number(key.slice(5, 7)) - 1]
        // Caselle vuote prima del primo giorno, per allinearlo alla colonna giusta
        const blanks = weekday(days[0]) - 1

        return (
          <div key={key} className="calendar">
            <p className="calendar__month">
              {monthName} {key.slice(0, 4)}
            </p>
            <div className="calendar__grid">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className="calendar__weekday" aria-hidden="true">
                  {label}
                </span>
              ))}
              {Array.from({ length: blanks }, (_, i) => (
                <span key={`blank-${i}`} />
              ))}
              {days.map((day) => {
                const available = isAvailable(day)
                const selected = day === selectedDay
                return (
                  <button
                    key={day}
                    type="button"
                    className={`calendar__day${selected ? ' calendar__day--selected' : ''}`}
                    disabled={!available}
                    aria-pressed={selected}
                    aria-label={`${Number(day.slice(8))} ${monthName}`}
                    onClick={() => onSelect(day)}
                  >
                    {Number(day.slice(8))}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </fieldset>
  )
}

export default MonthCalendar
