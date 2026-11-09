import { useEffect, useState } from 'react'
import { fetchPriceList } from '../lib/priceList.js'
import { formatDuration, formatPrice } from '../utils/format.js'
import BaroqueFrame from './BaroqueFrame.jsx'
import './PriceList.css'

// Il listino, impaginato come una carta d'altri tempi: per ogni sezione un titolo
// tra due filetti, poi le righe "nome ...... prezzo" con la durata sotto.
// Tutto dentro una cornice barocca, come la parte alta della pagina.
// I dati arrivano dal database Supabase (vedi src/lib/priceList.js).

function PriceList() {
  // Lo "stato" del listino: 'loading' mentre aspettiamo il database,
  // 'error' se qualcosa va storto, 'ready' quando i dati sono arrivati.
  const [status, setStatus] = useState('loading')
  const [categories, setCategories] = useState([])

  // useEffect: "fai questa cosa quando il componente compare nella pagina".
  // Le parentesi quadre vuote alla fine dicono: una volta sola.
  useEffect(() => {
    // Se il componente sparisce prima che arrivi la risposta, la ignoriamo
    let ignore = false

    fetchPriceList()
      .then((data) => {
        if (ignore) return
        setCategories(data)
        setStatus('ready')
      })
      .catch((error) => {
        if (ignore) return
        // Il dettaglio tecnico va nella console del browser (F12), per noi;
        // al cliente mostriamo un messaggio gentile.
        console.error('Listino non caricato:', error)
        setStatus('error')
      })

    return () => {
      ignore = true
    }
  }, [])

  return (
    <section id="listino" className="price-list" aria-labelledby="listino-titolo">
      <h2 id="listino-titolo" className="price-list__title">
        Il Listino
      </h2>
      <p className="price-list__subtitle">Pagamento in salone</p>

      <BaroqueFrame className="price-list__frame">
        {status === 'loading' && <p className="price-list__message">Caricamento del listino…</p>}

        {status === 'error' && (
          <p className="price-list__message" role="alert">
            Il listino non è disponibile al momento.
            <br />
            La preghiamo di riprovare più tardi.
          </p>
        )}

        {categories.map((category) => (
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
                  {/* La descrizione c'è solo per alcuni servizi: se manca non mostriamo nulla */}
                  {service.description && <p className="service__description">{service.description}</p>}
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
