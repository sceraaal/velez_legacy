// Fregio barocco decorativo: due volute dorate ai lati di un piccolo rombo.
// È solo decorazione, quindi è nascosto ai lettori di schermo (aria-hidden).
// "flip" lo capovolge, per usarlo sotto il titolo come immagine speculare.

function Ornament({ flip = false }) {
  return (
    <svg
      className={flip ? 'ornament ornament--flip' : 'ornament'}
      viewBox="0 0 240 28"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        {/* voluta sinistra */}
        <path d="M110 14 H78 C66 14 62 5 52 5 C43 5 40 14 47 17 C53 19 56 11 50 10" />
        <path d="M78 14 C70 14 66 22 58 22" />
        {/* voluta destra: la stessa, specchiata */}
        <path d="M130 14 H162 C174 14 178 5 188 5 C197 5 200 14 193 17 C187 19 184 11 190 10" />
        <path d="M162 14 C170 14 174 22 182 22" />
      </g>
      {/* rombo centrale */}
      <path d="M120 7 L127 14 L120 21 L113 14 Z" fill="currentColor" />
    </svg>
  )
}

export default Ornament
