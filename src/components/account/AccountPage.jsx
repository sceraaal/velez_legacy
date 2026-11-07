import { ROUTES } from '../../lib/router.js'
import Link from '../Link.jsx'
import logo from '../../assets/logo-velez-legacy.webp'
import AccountSection from './AccountSection.jsx'
import './Account.css'

// La pagina /area-clienti: in alto "Torna al sito" e il logo piccolo (che
// porta anche lui al sito), sotto la cornice dell'area clienti.
// <title> dentro un componente: React 19 lo sposta da solo nell'<head>, così
// la scheda del browser mostra "Area clienti – Velez Legacy Barber".

function AccountPage({ auth }) {
  return (
    <>
      <title>Area clienti – Velez Legacy Barber</title>
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
      </nav>
      <main>
        <AccountSection auth={auth} />
      </main>
    </>
  )
}

export default AccountPage
