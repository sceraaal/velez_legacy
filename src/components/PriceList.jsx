import { serviceCategories } from '../data/services.js'
import './PriceList.css'

// Il listino, impaginato come la carta di un ristorante:
// nome del servizio, una fila di puntini, il prezzo; la durata sotto.

function formatPrice(service) {
  // I servizi tecnici hanno un prezzo "a partire da"
  return service.fromPrice ? `da €${service.price}` : `€${service.price}`
}

function PriceList() {
  return (
    <div className="price-list">
      {serviceCategories.map((category) => (
        <section key={category.id} className="price-list__section" aria-labelledby={category.id}>
          <h2 id={category.id} className="price-list__title">
            {category.name}
          </h2>

          <ul className="price-list__items">
            {category.services.map((service) => (
              <li key={service.id} className="service">
                <div className="service__line">
                  <span className="service__name">{service.name}</span>
                  <span className="service__dots" aria-hidden="true" />
                  <span className="service__price">{formatPrice(service)}</span>
                </div>
                <span className="service__duration">{service.duration} min</span>
              </li>
            ))}
          </ul>

          {category.note && <p className="price-list__note">{category.note}</p>}
        </section>
      ))}
    </div>
  )
}

export default PriceList
