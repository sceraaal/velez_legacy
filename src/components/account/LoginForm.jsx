import { useState } from 'react'
import { signIn } from '../../lib/auth.js'
import { validateEmail } from '../../lib/customer.js'
import TextField from './TextField.jsx'

// Accesso con email e password. Se va bene, non serve fare altro: useAuth
// riceve la nuova sessione e AccountSection mostra "Il Suo account".

function LoginForm({ onForgotPassword }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const found = {}
    const emailError = validateEmail(email)
    if (emailError) found.email = emailError
    if (password === '') found.password = 'Inserisca la password.'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSending(true)
    try {
      await signIn({ email, password })
    } catch (error) {
      setErrors({ form: error.message })
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset className="booking-step" disabled={sending}>
        <legend className="booking-step__title">Accedi</legend>
        <TextField
          id="accesso-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          error={errors.email}
          onChange={setEmail}
        />
        <TextField
          id="accesso-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={setPassword}
        />
        {errors.form && (
          <p className="customer-form__error" role="alert">
            {errors.form}
          </p>
        )}
        <button type="submit" className="customer-form__submit">
          {sending ? 'Accesso in corso…' : 'Accedi'}
        </button>
        <button type="button" className="account__link" onClick={onForgotPassword}>
          Ha dimenticato la password?
        </button>
      </fieldset>
    </form>
  )
}

export default LoginForm
