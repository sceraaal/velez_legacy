import { supabase } from './supabase.js'

// Legge il listino dal database: le categorie in ordine e, dentro ognuna,
// i servizi in ordine. I servizi disattivati (is_active = false) non arrivano
// proprio: li nasconde la regola RLS nel database.
// Restituisce le categorie con dentro i servizi, già con i nomi che usa
// PriceList.jsx (fromPrice, duration, description).
export async function fetchPriceList() {
  if (!supabase) {
    throw new Error('Mancano VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY in .env.local')
  }

  const { data, error } = await supabase
    .from('service_categories')
    // services(...) = "portami anche i servizi collegati a ogni categoria"
    .select('id, name, services (id, name, description, price, from_price, duration_minutes, position)')
    .order('position')
    .order('position', { referencedTable: 'services' })

  if (error) throw error

  // Nel database i nomi sono in stile SQL (from_price), nel codice in stile
  // JavaScript (fromPrice): qui li traduciamo.
  return data.map((category) => ({
    id: category.id,
    name: category.name,
    services: category.services.map((service) => ({
      id: service.id,
      name: service.name,
      // null se il servizio non ha descrizione (migrazione 9)
      description: service.description,
      price: Number(service.price),
      fromPrice: service.from_price,
      duration: service.duration_minutes,
    })),
  }))
}
