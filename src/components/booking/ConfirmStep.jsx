import { useEffect, useState } from 'react'
import { fetchMyProfile } from '../../lib/auth.js'

// L'ultimo passo della prenotazione, dopo servizi, giorno e orario.
// - Chi non ha fatto l'accesso vede "Per prenotare acceda o si registri"
//   con i due bottoni: onLogin('login') o onLogin('register').
// - Chi è dentro vede "Prenota come Anna Rossi" e il bottone Conferma.
// Resta sempre "montato" e viene solo nascosto finché non c'è un orario
// (vedi BookingSection), come faceva il vecchio modulo dei dati.

function ConfirmStep({ hidden, session, authLoading, sending, onLogin, onConfirm }) {
  return (
    <div className="confirm-step" id="prenota-conferma" hidden={hidden}>
      <fieldset className="booking-step" disabled={sending}>
        <legend className="booking-step__title">Conferma</legend>
        {authLoading && <p className="booking__message">Caricamento…</p>}
        {!authLoading && !session && <LoginPrompt onLogin={onLogin} />}
        {!authLoading && session && (
          // key: se cambia l'utente, il componente riparte da zero
          <SignedInConfirm key={session.user.id} userId={session.user.id} sending={sending} onConfirm={onConfirm} />
        )}
      </fieldset>
    </div>
  )
}

function LoginPrompt({ onLogin }) {
  return (
    <>
      <p className="confirm-step__text">
        Per prenotare acceda al Suo account o si registri.
        <br />
        Le Sue scelte restano salvate.
      </p>
      <div className="confirm-step__buttons">
        <button type="button" className="customer-form__submit" onClick={() => onLogin('login')}>
          Accedi
        </button>
        <button type="button" className="confirm-step__secondary" onClick={() => onLogin('register')}>
          Registrati
        </button>
      </div>
    </>
  )
}

function SignedInConfirm({ userId, sending, onConfirm }) {
  // undefined = sto leggendo, null = nessun profilo cliente, oggetto = profilo
  const [profile, setProfile] = useState(undefined)

  useEffect(() => {
    let ignore = false
    fetchMyProfile(userId)
      .then((found) => {
        if (!ignore) setProfile(found)
      })
      .catch(() => {
        if (!ignore) setProfile(null)
      })
    return () => {
      ignore = true
    }
  }, [userId])

  if (profile === undefined) return <p className="booking__message">Caricamento…</p>

  // Per esempio l'account di Nicolas, creato dal pannello senza dati cliente
  if (profile === null) {
    return (
      <p className="confirm-step__text">
        Questo account non può prenotare. Acceda con un account cliente.
      </p>
    )
  }

  return (
    <>
      <p className="confirm-step__text">
        Prenota come{' '}
        <strong className="confirm-step__name">
          {profile.firstName} {profile.lastName}
        </strong>
      </p>
      <button type="button" className="customer-form__submit" onClick={onConfirm}>
        {sending ? 'Invio in corso…' : 'Conferma la prenotazione'}
      </button>
      <p className="customer-form__note">Il pagamento si effettua in salone.</p>
    </>
  )
}

export default ConfirmStep
