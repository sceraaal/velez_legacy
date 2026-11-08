import Hero from './components/Hero.jsx'
import PriceList from './components/PriceList.jsx'
import BookingSection from './components/booking/BookingSection.jsx'
import AccountLink from './components/account/AccountLink.jsx'
import AccountPage from './components/account/AccountPage.jsx'
import Footer from './components/Footer.jsx'
import TestBanner from './components/TestBanner.jsx'
import { useAuth } from './lib/useAuth.js'
import { ROUTES, usePath } from './lib/router.js'

// Il sito ha due pagine (vedi src/lib/router.js):
// - "/"             link Accedi, logo, listino, prenotazione
// - "/area-clienti" accesso, registrazione e account del cliente
// useAuth sta qui, in alto, perché più parti del sito devono sapere se il
// cliente ha fatto il login (dal passo 2 anche la prenotazione).

function App() {
  const auth = useAuth()
  const path = usePath()

  // Chi arriva dal link "nuova password" dell'email atterra sull'indirizzo
  // principale del sito: gli mostriamo comunque l'area clienti, con il modulo.
  const showAccount = path === ROUTES.account || auth.recovering

  return (
    <>
      {/* Fascia "Versione di prova": compare su tutte e due le pagine */}
      <TestBanner />
      {showAccount ? (
        <AccountPage auth={auth} />
      ) : (
        <>
          <AccountLink session={auth.session} loading={auth.loading} />
          <main>
            <Hero />
            <PriceList />
            <BookingSection />
          </main>
        </>
      )}
      <Footer />
    </>
  )
}

export default App
