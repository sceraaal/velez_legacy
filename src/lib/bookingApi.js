import { supabase } from './supabase.js'

// Chiede al database quali periodi sono occupati tra due istanti.
// La funzione get_busy_periods (migrazione 3) restituisce solo orari:
// nessun nome o dato dei clienti arriva mai nel sito.
// rpc = "Remote Procedure Call", cioè "chiama una funzione del database".
export async function fetchBusyPeriods(from, to) {
  if (!supabase) {
    throw new Error('Mancano VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY in .env.local')
  }

  const { data, error } = await supabase.rpc('get_busy_periods', {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  })
  if (error) throw error

  // Trasformiamo le date da testo a oggetti Date, più comodi per i calcoli
  return data.map((period) => ({ from: new Date(period.busy_from), to: new Date(period.busy_to) }))
}

// Errore "parlante" da mostrare al cliente.
// slotTaken = true quando l'orario è stato preso da qualcun altro nel frattempo:
// in quel caso il sito ricarica gli orari occupati.
export class BookingError extends Error {
  constructor(message, { slotTaken = false } = {}) {
    super(message)
    this.slotTaken = slotTaken
  }
}

// Salva la prenotazione chiamando la funzione create_booking del database
// (migrazione 6). Il cliente non lo mandiamo noi: il database lo prende dal
// login, così nessuno può prenotare a nome di un altro.
// Tutte le regole (orari, giorni, sovrapposizioni) le controlla il database:
// il sito non può aggirarle. Restituisce il riepilogo per la conferma.
export async function createBooking({ serviceIds, startsAt }) {
  if (!supabase) {
    throw new BookingError('La prenotazione non è disponibile al momento. La preghiamo di riprovare più tardi.')
  }

  const { data, error } = await supabase.rpc('create_booking', {
    p_service_ids: serviceIds,
    p_starts_at: startsAt.toISOString(),
  })

  if (error) {
    // P0001 è il codice degli errori scritti da noi nella funzione
    // ("raise exception ..."): il messaggio è già in italiano, con il Lei.
    if (error.code === 'P0001') {
      throw new BookingError(error.message, { slotTaken: error.message.includes('orario non è') })
    }
    // Qualsiasi altro problema (rete, database fermo...): messaggio generico.
    console.error('Prenotazione non riuscita:', error)
    throw new BookingError('Non siamo riusciti a salvare la prenotazione. La preghiamo di riprovare.')
  }

  return {
    id: data.id,
    startsAt: new Date(data.starts_at),
    endsAt: new Date(data.ends_at),
    totalPrice: Number(data.total_price),
    fromPrice: data.from_price,
    firstName: data.first_name,
  }
}

// --- I miei appuntamenti (migrazione 7) ---------------------------------------

// Trasforma un errore del database in un BookingError con un messaggio adatto
// al cliente (vedi createBooking qui sopra per la spiegazione di P0001).
function toBookingError(error, fallback) {
  if (error.code === 'P0001') {
    return new BookingError(error.message, { slotTaken: error.message.includes('orario non è') })
  }
  console.error(fallback, error)
  return new BookingError(fallback)
}

// Le prenotazioni confermate del cliente che ha fatto l'accesso, dalla più
// vecchia alla più nuova. Il database restituisce solo le sue.
export async function fetchMyBookings() {
  const { data, error } = await supabase.rpc('get_my_bookings')
  if (error) throw toBookingError(error, 'Non siamo riusciti a caricare i Suoi appuntamenti.')
  return data.map((row) => ({
    id: row.id,
    startsAt: new Date(row.starts_at),
    endsAt: new Date(row.ends_at),
    serviceNames: row.service_names,
    totalPrice: Number(row.total_price),
    fromPrice: row.from_price,
    totalMinutes: row.total_minutes,
  }))
}

// Disdice un appuntamento (fino a 1 ora prima: lo controlla il database)
export async function cancelBooking(bookingId) {
  const { error } = await supabase.rpc('cancel_booking', { p_booking_id: bookingId })
  if (error) throw toBookingError(error, 'Non siamo riusciti a disdire. La preghiamo di riprovare.')
}

// Sposta un appuntamento a un nuovo orario, con gli stessi servizi
export async function rescheduleBooking(bookingId, startsAt) {
  const { error } = await supabase.rpc('reschedule_booking', {
    p_booking_id: bookingId,
    p_starts_at: startsAt.toISOString(),
  })
  if (error) throw toBookingError(error, 'Non siamo riusciti a spostare. La preghiamo di riprovare.')
}
