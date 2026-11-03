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
