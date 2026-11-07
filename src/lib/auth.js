import { supabase } from './supabase.js'

// Tutto quello che riguarda l'account del cliente: registrazione, accesso,
// uscita, password dimenticata e lettura del profilo.
// Account e password li gestisce Supabase Auth: noi non vediamo e non salviamo
// mai le password, che Supabase conserva cifrate.

// Errore "parlante" da mostrare al cliente, già in italiano con il Lei
export class AuthError extends Error {}

// Supabase risponde con un codice per ogni problema: lo traduciamo.
// Elenco completo: https://supabase.com/docs/guides/auth/debugging/error-codes
const MESSAGES = {
  invalid_credentials: 'Email o password non corrette.',
  email_not_confirmed:
    "Deve prima confermare l'indirizzo email: apra il link che Le abbiamo inviato.",
  weak_password: 'La password è troppo semplice. Ne scelga una più lunga.',
  same_password: 'La nuova password deve essere diversa da quella attuale.',
  email_address_invalid: "L'indirizzo email non sembra valido.",
  over_email_send_rate_limit: 'Abbiamo inviato troppe email. Riprovi tra qualche minuto.',
  over_request_rate_limit: 'Troppi tentativi. Riprovi tra qualche minuto.',
}

function toAuthError(error) {
  if (MESSAGES[error.code]) return new AuthError(MESSAGES[error.code])
  // Qualsiasi altro problema (rete, database...): messaggio generico,
  // e il dettaglio nella console del browser per chi deve sistemarlo.
  console.error('Errore di accesso:', error)
  return new AuthError('Qualcosa non ha funzionato. La preghiamo di riprovare.')
}

function requireClient() {
  if (!supabase) {
    throw new AuthError("L'area clienti non è disponibile al momento. Riprovi più tardi.")
  }
  return supabase
}

// Dopo aver toccato il link nell'email (conferma o nuova password), il cliente
// torna a questa pagina. L'indirizzo va aggiunto nel pannello Supabase:
// Authentication → URL Configuration (vedi docs/database.md).
function returnAddress() {
  return window.location.origin
}

// Registrazione. Nome, cognome, telefono e consenso viaggiano nei "metadati"
// dell'account: il trigger della migrazione 4 li usa per creare il profilo.
export async function signUp({ email, password, firstName, lastName, phone, privacyAccepted }) {
  const { error } = await requireClient().auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: returnAddress(),
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        privacy_accepted: privacyAccepted,
      },
    },
  })
  // Nota: se l'email è già registrata Supabase NON dà errore, per non far
  // scoprire a un estraneo chi è cliente. Il sito mostra lo stesso messaggio
  // "controlli la Sua email" in entrambi i casi.
  if (error) throw toAuthError(error)
}

export async function signIn({ email, password }) {
  const { error } = await requireClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw toAuthError(error)
}

export async function signOut() {
  const { error } = await requireClient().auth.signOut()
  if (error) throw toAuthError(error)
}

// Invia l'email con il link per scegliere una nuova password.
// Anche qui, se l'email non esiste, Supabase non dà errore (stesso motivo).
export async function sendPasswordReset(email) {
  const { error } = await requireClient().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: returnAddress(),
  })
  if (error) throw toAuthError(error)
}

// Salva la nuova password, dopo che il cliente ha aperto il link dell'email
export async function updatePassword(password) {
  const { error } = await requireClient().auth.updateUser({ password })
  if (error) throw toAuthError(error)
}

// Legge il profilo di chi ha fatto il login. Le regole RLS fanno sì che il
// database restituisca solo la sua riga, anche se qualcuno chiedesse le altre.
// Restituisce null se il profilo non c'è (per esempio l'account di Nicolas).
export async function fetchMyProfile(userId) {
  const { data, error } = await requireClient()
    .from('customers')
    .select('first_name, last_name, phone')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw toAuthError(error)
  if (!data) return null
  return { firstName: data.first_name, lastName: data.last_name, phone: data.phone }
}
