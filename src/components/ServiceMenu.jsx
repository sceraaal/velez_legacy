import { useState } from 'react'
import { serviceCategories } from '../data/services.js'
import ServiceCard from './ServiceCard.jsx'
import './ServiceMenu.css'

// Il listino: i filtri in alto (Tutti, Luxury, Taglio…) e le schede dei servizi.
// Il filtro scelto è uno "stato" di questo componente (useState): quando cambia,
// React ridisegna da solo la lista.

const ALL = 'tutti'

function ServiceMenu({ selectedIds, onToggle }) {
  const [activeFilter, setActiveFilter] = useState(ALL)

  // Le sezioni da mostrare: tutte, oppure solo quella scelta nei filtri
  const visibleCategories =
    activeFilter === ALL
      ? serviceCategories
      : serviceCategories.filter((category) => category.id === activeFilter)

  const filters = [{ id: ALL, shortName: 'Tutti' }, ...serviceCategories]

  return (
    <section id="servizi" className="service-menu" aria-labelledby="servizi-titolo">
      <div className="service-menu__heading">
        <h2 id="servizi-titolo" className="service-menu__title">
          Servizi
        </h2>
        <p className="service-menu__hint">Tocca + per aggiungere</p>
      </div>

      <div className="service-menu__filters">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className="filter-chip"
            aria-pressed={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.shortName.toUpperCase()}
          </button>
        ))}
      </div>

      <ul className="service-menu__list">
        {visibleCategories.map((category) =>
          category.services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              selected={selectedIds.includes(service.id)}
              onToggle={onToggle}
            />
          )),
        )}
      </ul>
    </section>
  )
}

export default ServiceMenu
