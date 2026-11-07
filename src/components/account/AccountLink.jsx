import './Account.css'

// Piccolo collegamento in alto a destra, sopra la cornice del logo.
// Porta alla sezione "Area clienti" più in basso nella stessa pagina.
// Finché non sappiamo se il cliente è dentro (loading) non mostra nulla,
// così la scritta non cambia sotto gli occhi.

function AccountLink({ session, loading }) {
  if (loading) return null
  return (
    <nav className="account-link" aria-label="Area clienti">
      <a className="account-link__anchor" href="#account">
        {session ? 'Il mio account' : 'Accedi'}
      </a>
    </nav>
  )
}

export default AccountLink
