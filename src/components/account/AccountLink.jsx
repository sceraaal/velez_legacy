import { ROUTES } from '../../lib/router.js'
import Link from '../Link.jsx'
import './Account.css'

// Piccolo collegamento in alto a destra, sopra la cornice del logo.
// Apre la pagina "Area clienti". Finché non sappiamo se il cliente è dentro
// (loading) non mostra nulla, così la scritta non cambia sotto gli occhi.

function AccountLink({ session, loading }) {
  if (loading) return null
  return (
    <nav className="account-link" aria-label="Area clienti">
      <Link className="account-link__anchor" to={ROUTES.account}>
        {session ? 'Il mio account' : 'Accedi'}
      </Link>
    </nav>
  )
}

export default AccountLink
