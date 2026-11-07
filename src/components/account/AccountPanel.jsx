import { useEffect, useState } from 'react'
import { fetchMyProfile, signOut } from '../../lib/auth.js'

// "Il Suo account": i dati di chi ha fatto il login e il bottone Esci.
// Nel passo 3 qui sotto arriveranno "I miei appuntamenti".

function AccountPanel({ user, notice }) {
  // undefined = sto ancora leggendo, null = profilo assente, oggetto = profilo
  const [profile, setProfile] = useState(undefined)
  const [error, setError] = useState(null)
  const [leaving, setLeaving] = useState(false)

  // Legge il profilo ogni volta che cambia l'utente. "ignore" evita di
  // mostrare la risposta di una richiesta vecchia se l'utente è cambiato.
  useEffect(() => {
    let ignore = false
    fetchMyProfile(user.id)
      .then((found) => {
        if (!ignore) setProfile(found)
      })
      .catch((failure) => {
        if (!ignore) setError(failure.message)
      })
    return () => {
      ignore = true
    }
  }, [user.id])

  async function handleSignOut() {
    setLeaving(true)
    try {
      await signOut()
    } catch (failure) {
      setError(failure.message)
      setLeaving(false)
    }
  }

  return (
    <div className="account__panel">
      <h3 className="booking-step__title">Il Suo account</h3>

      {notice && (
        <p className="account__notice" role="status">
          {notice}
        </p>
      )}

      {profile === undefined && !error && <p className="booking__message">Caricamento…</p>}

      {profile && (
        <dl className="account__details">
          <dt>Nome</dt>
          <dd>
            {profile.firstName} {profile.lastName}
          </dd>
          <dt>Telefono</dt>
          <dd>{profile.phone}</dd>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </dl>
      )}

      {/* Succede per gli account creati a mano dal pannello Supabase */}
      {profile === null && (
        <p className="account__text">
          Accesso effettuato come {user.email}. Per questo account non ci sono dati del cliente.
        </p>
      )}

      {error && (
        <p className="customer-form__error" role="alert">
          {error}
        </p>
      )}

      <button type="button" className="account__secondary" onClick={handleSignOut} disabled={leaving}>
        {leaving ? 'Uscita…' : 'Esci'}
      </button>
    </div>
  )
}

export default AccountPanel
