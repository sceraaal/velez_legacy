import { useState } from 'react'
import { sendPasswordReset } from '../../lib/auth.js'
import { validateEmail } from '../../lib/customer.js'
import TextField from './TextField.jsx'

// Password dimenticata: il cliente scrive l'email e riceve un link.
// Toccandolo torna sul sito e vede NewPasswordForm.

function ForgotPasswordForm({ onDone, onBack }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateEmail(email)
    setError(found)
    if (found) return

    setSending(true)
    try {
      await sendPasswordReset(email)
      onDone(email.trim())
    } catch (failure) {
      setError(failure.message)
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset className="booking-step" disabled={sending}>
        <legend className="booking-step__title">Password dimenticata</legend>
        <p className="account__text">
          Scriva l'email con cui si è registrato: Le invieremo un link per scegliere una nuova
          password.
        </p>
        <TextField
          id="recupero-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          error={error}
          onChange={setEmail}
        />
        <button type="submit" className="customer-form__submit">
          {sending ? 'Invio in corso…' : 'Invia il link'}
        </button>
        <button type="button" className="account__link" onClick={onBack}>
          Torna all'accesso
        </button>
      </fieldset>
    </form>
  )
}

export default ForgotPasswordForm
