import { formatDuration, formatPrice } from '../utils/format.js'

// Una scheda del listino: nome, durata, prezzo e il bottone "+" per sceglierla.
// Non decide da sola se è scelta: lo riceve da fuori (selected) e, quando la
// tocchi, avvisa chi la usa chiamando onToggle.

function ServiceCard({ service, selected, onToggle }) {
  const label = `${selected ? 'Togli' : 'Aggiungi'} ${service.name}`

  return (
    <li className={selected ? 'service-card service-card--selected' : 'service-card'}>
      <div className="service-card__info">
        <span className="service-card__name">{service.name}</span>
        <span className="service-card__meta">
          {formatDuration(service.duration)} ·{' '}
          <span className="service-card__price">{formatPrice(service.price, service.fromPrice)}</span>
        </span>
        {service.fromPrice && (
          <span className="service-card__note">Prezzo finale dopo consulenza in salone</span>
        )}
      </div>

      {/* aria-pressed dice ai lettori di schermo se il servizio è scelto */}
      <button
        type="button"
        className="service-card__toggle"
        aria-label={label}
        aria-pressed={selected}
        onClick={() => onToggle(service.id)}
      >
        {selected ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M3 8.5l3.5 3.5L13 4.5" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path d="M8 2v12M2 8h12" />
          </svg>
        )}
      </button>
    </li>
  )
}

export default ServiceCard
