import { useEffect, useState } from 'react'
import { fetchMyProfile, signOut } from '../../lib/auth.js'
import { loadPendingBooking } from '../../lib/pendingBooking.js'
import { ROUTES } from '../../lib/router.js'
import { amIStaff } from '../../lib/staffApi.js'
import Link from '../Link.jsx'
import MyBookings from './MyBookings.jsx'

// "Il Suo account": i dati di chi ha fatto il login e il bottone Esci.
// Sotto i dati, per i clienti, "I miei appuntamenti" (MyBookings).
// Se l'account non ha dati del cliente ed è di Nicolas (tabella staff,
// migrazione 11), mostriamo il bottone per la sua agenda e il bottone Esci.
// (Il passaggio automatico all'agenda avviene solo subito dopo l'accesso, in
// AccountSection: se lo facessimo qui, Nicolas non potrebbe mai fermarsi in
// questa pagina.)

function AccountPanel({ user, notice }) {
  // undefined = sto ancora leggendo, null = profilo assente, oggetto = profilo
  const [profile, setProfile] = useState(undefined)
  const [error, setError] = useState(null)
  const [leaving, setLeaving] = useState(false)
  // C'è una prenotazione lasciata a metà? (letta una volta, all'apertura)
  const [hasPending] = useState(() => loadPendingBooking() !== null)

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

  // Account senza profilo cliente: è Nicolas? { userId, staff }, come in AgendaPage
  const [staffCheck, setStaffCheck] = useState(null)
  const noProfile = profile === null
  useEffect(() => {
    if (!noProfile) return
    let ignore = false
    amIStaff().then((staff) => {
      if (!ignore) setStaffCheck({ userId: user.id, staff })
    })
    return () => {
      ignore = true
    }
  }, [noProfile, user.id])
  const isStaff = noProfile && staffCheck?.userId === user.id && staffCheck.staff

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

      {profile && hasPending && (
        <Link className="customer-form__submit account__return" to={`${ROUTES.home}#prenota-conferma`}>
          Torni alla Sua prenotazione
        </Link>
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

      {isStaff && (
        <>
          <p className="account__text">Accesso effettuato come barbiere ({user.email}).</p>
          <Link className="customer-form__submit account__return" to={ROUTES.agenda}>
            Apri l'agenda
          </Link>
        </>
      )}

      {/* Succede per gli account creati a mano dal pannello Supabase */}
      {profile === null && staffCheck?.userId === user.id && !isStaff && (
        <p className="account__text">
          Accesso effettuato come {user.email}. Per questo account non ci sono dati del cliente.
        </p>
      )}

      {error && (
        <p className="customer-form__error" role="alert">
          {error}
        </p>
      )}

      {profile && <MyBookings />}

      <button type="button" className="account__secondary" onClick={handleSignOut} disabled={leaving}>
        {leaving ? 'Uscita…' : 'Esci'}
      </button>
    </div>
  )
}

export default AccountPanel
