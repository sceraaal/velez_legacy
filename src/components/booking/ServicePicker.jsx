import { formatDuration, formatPrice } from '../../utils/format.js'

// Passo 1 della prenotazione: il cliente spunta uno o più servizi.
// Riceve le categorie del listino e la lista degli id scelti; quando il
// cliente spunta o toglie un servizio chiama onToggle, e la decisione su cosa
// fare la prende il componente "genitore" (BookingSection).

function ServicePicker({ categories, selectedIds, onToggle }) {
  return (
    <fieldset className="booking-step">
      <legend className="booking-step__title">I Suoi servizi</legend>

      {categories.map((category) => (
        <div key={category.id} className="service-picker__group">
          <h4 className="service-picker__group-title">{category.name}</h4>
          {category.services.map((service) => (
            // <label> intorno alla casella: si può toccare tutta la riga
            <label key={service.id} className="service-picker__option">
              <input
                type="checkbox"
                className="service-picker__checkbox"
                checked={selectedIds.includes(service.id)}
                onChange={() => onToggle(service.id)}
              />
              <span className="service-picker__name">{service.name}</span>
              <span className="service-picker__meta">
                {formatPrice(service.price, service.fromPrice)} · {formatDuration(service.duration)}
              </span>
            </label>
          ))}
        </div>
      ))}
    </fieldset>
  )
}

export default ServicePicker
