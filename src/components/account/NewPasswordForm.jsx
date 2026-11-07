import { useState } from 'react'
import { updatePassword } from '../../lib/auth.js'
import { MIN_PASSWORD_LENGTH, validatePassword } from '../../lib/customer.js'
import TextField from './TextField.jsx'

// Si vede solo quando il cliente arriva dal link "nuova password" dell'email.
// In quel momento Supabase lo ha già fatto entrare: basta salvare la password.

function NewPasswordForm({ onDone }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validatePassword(password)
    setError(found)
    if (found) return

    setSending(true)
    try {
      await updatePassword(password)
      onDone()
    } catch (failure) {
      setError(failure.message)
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset className="booking-step" disabled={sending}>
        <legend className="booking-step__title">Nuova password</legend>
        <TextField
          id="nuova-password"
          label="Nuova password"
          type="password"
          autoComplete="new-password"
          hint={`Almeno ${MIN_PASSWORD_LENGTH} caratteri.`}
          value={password}
          error={error}
          onChange={setPassword}
        />
        <button type="submit" className="customer-form__submit">
          {sending ? 'Salvataggio…' : 'Salva la password'}
        </button>
      </fieldset>
    </form>
  )
}

export default NewPasswordForm
