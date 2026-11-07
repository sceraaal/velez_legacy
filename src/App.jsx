import Hero from './components/Hero.jsx'
import PriceList from './components/PriceList.jsx'
import BookingSection from './components/booking/BookingSection.jsx'
import AccountLink from './components/account/AccountLink.jsx'
import AccountSection from './components/account/AccountSection.jsx'
import Footer from './components/Footer.jsx'
import { useAuth } from './lib/useAuth.js'

// La pagina principale: link all'area clienti, parte alta con il logo,
// listino, prenotazione, area clienti e fondo pagina.
// useAuth sta qui, in alto, perché più parti della pagina devono sapere se il
// cliente ha fatto il login (dal passo 2 anche la prenotazione).

function App() {
  const auth = useAuth()
  return (
    <>
      <AccountLink session={auth.session} loading={auth.loading} />
      <main>
        <Hero />
        <PriceList />
        <BookingSection />
        <AccountSection auth={auth} />
      </main>
      <Footer />
    </>
  )
}

export default App
