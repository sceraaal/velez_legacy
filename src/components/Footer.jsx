import Ornament from './Ornament.jsx'
import './Footer.css'

// Il fondo pagina. L'indirizzo del salone andrà qui quando Nicolas ce lo conferma;
// il link "Accedi o registrati" arriverà con la Fase 1.

function Footer() {
  return (
    <footer className="footer">
      <Ornament className="footer__ornament" />
      <p className="footer__name">VELEZ LEGACY BARBER</p>
      <p className="footer__line">Martedì – Sabato · 8:00 – 20:00</p>
    </footer>
  )
}

export default Footer
