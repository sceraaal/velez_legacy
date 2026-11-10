import { addDays, fromRome } from './availability.js'
import { supabase } from './supabase.js'

// Le chiamate al database per l'area riservata di Nicolas (migrazione 11).
// Il sito chiede, il database decide: se chi ha fatto l'accesso non è nella
// tabella "staff", get_agenda risponde con un errore e non esce nessun dato.

// "Chi ha fatto l'accesso è Nicolas?" → true o false
export async function amIStaff() {
  if (!supabase) return false
  const { data, error } = await supabase.rpc('am_i_staff')
  if (error) {
    console.error('Controllo staff non riuscito:', error)
    return false
  }
  return data === true
}

// Gli appuntamenti confermati di un giorno 'AAAA-MM-GG' (ora italiana),
// in ordine di ora.
export async function fetchAgenda(day) {
  const { data, error } = await supabase.rpc('get_agenda', {
    // Dalla mezzanotte del giorno alla mezzanotte del giorno dopo
    p_from: fromRome(day, 0).toISOString(),
    p_to: fromRome(addDays(day, 1), 0).toISOString(),
  })

  if (error) {
    // P0001 = errore scritto da noi nella funzione (es. "Pagina riservata.")
    if (error.code === 'P0001') throw new Error(error.message)
    console.error('Agenda non caricata:', error)
    throw new Error("Non siamo riusciti a caricare l'agenda. Riprova tra poco.")
  }

  return data.map((row) => ({
    id: row.id,
    startsAt: new Date(row.starts_at),
    endsAt: new Date(row.ends_at),
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email,
    serviceNames: row.service_names,
    totalPrice: Number(row.total_price),
    fromPrice: row.from_price,
    totalMinutes: row.total_minutes,
  }))
}

// --- Passo 5a: ferie, impegni e disdetta (migrazione 12) ---------------------

// Trasforma un errore del database in un Error con un messaggio da mostrare.
// P0001 = errore scritto da noi nella funzione, già in italiano.
function toStaffError(error, fallback) {
  if (error.code === 'P0001') return new Error(error.message)
  console.error(fallback, error)
  return new Error(fallback)
}

// I blocchi non ancora finiti, dal più vicino
export async function fetchBlockedPeriods() {
  const { data, error } = await supabase.rpc('get_blocked_periods')
  if (error) throw toStaffError(error, 'Non siamo riusciti a caricare i blocchi.')
  return data.map((row) => ({
    id: row.id,
    startsAt: new Date(row.starts_at),
    endsAt: new Date(row.ends_at),
    reason: row.reason,
  }))
}

// Salva un blocco. Se nel periodo ci sono appuntamenti il database rifiuta e
// il messaggio dice chi è prenotato.
export async function addBlockedPeriod({ startsAt, endsAt, reason }) {
  const { error } = await supabase.rpc('add_blocked_period', {
    p_starts_at: startsAt.toISOString(),
    p_ends_at: endsAt.toISOString(),
    p_reason: reason,
  })
  if (error) throw toStaffError(error, 'Non siamo riusciti a salvare il blocco. Riprova.')
}

export async function deleteBlockedPeriod(id) {
  const { error } = await supabase.rpc('delete_blocked_period', { p_id: id })
  if (error) throw toStaffError(error, 'Non siamo riusciti a togliere il blocco. Riprova.')
}

// Nicolas disdice un appuntamento (senza il limite di un'ora dei clienti)
export async function staffCancelBooking(bookingId) {
  const { error } = await supabase.rpc('staff_cancel_booking', { p_booking_id: bookingId })
  if (error) throw toStaffError(error, 'Non siamo riusciti a disdire. Riprova.')
}
