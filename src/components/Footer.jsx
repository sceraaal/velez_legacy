import Ornament from './Ornament.jsx'
import SocialIcon from './SocialIcon.jsx'
import { contacts } from '../lib/contacts.js'
import './Footer.css'

// Il fondo pagina: nome, indirizzo del salone, orari, contatti e social.
// Il link all'area clienti sta in alto (AccountLink).
// Numeri e link non sono scritti qui ma in src/lib/contacts.js.

// I tre pulsanti social, nell'ordine in cui appaiono
const socialLinks = [
  { name: 'instagram', label: 'Instagram', href: contacts.instagram },
  { name: 'facebook', label: 'Facebook', href: contacts.facebook },
  { name: 'whatsapp', label: 'WhatsApp', href: contacts.whatsapp },
]

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

      <div className="footer__contacts">
        {/* tel: sul telefono apre direttamente la chiamata */}
        <a className="footer__contact" href={`tel:${contacts.phoneLink}`}>
          Tel. {contacts.phoneDisplay}
        </a>
        {/* L'email compare solo quando è stata scritta in contacts.js */}
        {contacts.email && (
          <a className="footer__contact" href={`mailto:${contacts.email}`}>
            {contacts.email}
          </a>
        )}
      </div>

      <ul className="footer__social">
        {socialLinks.map((link) => (
          <li key={link.name}>
            {/* target="_blank" apre il social in una nuova scheda (o nell'app),
                così il cliente non perde il sito; rel="noopener noreferrer" è
                una protezione standard per i link verso siti esterni */}
            <a
              className="footer__social-link"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.label} (si apre in una nuova scheda)`}
            >
              <span className="footer__social-circle">
                <SocialIcon name={link.name} />
              </span>
              <span className="footer__social-label">{link.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </footer>
  )
}

export default Footer
