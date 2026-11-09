// Le icone dei pulsanti social, disegnate a linee sottili come il fregio
// (Ornament.jsx), così restano nello stile barocco invece di usare i loghi
// colorati. Prendono il colore dal testo (currentColor): lo decide Footer.css.
// aria-hidden: il nome del social lo legge già il lettore di schermo dal pulsante.

const icons = {
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: <path d="M15.5 3.5h-2a3.5 3.5 0 0 0-3.5 3.5v13.5M7 11h8" />,
  whatsapp: (
    <>
      {/* il fumetto con la codina in basso a sinistra */}
      <path d="M3.5 20.5l1.4-4.2a8.5 8.5 0 1 1 3 2.9z" />
      {/* la cornetta del telefono */}
      <path
        d="M9 8.2c.3-.5.8-.5 1.1 0l.7 1.4c.2.4 0 .7-.3 1l-.4.4a5 5 0 0 0 2.9 2.9l.4-.4c.3-.3.6-.5 1-.3l1.4.7c.5.3.5.8 0 1.1-.7.6-1.5.9-2.4.6A8 8 0 0 1 8.4 10.6c-.3-.9 0-1.7.6-2.4z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
}

function SocialIcon({ name }) {
  return (
    <svg
      className="social-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {icons[name]}
    </svg>
  )
}

export default SocialIcon
