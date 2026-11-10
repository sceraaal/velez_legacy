import { useEffect, useState } from 'react'
import { signOut } from '../../lib/auth.js'
import { navigate, ROUTES } from '../../lib/router.js'
import { amIStaff } from '../../lib/staffApi.js'
import logo from '../../assets/logo-velez-legacy.webp'
import BaroqueFrame from '../BaroqueFrame.jsx'
import Link from '../Link.jsx'
import AgendaDay from './AgendaDay.jsx'
import '../booking/Booking.css'
import '../account/Account.css'
import './Agenda.css'

// La pagina /agenda, l'area riservata di Nicolas.
// Prima di mostrare qualcosa chiede al database "sei staff?" (am_i_staff).
// Anche se qualcuno aggirasse questo controllo nel sito, il database non gli
// darebbe comunque nessun appuntamento: la protezione vera sta lì.

function AgendaPage({ auth }) {
  const { session, loading } = auth
  // Risposta del database per un certo account: { userId, staff }.
  // Ricordiamo anche userId, così se cambia l'account la risposta vecchia
  // non vale più.
  const [check, setCheck] = useState(null)
  const [leaving, setLeaving] = useState(false)

  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    let ignore = false
    amIStaff().then((staff) => {
      if (!ignore) setCheck({ userId, staff })
    })
    return () => {
      ignore = true
    }
  }, [userId])

  // Esci: dopo l'uscita torniamo alla pagina iniziale del sito, così non
  // resta a schermo "Pagina riservata" (che sembrerebbe un errore).
  const [signOutError, setSignOutError] = useState(null)
  async function handleSignOut() {
    setLeaving(true)
    setSignOutError(null)
    try {
      await signOut()
      navigate(ROUTES.home)
    } catch (failure) {
      setSignOutError(failure.message)
    } finally {
      setLeaving(false)
    }
  }

  // undefined = non lo sappiamo ancora, true/false = risposta del database
  const isStaff = !session ? false : check?.userId === userId ? check.staff : undefined

  let content
  if (loading || isStaff === undefined) {
    content = <p className="booking__message">Caricamento…</p>
  } else if (!isStaff) {
    content = (
      <div className="agenda__denied">
        <h3 className="booking-step__title">Pagina riservata</h3>
        <p className="account__text">Questa pagina è solo per il barbiere.</p>
        {!session && (
          <Link className="customer-form__submit" to={ROUTES.account}>
            Accedi
          </Link>
        )}
      </div>
    )
  } else {
    content = (
      <>
        <AgendaDay />
        {signOutError && (
          <p className="customer-form__error" role="alert">
            {signOutError}
          </p>
        )}
        {/* Esci anche in fondo, ben visibile, come nell'area clienti */}
        <button type="button" className="account__secondary agenda__signout-bottom" onClick={handleSignOut} disabled={leaving}>
          {leaving ? 'Uscita…' : 'Esci'}
        </button>
      </>
    )
  }

  return (
    <>
      <title>Agenda – Velez Legacy Barber</title>
      <nav className="account-page__bar" aria-label="Navigazione">
        <Link className="account-link__anchor" to={ROUTES.home}>
          ← Torna al sito
        </Link>
        <Link to={ROUTES.home} className="account-page__logo-link">
          <img
            className="account-page__logo"
            src={logo}
            alt="Velez Legacy Barber – pagina iniziale"
            width="56"
            height="56"
          />
        </Link>
        {session && (
          <button type="button" className="agenda__signout" onClick={handleSignOut} disabled={leaving}>
            {leaving ? 'Uscita…' : 'Esci'}
          </button>
        )}
      </nav>
      <main>
        <section className="booking" aria-labelledby="agenda-titolo">
          <h2 id="agenda-titolo" className="booking__title">
            Agenda
          </h2>
          <p className="booking__subtitle">Area riservata</p>
          <BaroqueFrame className="booking__frame">{content}</BaroqueFrame>
        </section>
      </main>
    </>
  )
}

export default AgendaPage
