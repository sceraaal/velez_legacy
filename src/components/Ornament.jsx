// Fregio barocco orizzontale: due linee, due foglie dorate e un rombo al centro.
// È solo decorazione: aria-hidden lo nasconde ai lettori di schermo.

function Ornament({ className = '' }) {
  return (
    <svg className={`ornament ${className}`} viewBox="0 0 220 24" aria-hidden="true" focusable="false">
      <path d="M0 12H78M142 12H220" stroke="var(--color-gold-dark)" />
      <path
        d="M78 12c10-10 20-10 26 0-6 10-16 10-26 0zM142 12c-10-10-20-10-26 0 6 10 16 10 26 0z"
        fill="none"
        stroke="var(--color-gold)"
      />
      <path d="M110 3l7 9-7 9-7-9z" fill="var(--color-gold)" />
    </svg>
  )
}

export default Ornament
