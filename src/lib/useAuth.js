import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

// Un "hook" di React: una funzione che un componente chiama per avere un dato
// che si aggiorna da solo. Questo dice in ogni momento chi ha fatto il login.
//
// Restituisce:
// - session: null se nessuno è dentro, altrimenti la sessione di Supabase
//   (session.user.id è il codice del cliente, session.user.email la sua email)
// - loading: true finché non sappiamo ancora se c'è una sessione salvata
// - recovering: true quando il cliente arriva dal link "nuova password"
// - endRecovery: da chiamare quando la nuova password è salvata
//
// Supabase ricorda il login nel browser (localStorage), quindi chi torna sul
// sito il giorno dopo è ancora dentro, finché non preme "Esci".
export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    if (!supabase) return

    // onAuthStateChange avvisa a ogni cambiamento: accesso, uscita, rinnovo
    // della sessione, arrivo dal link per la nuova password.
    // Avvisa subito anche all'apertura ("INITIAL_SESSION").
    // Attenzione: qui dentro non chiamare altre funzioni di Supabase con
    // await, la documentazione avverte che il sito si può bloccare.
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      setLoading(false)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'SIGNED_OUT') setRecovering(false)
    })

    // Quando il componente sparisce smettiamo di ascoltare
    return () => data.subscription.unsubscribe()
  }, [])

  return { session, loading, recovering, endRecovery: () => setRecovering(false) }
}
