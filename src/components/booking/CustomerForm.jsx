import { useState } from 'react'
import { validateCustomer } from '../../lib/customer.js'

// Passo 4: i dati del cliente e il bottone di conferma.
// Il modulo tiene in memoria quello che il cliente scrive; quando preme
// "Conferma" controlla i dati e, se sono a posto, li passa al genitore
// (BookingSection) con onSubmit. È il genitore a inviarli al database.

const EMPTY_CUSTOMER = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  privacyAccepted: false,
}

// Le caselle di testo del modulo. autoComplete dice al telefono quale dato
// suggerire (il nome, il numero...), così il cliente scrive meno.
const FIELDS = [
  { name: 'firstName', label: 'Nome', type: 'text', autoComplete: 'given-name' },
  { name: 'lastName', label: 'Cognome', type: 'text', autoComplete: 'family-name' },
  { name: 'phone', label: 'Telefono', type: 'tel', autoComplete: 'tel' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
]

function CustomerForm({ hidden, sending, onSubmit }) {
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [errors, setErrors] = useState({})

  // Aggiorna un campo e toglie il suo messaggio di errore, se c'era
  function update(name, value) {
    setCustomer((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  function handleSubmit(event) {
    // Senza questa riga il browser ricaricherebbe la pagina all'invio
    event.preventDefault()
    const found = validateCustomer(customer)
    setErrors(found)
    if (Object.keys(found).length === 0) onSubmit(customer)
  }

  // noValidate: usiamo i nostri controlli e messaggi in italiano, non quelli del browser
  return (
    <form className="customer-form" id="prenota-dati" hidden={hidden} onSubmit={handleSubmit} noValidate>
      <fieldset className="booking-step" disabled={sending}>
        <legend className="booking-step__title">I Suoi dati</legend>

        {FIELDS.map((field) => {
          const error = errors[field.name]
          const id = `cliente-${field.name}`
          return (
            <div key={field.name} className="customer-form__field">
              <label htmlFor={id} className="customer-form__label">
                {field.label}
              </label>
              <input
                id={id}
                className="customer-form__input"
                type={field.type}
                autoComplete={field.autoComplete}
                value={customer[field.name]}
                onChange={(event) => update(field.name, event.target.value)}
                // aria-*: i lettori di schermo annunciano che il campo ha un errore e quale
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-errore` : undefined}
              />
              {error && (
                <p id={`${id}-errore`} className="customer-form__error">
                  {error}
                </p>
              )}
            </div>
          )
        })}

        <label className="customer-form__privacy">
          <input
            type="checkbox"
            className="service-picker__checkbox"
            checked={customer.privacyAccepted}
            onChange={(event) => update('privacyAccepted', event.target.checked)}
            aria-invalid={errors.privacyAccepted ? true : undefined}
          />
          {/* TODO: collegare qui il testo dell'informativa quando sarà pronto */}
          <span>Ho letto e accetto l'informativa sulla privacy</span>
        </label>
        {errors.privacyAccepted && <p className="customer-form__error">{errors.privacyAccepted}</p>}

        <button type="submit" className="customer-form__submit">
          {sending ? 'Invio in corso…' : 'Conferma la prenotazione'}
        </button>
        <p className="customer-form__note">Il pagamento si effettua in salone.</p>
      </fieldset>
    </form>
  )
}

export default CustomerForm
