import { useEffect, useState } from 'react'
import { formatDateTime } from '../../lib/availability.js'
import { fetchCustomers } from '../../lib/staffApi.js'
import CustomerHistory from './CustomerHistory.jsx'

// Linguetta "Clienti": tutti i clienti in ordine di cognome, con una casella
// per cercare. Toccando un cliente si apre la sua scheda (CustomerHistory).

function CustomerList() {
  const [search, setSearch] = useState('')
  // Ultima risposta del database: { search, list } oppure { search, error }.
  // Ricordiamo la ricerca, così mentre si scrive non mostriamo risultati vecchi
  // come se fossero quelli nuovi.
  const [result, setResult] = useState(null)
  // Il cliente aperto (oppure null = elenco)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let ignore = false
    // Aspettiamo un attimo che si smetta di scrivere prima di chiedere al database
    const timer = setTimeout(() => {
      fetchCustomers(search)
        .then((list) => {
          if (!ignore) setResult({ search, list })
        })
        .catch((failure) => {
          if (!ignore) setResult({ search, error: failure.message })
        })
    }, 300)
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [search])

  if (selected) {
    return <CustomerHistory customer={selected} onBack={() => setSelected(null)} />
  }

  const current = result?.search === search ? result : null

  return (
    <div className="customers">
      <div className="customer-form__field">
        <label htmlFor="cerca-cliente" className="customer-form__label">
          Cerca per nome, cognome o telefono
        </label>
        <input
          id="cerca-cliente"
          className="customer-form__input"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {!current && <p className="booking__message">Caricamento…</p>}

      {current?.error && (
        <p className="customer-form__error" role="alert">
          {current.error}
        </p>
      )}

      {current?.list?.length === 0 && (
        <p className="booking__message">{search ? 'Nessun cliente trovato.' : 'Ancora nessun cliente.'}</p>
      )}

      {current?.list?.length > 0 && (
        <ul className="customers__list">
          {current.list.map((customer) => (
            <li key={`${customer.kind}-${customer.id}`}>
              <button type="button" className="customer-row" onClick={() => setSelected(customer)}>
                <span className="customer-row__name">
                  {customer.lastName} {customer.firstName}
                </span>
                <span className="customer-row__kind">{customer.kind === 'account' ? 'con account' : 'senza account'}</span>
                <span className="customer-row__meta">
                  {customer.visits === 1 ? '1 visita' : `${customer.visits} visite`}
                  {customer.nextVisit && ` · prossimo: ${formatDateTime(customer.nextVisit)}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default CustomerList
