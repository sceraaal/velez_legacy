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
