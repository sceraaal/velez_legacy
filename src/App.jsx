import Header from './components/Header.jsx'
import PriceList from './components/PriceList.jsx'

// La pagina principale: per ora testata e listino.
// Al passo 4 qui aggiungeremo il calendario delle prenotazioni.

function App() {
  return (
    <>
      <Header />
      <main>
        <PriceList />
      </main>
    </>
  )
}

export default App
