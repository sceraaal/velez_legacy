// La prenotazione "in sospeso": servizi, giorno e orario scelti da chi non ha
// ancora fatto l'accesso. La salviamo nel browser (localStorage) quando preme
// Accedi o Registrati, così dopo l'accesso, o dopo aver confermato l'email,
// ritrova tutto già scelto e deve solo premere Conferma.
//
// localStorage resta anche chiudendo il browser: per questo la scelta scade
// dopo un'ora, e la cancelliamo appena la prenotazione è confermata.
// Contiene solo codici dei servizi e orari, nessun dato personale.

const KEY = 'velez-prenotazione-in-sospeso'
const MAX_AGE_MS = 60 * 60 * 1000 // un'ora

// In alcuni browser (es. navigazione privata) localStorage può dare errore:
// in quel caso facciamo finta di niente, il cliente sceglierà di nuovo.
export function savePendingBooking({ serviceIds, day, slot }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ serviceIds, day, slot, savedAt: Date.now() }))
  } catch {
    // niente da fare
  }
}

// Restituisce { serviceIds, day, slot } oppure null se non c'è o è scaduta
export function loadPendingBooking() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (!saved || Date.now() - saved.savedAt > MAX_AGE_MS) return null
    return { serviceIds: saved.serviceIds, day: saved.day, slot: saved.slot }
  } catch {
    return null
  }
}

export function clearPendingBooking() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // niente da fare
  }
}
