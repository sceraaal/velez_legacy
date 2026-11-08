// Calcolo degli orari liberi. Le regole sono quelle di docs/regole-progetto.md
// e sono le STESSE che controlla la funzione check_booking_slot nel database
// (migrazione 7):
// se ne cambia una, va cambiata in tutti e due i posti.
//
// Qui non c'è nulla di React: solo funzioni che ricevono dati e restituiscono
// risultati. Così si possono provare e capire da sole.

export const OPENING = {
  days: [2, 3, 4, 5, 6], // martedì–sabato (1 = lunedì ... 7 = domenica)
  openMinutes: 8 * 60, // 8:00, in minuti dalla mezzanotte
  closeMinutes: 20 * 60, // 20:00
  slotStep: 30, // un appuntamento può iniziare ogni 30 minuti
  minNoticeMinutes: 60, // almeno 1 ora prima
  maxDaysAhead: 30, // al massimo 30 giorni prima
}

const TIME_ZONE = 'Europe/Rome'

// Arrotonda una durata alla mezz'ora successiva: 50 → 60, 45 → 60, 30 → 30
export function roundUpToSlot(minutes) {
  return Math.ceil(minutes / OPENING.slotStep) * OPENING.slotStep
}

// --- Fuso orario ------------------------------------------------------------
// Il telefono del cliente potrebbe essere impostato su un altro fuso orario
// (per esempio in vacanza): gli orari del salone li ragioniamo sempre in ora
// italiana. Intl.DateTimeFormat è uno strumento del browser che sa convertire.

const romeParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// Da un istante (Date) a { day: '2026-11-11', minutes: 540 } in ora italiana
function toRome(date) {
  const parts = Object.fromEntries(romeParts.formatToParts(date).map((p) => [p.type, p.value]))
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

// Da giorno + minuti in ora italiana a un istante (Date).
// Partiamo facendo finta che sia UTC, poi correggiamo della differenza con
// l'Italia (1 ora d'inverno, 2 d'estate).
export function fromRome(day, minutes) {
  const [y, m, d] = day.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60)
  const shown = toRome(new Date(guess))
  const [sy, sm, sd] = shown.day.split('-').map(Number)
  const shownAsUtc = Date.UTC(sy, sm - 1, sd, Math.floor(shown.minutes / 60), shown.minutes % 60)
  return new Date(guess - (shownAsUtc - guess))
}

// Giorno della settimana (1 = lunedì ... 7 = domenica) di una data 'AAAA-MM-GG'
export function weekday(day) {
  const [y, m, d] = day.split('-').map(Number)
  const sunday0 = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return sunday0 === 0 ? 7 : sunday0
}

// Aggiunge n giorni a una data 'AAAA-MM-GG'
export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

// Oggi, in Italia
export function todayInRome(now = new Date()) {
  return toRome(now).day
}

// "9:30" a partire dai minuti dalla mezzanotte
export function formatTime(minutes) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`
}

const dayFormatter = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: TIME_ZONE,
})

// Un istante scritto per il cliente: "mercoledì 11 novembre, ore 10:00"
export function formatDateTime(date) {
  return `${dayFormatter.format(date)}, ore ${formatTime(toRome(date).minutes)}`
}

// --- Orari liberi -------------------------------------------------------------

// Gli orari di inizio possibili per un giorno, per un appuntamento che occupa
// slotMinutes (già arrotondati). busy = periodi occupati, come li restituisce
// get_busy_periods: [{ from: Date, to: Date }].
// Restituisce i minuti dalla mezzanotte: [480, 510, ...] = 8:00, 8:30...
export function getFreeSlots(day, slotMinutes, busy, now = new Date()) {
  if (!OPENING.days.includes(weekday(day))) return []

  const earliest = now.getTime() + OPENING.minNoticeMinutes * 60_000
  const latest = now.getTime() + OPENING.maxDaysAhead * 24 * 60 * 60_000
  const slots = []

  for (
    let start = OPENING.openMinutes;
    start + slotMinutes <= OPENING.closeMinutes;
    start += OPENING.slotStep
  ) {
    const from = fromRome(day, start).getTime()
    const to = from + slotMinutes * 60_000
    if (from < earliest || from > latest) continue
    // Due intervalli si sovrappongono se uno inizia prima che l'altro finisca
    const overlaps = busy.some((b) => from < b.to.getTime() && to > b.from.getTime())
    if (!overlaps) slots.push(start)
  }
  return slots
}

// I giorni da mostrare nel calendario: da oggi a oggi + 30
export function getBookingWindow(now = new Date()) {
  const first = todayInRome(now)
  return { first, last: addDays(first, OPENING.maxDaysAhead) }
}
