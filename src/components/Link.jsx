import { navigate } from '../lib/router.js'

// Un link verso un'altra pagina del sito. È un vero <a href>, così funziona
// anche "apri in una nuova scheda"; il clic normale però lo gestiamo noi,
// senza ricaricare tutto il sito.
function Link({ to, children, ...rest }) {
  function handleClick(event) {
    // Ctrl/Cmd + clic o clic con la rotellina: lasciamo fare al browser
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(to)
  }
  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}

export default Link
