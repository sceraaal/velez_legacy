import Ornament from './Ornament.jsx'
import './Header.css'

// La testata della pagina: il nome dentro una cornice barocca.
// È l'unico elemento vistoso del listino; tutto il resto resta sobrio.

function Header() {
  return (
    <header className="header">
      <div className="cartouche">
        <Ornament />
        <h1 className="header__title">Velez Legacy Barber</h1>
        <Ornament flip />
      </div>
      <p className="header__hours">Dal martedì al sabato, 8:00 – 20:00</p>
    </header>
  )
}

export default Header
