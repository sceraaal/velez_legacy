import { useState } from 'react'
import { serviceCategories } from './data/services.js'
import Hero from './components/Hero.jsx'
import ServiceMenu from './components/ServiceMenu.jsx'
import BookingBar from './components/BookingBar.jsx'
import Footer from './components/Footer.jsx'

// Tutti i servizi in un'unica lista, comoda per cercarli per id
const allServices = serviceCategories.flatMap((category) => category.services)

// La pagina principale.
// I servizi scelti stanno QUI, e non nel listino, perché servono a due
// componenti: al listino (per mostrare la spunta) e alla barra (per il totale).

function App() {
  const [selectedIds, setSelectedIds] = useState([])

  // Aggiunge il servizio se non c'è, lo toglie se c'è già
  function toggleService(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    )
  }

  const selectedServices = allServices.filter((service) => selectedIds.includes(service.id))

  return (
    <>
      <main>
        <Hero />
        <ServiceMenu selectedIds={selectedIds} onToggle={toggleService} />
      </main>
      <Footer />
      <BookingBar selectedServices={selectedServices} />
    </>
  )
}

export default App
