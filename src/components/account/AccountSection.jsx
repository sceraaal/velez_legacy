import { useEffect, useRef, useState } from 'react'
import BaroqueFrame from '../BaroqueFrame.jsx'
import AccountPanel from './AccountPanel.jsx'
import ForgotPasswordForm from './ForgotPasswordForm.jsx'
import LoginForm from './LoginForm.jsx'
import NewPasswordForm from './NewPasswordForm.jsx'
import RegisterForm from './RegisterForm.jsx'
// Le caselle e i bottoni hanno lo stesso stile del modulo di prenotazione
import '../booking/Booking.css'
import './Account.css'

// Sezione "Area clienti". Mostra una cosa sola alla volta:
// 1. il cliente arriva dal link "nuova password" → modulo nuova password
// 2. ha fatto il login                          → il Suo account
// 3. non ha fatto il login                      → Accedi / Registrati
//    (con "password dimenticata" dentro Accedi)
//
// "auth" arriva da App, che lo prende da useAuth: così anche il link in alto
// alla pagina sa se il cliente è dentro.

function AccountSection({ auth }) {
  const { session, loading, recovering, endRecovery } = auth
  // Quale modulo mostrare a chi non è dentro: 'login', 'register' o 'forgot'
  const [mode, setMode] = useState('login')
  // Messaggio di conferma da mostrare sopra il modulo (es. "controlli l'email")
  const [notice, setNotice] = useState(null)
  // Messaggio per chi è già dentro (es. "password salvata"): separato da
  // notice, così il messaggio della registrazione non resta dopo l'accesso
  const [panelNotice, setPanelNotice] = useState(null)
  const sectionRef = useRef(null)

  // Chi arriva dal link dell'email per la nuova password viene portato qui
  useEffect(() => {
    if (recovering) sectionRef.current?.scrollIntoView()
  }, [recovering])

  function switchTo(nextMode) {
    setMode(nextMode)
    setNotice(null)
  }

  let content
  if (loading) {
    content = <p className="booking__message">Caricamento…</p>
  } else if (recovering) {
    content = (
      <NewPasswordForm
        onDone={() => {
          endRecovery()
          setPanelNotice('La nuova password è stata salvata.')
        }}
      />
    )
  } else if (session) {
    content = <AccountPanel user={session.user} notice={panelNotice} />
  } else {
    content = (
      <>
        {/* Le due "linguette" per passare da Accedi a Registrati */}
        {mode !== 'forgot' && (
          <div className="account__tabs">
            <button
              type="button"
              className="account__tab"
              aria-pressed={mode === 'login'}
              onClick={() => switchTo('login')}
            >
              Accedi
            </button>
            <button
              type="button"
              className="account__tab"
              aria-pressed={mode === 'register'}
              onClick={() => switchTo('register')}
            >
              Registrati
            </button>
          </div>
        )}

        {notice && (
          <p className="account__notice" role="status">
            {notice}
          </p>
        )}

        {mode === 'login' && <LoginForm onForgotPassword={() => switchTo('forgot')} />}

        {mode === 'register' && (
          <RegisterForm
            onDone={(email) => {
              setMode('login')
              setNotice(
                `Le abbiamo inviato un'email a ${email}. Tocchi il link per confermare l'indirizzo: poi potrà accedere.`,
              )
            }}
          />
        )}

        {mode === 'forgot' && (
          <ForgotPasswordForm
            onBack={() => switchTo('login')}
            onDone={(email) => {
              setMode('login')
              setNotice(
                `Se ${email} è registrata, riceverà un'email con il link per scegliere una nuova password.`,
              )
            }}
          />
        )}
      </>
    )
  }

  return (
    <section id="account" className="booking" ref={sectionRef} aria-labelledby="account-titolo">
      <h2 id="account-titolo" className="booking__title">
        Area clienti
      </h2>
      <p className="booking__subtitle">Il Suo account Velez Legacy</p>
      <BaroqueFrame className="booking__frame">{content}</BaroqueFrame>
    </section>
  )
}

export default AccountSection
