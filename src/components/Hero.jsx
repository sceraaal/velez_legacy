import BaroqueFrame from './BaroqueFrame.jsx'
import Ornament from './Ornament.jsx'
import logo from '../assets/logo-velez-legacy.webp'
import './Hero.css'

// La parte alta della pagina: il logo di Nicolas dentro una cornice barocca,
// la frase di presentazione, il bottone Prenota e gli orari.
// Il logo sta dentro <h1>: per Google e per i lettori di schermo il titolo della
// pagina è il testo alternativo del logo, "Velez Legacy Barber".

function Hero() {
  return (
    <BaroqueFrame as="section" className="hero">
      <h1 className="hero__title">
        <img className="hero__logo" src={logo} alt="Velez Legacy Barber" width="240" height="240" />
      </h1>
      <Ornament className="hero__ornament" />
      <p className="hero__tagline">
        L'arte del barbiere,
        <br />
        con la cura di una sartoria.
      </p>
      {/* Porta alla sezione di prenotazione, più in basso nella stessa pagina */}
      <a className="hero__cta" href="#prenota">
        PRENOTA
      </a>
      <p className="hero__hours">Martedì – Sabato · 8:00 – 20:00</p>
    </BaroqueFrame>
  )
}

export default Hero
