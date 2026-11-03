import { createClient } from '@supabase/supabase-js'

// Il "client" Supabase: l'oggetto che usiamo per chiedere i dati al database.
// Indirizzo e chiave arrivano dal file .env.local (che Git ignora).
// Vite rende disponibili nel sito solo le variabili che iniziano con VITE_.
// La chiave è quella PUBBLICA (sb_publishable_...): può stare nel sito, perché
// cosa si può leggere o scrivere lo decidono le regole RLS nel database.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Se manca .env.local non creiamo il client: la pagina mostrerà il messaggio
// di errore invece di diventare bianca.
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null
