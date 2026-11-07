import { useState } from 'react'
import { signUp } from '../../lib/auth.js'
import { MIN_PASSWORD_LENGTH, validateRegistration } from '../../lib/customer.js'
import TextField from './TextField.jsx'

// Registrazione: i dati del cliente, la password e il consenso.
// Dopo l'invio Supabase manda un'email con il link di conferma: finché il
// cliente non lo apre, non può entrare (così nessuno si registra con l'email
// di un altro). onDone avvisa AccountSection, che mostra il messaggio.

const EMPTY = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
  privacyAccepted: false,
}

const FIELDS = [
  { name: 'firstName', label: 'Nome', type: 'text', autoComplete: 'given-name' },
  { name: 'lastName', label: 'Cognome', type: 'text', autoComplete: 'family-name' },
  { name: 'phone', label: 'Telefono', type: 'tel', autoComplete: 'tel' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  // new-password: il telefono propone di generare e salvare una password sicura
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'new-password',
    hint: `Almeno ${MIN_PASSWORD_LENGTH} caratteri.`,
  },
]

function RegisterForm({ onDone }) {
  const [customer, setCustomer] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)

  function update(name, value) {
    setCustomer((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined, form: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateRegistration(customer)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSending(true)
    try {
      await signUp(customer)
      onDone(customer.email.trim())
    } catch (error) {
      setErrors({ form: error.message })
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset className="booking-step" disabled={sending}>
        <legend className="booking-step__title">Registrati</legend>

        {FIELDS.map((field) => (
          <TextField
            key={field.name}
            id={`registrazione-${field.name}`}
            label={field.label}
            type={field.type}
            autoComplete={field.autoComplete}
            hint={field.hint}
            value={customer[field.name]}
            error={errors[field.name]}
            onChange={(value) => update(field.name, value)}
          />
        ))}

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

        {errors.form && (
          <p className="customer-form__error" role="alert">
            {errors.form}
          </p>
        )}
        <button type="submit" className="customer-form__submit">
          {sending ? 'Invio in corso…' : 'Crea il mio account'}
        </button>
      </fieldset>
    </form>
  )
}

export default RegisterForm
