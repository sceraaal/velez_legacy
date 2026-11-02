import Hero from './components/Hero.jsx'
import PriceList from './components/PriceList.jsx'
import Footer from './components/Footer.jsx'

// La pagina principale: parte alta con il logo, listino e fondo pagina.
// Al passo 4 aggiungeremo la pagina di prenotazione (scelta di giorno e ora).

function App() {
  return (
    <>
      <main>
        <Hero />
        <PriceList />
      </main>
      <Footer />
    </>
  )
}

export default App
