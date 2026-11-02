import Ornament from './Ornament.jsx'
import './Footer.css'

// Il fondo pagina: nome, indirizzo del salone e orari.
// Il link "Accedi o registrati" arriverà con la Fase 1.

function Footer() {
  return (
    <footer className="footer">
      <Ornament className="footer__ornament" />
      <p className="footer__name">VELEZ LEGACY BARBER</p>
      <address className="footer__line footer__address">
        Via Mario Alfani 84
        <br />
        84098 Pontecagnano Faiano (SA)
      </address>
      <p className="footer__line">Martedì – Sabato · 8:00 – 20:00</p>
    </footer>
  )
}

export default Footer
