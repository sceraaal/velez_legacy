import { useEffect, useState } from 'react'

// Un "router" minimo, scritto da noi: decide quale pagina mostrare in base
// all'indirizzo (es. "/" = sito, "/area-clienti" = area clienti).
// Il browser NON ricarica la pagina: cambiamo solo l'indirizzo in alto con
// history.pushState e React mostra l'altra pagina. I tasti "indietro" e
// "avanti" del browser funzionano grazie all'evento "popstate".
//
// Il componente <Link> (src/components/Link.jsx) usa navigate.
// Se un giorno le pagine diventano molte, si può passare a React Router.
//
// Online: Cloudflare Pages, se nel sito non c'è un file 404.html, risponde a
// qualsiasi indirizzo con index.html, quindi anche aprire direttamente
// /area-clienti funziona. In locale lo fa già Vite.

// Gli indirizzi delle pagine, in un posto solo
export const ROUTES = {
  home: '/',
  account: '/area-clienti',
}

// Avvisa tutti i componenti che usano usePath che l'indirizzo è cambiato
const CHANGE_EVENT = 'velez:navigate'

export function navigate(path) {
  if (path === window.location.pathname) return
  window.history.pushState(null, '', path)
  window.dispatchEvent(new Event(CHANGE_EVENT))
  // Una pagina nuova si apre dall'inizio, non a metà
  window.scrollTo(0, 0)
}

// Hook: restituisce l'indirizzo attuale e si aggiorna quando cambia
export function usePath() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const update = () => setPath(window.location.pathname)
    window.addEventListener('popstate', update)
    window.addEventListener(CHANGE_EVENT, update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(CHANGE_EVENT, update)
    }
  }, [])

  return path
}
