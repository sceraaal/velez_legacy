import { serviceCategories } from '../data/services.js'
import { formatDuration, formatPrice } from '../utils/format.js'
import BaroqueFrame from './BaroqueFrame.jsx'
import './PriceList.css'

// Il listino, impaginato come una carta d'altri tempi: per ogni sezione un titolo
// tra due filetti, poi le righe "nome ...... prezzo" con la durata sotto.
// Tutto dentro una cornice barocca, come la parte alta della pagina.

function PriceList() {
  return (
    <section id="listino" className="price-list" aria-labelledby="listino-titolo">
      <h2 id="listino-titolo" className="price-list__title">
        Il Listino
      </h2>
      <p className="price-list__subtitle">Pagamento in salone</p>

      <BaroqueFrame className="price-list__frame">
        {serviceCategories.map((category) => (
          <div key={category.id} className="price-list__group">
            <h3 className="price-list__group-title">{category.name}</h3>

            <ul className="price-list__items">
              {category.services.map((service) => (
                <li key={service.id} className="service">
                  <div className="service__line">
                    <span className="service__name">{service.name}</span>
                    {/* I puntini riempiono lo spazio tra nome e prezzo */}
                    <span className="service__dots" aria-hidden="true" />
                    <span className="service__price">{formatPrice(service.price, service.fromPrice)}</span>
                  </div>
                  <span className="service__detail">{formatDuration(service.duration)}</span>
                  {service.fromPrice && (
                    <span className="service__detail service__detail--note">
                      Prezzo finale dopo consulenza in salone
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </BaroqueFrame>
    </section>
  )
}

export default PriceList
