import { formatTime } from '../../lib/availability.js'

// Passo 3: gli orari liberi del giorno scelto, come bottoni.

function TimeSlots({ slots, selectedSlot, onSelect, id = 'prenota-orario' }) {
  return (
    <fieldset className="booking-step" id={id}>
      <legend className="booking-step__title">L'orario</legend>
      {slots.length === 0 ? (
        <p className="booking__message">Nessun orario libero in questo giorno.</p>
      ) : (
        <div className="time-slots">
          {slots.map((minutes) => {
            const selected = minutes === selectedSlot
            return (
              <button
                key={minutes}
                type="button"
                className={`time-slots__slot${selected ? ' time-slots__slot--selected' : ''}`}
                aria-pressed={selected}
                onClick={() => onSelect(minutes)}
              >
                {formatTime(minutes)}
              </button>
            )
          })}
        </div>
      )}
    </fieldset>
  )
}

export default TimeSlots
