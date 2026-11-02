import BaroqueFrame from './BaroqueFrame.jsx'
import Ornament from './Ornament.jsx'
import logo from '../assets/logo-barocco-800.webp'
import './Hero.css'

// La parte alta della pagina: il logo barocco di Nicolas (con colonne, statue e
// drappi) dentro una cornice barocca, la frase di presentazione, il bottone
// Prenota e gli orari.
// Il logo sta dentro <h1>: per Google e per i lettori di schermo il titolo della
// pagina è il testo alternativo del logo, "Velez Legacy Barber".

function Hero() {
  return (
    <BaroqueFrame as="section" className="hero">
      <h1 className="hero__title">
        {/* width e height dicono al browser le proporzioni prima che l'immagine
            arrivi, così la pagina non "salta" mentre si carica */}
        <img className="hero__logo" src={logo} alt="Velez Legacy Barber" width="800" height="800" />
      </h1>
      <Ornament className="hero__ornament" />
      <p className="hero__tagline">
        L'arte del barbiere,
        <br />
        con la cura di una sartoria.
      </p>
      {/* Per ora porta al listino: al passo 4 aprirà la prenotazione */}
      <a className="hero__cta" href="#listino">
        PRENOTA
      </a>
      <p className="hero__hours">Martedì – Sabato · 8:00 – 20:00</p>
    </BaroqueFrame>
  )
}

export default Hero
