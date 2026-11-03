// Controlli sui dati del cliente, fatti nel sito PRIMA di inviarli.
//
// Sono gli stessi controlli della funzione create_booking nel database
// (migrazione 3). Il database li rifà comunque: quelli nel sito servono solo
// a dare subito un messaggio chiaro al cliente, senza aspettare la risposta.
// Se cambi una regola qui, cambiala anche nel database (con una nuova migrazione).

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const PHONE_PATTERN = /^\+?[0-9 ]+$/ // un "+" facoltativo all'inizio, poi cifre e spazi

// Riceve i dati del modulo e restituisce gli errori, campo per campo.
// Esempio: { email: "L'indirizzo email non sembra valido." }
// Se l'oggetto è vuoto, è tutto a posto.
export function validateCustomer(customer) {
  const errors = {}
  const firstName = customer.firstName.trim()
  const lastName = customer.lastName.trim()
  const phone = customer.phone.trim()
  const email = customer.email.trim()
  const phoneDigits = phone.replace(/[^0-9]/g, '')

  if (firstName === '') errors.firstName = 'Inserisca il nome.'
  else if (firstName.length > 60) errors.firstName = 'Il nome è troppo lungo.'

  if (lastName === '') errors.lastName = 'Inserisca il cognome.'
  else if (lastName.length > 60) errors.lastName = 'Il cognome è troppo lungo.'

  if (phone === '') errors.phone = 'Inserisca il numero di telefono.'
  else if (!PHONE_PATTERN.test(phone) || phoneDigits.length < 9 || phoneDigits.length > 15) {
    errors.phone = 'Il numero di telefono non sembra valido.'
  }

  if (email === '') errors.email = "Inserisca l'indirizzo email."
  else if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    errors.email = "L'indirizzo email non sembra valido."
  }

  if (!customer.privacyAccepted) {
    errors.privacyAccepted = "Per prenotare deve accettare l'informativa sulla privacy."
  }

  return errors
}
