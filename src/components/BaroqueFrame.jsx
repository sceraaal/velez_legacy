import './BaroqueFrame.css'

// Cornice barocca riutilizzabile: un doppio filetto dorato con una voluta in
// ogni angolo. Si usa così: <BaroqueFrame> ...contenuto... </BaroqueFrame>
// "children" è tutto quello che metti tra il tag di apertura e quello di chiusura.

// Una sola voluta, disegnata per l'angolo in alto a sinistra.
// Gli altri tre angoli usano la stessa figura, specchiata con il CSS.
function Corner({ position }) {
  return (
    <svg
      className={`baroque-frame__corner baroque-frame__corner--${position}`}
      viewBox="0 0 56 56"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="var(--color-gold)" strokeWidth="1.2">
        <path d="M2 54V18C2 9 9 2 18 2h36" />
        <path d="M10 40c0-16 8-28 26-30" />
        <path d="M14 22c4 0 6-3 6-6s-3-5-5-3-1 5 2 5" />
      </g>
      <circle cx="6" cy="6" r="2.5" fill="var(--color-gold)" />
    </svg>
  )
}

function BaroqueFrame({ children, className = '', as: Tag = 'div', ...rest }) {
  return (
    <Tag className={`baroque-frame ${className}`} {...rest}>
      <Corner position="top-left" />
      <Corner position="top-right" />
      <Corner position="bottom-left" />
      <Corner position="bottom-right" />
      {children}
    </Tag>
  )
}

export default BaroqueFrame
