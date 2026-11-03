import Hero from './components/Hero.jsx'
import PriceList from './components/PriceList.jsx'
import BookingSection from './components/booking/BookingSection.jsx'
import Footer from './components/Footer.jsx'
import TestBanner from './components/TestBanner.jsx'

// La pagina principale: parte alta con il logo, listino, prenotazione e fondo pagina.

function App() {
  return (
    <>
      <TestBanner />
      <main>
        <Hero />
        <PriceList />
        <BookingSection />
      </main>
      <Footer />
    </>
  )
}

export default App
