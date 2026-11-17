// Edge Function "booking-email" (Fase 1, passo 6b)
//
// Gira sui server di Supabase, non nel browser. La chiama il database (trigger
// della migrazione 14) ogni volta che una prenotazione di un cliente con
// account nasce, viene disdetta o spostata. Lei legge i dati, scrive l'email
// e la spedisce con Resend.
//
// Cosa riceve dal database (JSON):
//   { booking_id, event: 'created' | 'cancelled' | 'moved', old_starts_at, by_staff }
//
// Segreti (pannello Supabase → Edge Functions → Secrets, MAI nel repository):
//   RESEND_API_KEY        la chiave di Resend "booking-email" (solo invio)
//   BOOKING_EMAIL_SECRET  la stessa parola segreta salvata nel Vault del database
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY li mette Supabase da solo.
//
// Se qualcosa si rompe: pannello Supabase → Edge Functions → booking-email →
// Logs. Ogni errore è scritto lì con console.error.

import { createClient } from 'npm:@supabase/supabase-js@2'

// --- Impostazioni -----------------------------------------------------------

const SITE_URL = 'https://velezlegacybarber.it'
const FROM = 'Velez Legacy Barber <prenotazioni@velezlegacybarber.it>'
// Le risposte dei clienti arrivano a Nicolas, e a lui arrivano gli avvisi
// (stesso indirizzo di src/lib/contacts.js)
const NICOLAS_EMAIL = 'nicovelez97@gmail.com'
const PHONE = '+39 352 098 5635'
const ADDRESS = 'Via Mario Alfani 84, 84098 Pontecagnano Faiano (SA)'

// Colori come in src/index.css: nelle email vanno scritti a mano perché i
// programmi di posta non capiscono le variabili CSS.
const COLOR = {
  black: '#0B0B0B',
  surface: '#17140F',
  goldDark: '#8C6D2C',
  gold: '#C9A54C',
  ivory: '#F3EAD8',
  muted: '#A89F8E',
}
const SERIF = "'EB Garamond',Georgia,'Times New Roman',serif"
const DISPLAY = "Cinzel,Georgia,'Times New Roman',serif"

// --- Punto di ingresso ------------------------------------------------------

Deno.serve(async (request) => {
  // Solo il nostro database conosce la parola segreta: chiunque altro è fuori.
  const secret = Deno.env.get('BOOKING_EMAIL_SECRET')
  if (!secret || request.headers.get('Authorization') !== `Bearer ${secret}`) {
    return new Response('Non autorizzato', { status: 401 })
  }

  try {
    const { booking_id, event, old_starts_at, by_staff } = await request.json()

    const booking = await loadBooking(booking_id)
    if (!booking) {
      console.error('Prenotazione non trovata o senza account:', booking_id)
      return new Response('Prenotazione non trovata', { status: 404 })
    }

    // Fino a due email: al cliente e, se l'ha fatto il cliente, a Nicolas
    const emails = []
    const customerEmail = buildCustomerEmail(booking, event, old_starts_at, by_staff)
    if (customerEmail) {
      emails.push({ to: booking.email, replyTo: NICOLAS_EMAIL, ...customerEmail })
    }
    // Quello che fa Nicolas dall'agenda lo sa già: a lui niente avviso
    const nicolasEmail = by_staff ? null : buildNicolasEmail(booking, event, old_starts_at)
    if (nicolasEmail) {
      // Se Nicolas risponde all'avviso, scrive direttamente al cliente
      emails.push({ to: NICOLAS_EMAIL, replyTo: booking.email, ...nicolasEmail })
    }

    // allSettled: se una delle due fallisce, l'altra parte comunque
    const results = await Promise.allSettled(emails.map(sendEmail))
    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
      failed.forEach((r) => console.error('Email prenotazione non inviata:', r.reason))
      return new Response('Errore', { status: 500 })
    }
    return new Response(`Inviate: ${emails.length}`, { status: 200 })
  } catch (error) {
    console.error('Email prenotazione non inviata:', error)
    return new Response('Errore', { status: 500 })
  }
})

// --- Lettura dei dati -------------------------------------------------------

// Usa la chiave service_role, l'unica che può chiamare get_booking_email_data
// (migrazione 14). Questa chiave resta sui server di Supabase.
async function loadBooking(bookingId) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  )
  const { data, error } = await supabase.rpc('get_booking_email_data', {
    p_booking_id: bookingId,
  })
  if (error) throw error
  return data
}

// --- Spedizione con Resend --------------------------------------------------

async function sendEmail({ to, replyTo, subject, html, text }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, reply_to: replyTo, subject, html, text }),
  })
  if (!response.ok) {
    // Resend spiega il problema nel corpo della risposta (es. chiave sbagliata)
    throw new Error(`Resend ha risposto ${response.status}: ${await response.text()}`)
  }
}

// --- Testi delle email al cliente -------------------------------------------

// Ogni evento ha oggetto, frase iniziale e (a volte) una nota finale.
// Restituisce { subject, html, text } oppure null.
function buildCustomerEmail(booking, event, oldStartsAt, byStaff) {
  const when = formatDateTime(booking.starts_at)
  const manageLink = `${SITE_URL}/area-clienti`
  let subject, intro, note, showManageLink

  if (event === 'created' && !byStaff) {
    subject = 'Appuntamento confermato'
    intro = `il Suo appuntamento è confermato per <strong>${when}</strong>.`
    showManageLink = true
  } else if (event === 'created' && byStaff) {
    subject = 'Appuntamento fissato'
    intro = `Nicolas ha fissato per Lei un appuntamento per <strong>${when}</strong>.`
    showManageLink = true
  } else if (event === 'moved') {
    subject = 'Appuntamento spostato'
    intro = `il Suo appuntamento del ${formatDateTime(oldStartsAt)} è stato spostato a <strong>${when}</strong>.`
    showManageLink = true
  } else if (event === 'cancelled' && !byStaff) {
    subject = 'Disdetta registrata'
    intro = `abbiamo registrato la disdetta del Suo appuntamento del <strong>${when}</strong>.`
    note = 'Quando vuole, può prenotare un nuovo appuntamento dal sito.'
  } else if (event === 'cancelled' && byStaff) {
    subject = 'Appuntamento annullato'
    intro = `siamo spiacenti: il Suo appuntamento del <strong>${when}</strong> è stato annullato dal salone.`
    note = `Per fissarne un altro può prenotare dal sito o chiamare il ${PHONE}.`
  } else {
    return null
  }

  const services = booking.services ?? []
  const anyFromPrice = services.some((s) => s.from_price)
  const total = services.reduce((sum, s) => sum + Number(s.price), 0)

  const serviceRows = services
    .map(
      (s) => `<tr>
        <td style="padding:4px 0;color:${COLOR.ivory};">${escapeHtml(s.name)}</td>
        <td align="right" style="padding:4px 0;color:${COLOR.ivory};white-space:nowrap;">${formatPrice(s.price, s.from_price)}</td>
      </tr>`,
    )
    .join('')

  const body = `
    <p style="margin:0 0 16px;">Gentile ${escapeHtml(booking.first_name)},</p>
    <p style="margin:0 0 16px;">${intro}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-top:1px solid ${COLOR.goldDark};border-bottom:1px solid ${COLOR.goldDark};padding:8px 0;font-family:${SERIF};font-size:16px;">
      ${serviceRows}
      <tr>
        <td style="padding:8px 0 4px;color:${COLOR.gold};">Totale</td>
        <td align="right" style="padding:8px 0 4px;color:${COLOR.gold};white-space:nowrap;">${formatPrice(total, anyFromPrice)}</td>
      </tr>
    </table>
    ${anyFromPrice ? `<p style="margin:0 0 16px;font-size:14px;color:${COLOR.muted};">Per i servizi tecnici il prezzo finale si decide in salone, dopo una breve consulenza.</p>` : ''}
    ${note ? `<p style="margin:0 0 16px;">${note}</p>` : ''}
    ${showManageLink ? `<p style="margin:0 0 16px;">Il pagamento si effettua in salone.<br>${ADDRESS}</p>` : ''}`

  const button = showManageLink
    ? { label: 'I MIEI APPUNTAMENTI', url: manageLink }
    : { label: 'PRENOTA', url: SITE_URL }

  const footer = showManageLink
    ? "Può disdire o spostare l'appuntamento dall'Area clienti fino a un'ora prima. Dopo, contatti il salone."
    : `Per qualsiasi domanda può rispondere a questa email o chiamare il ${PHONE}.`

  return {
    subject: `${subject} – Velez Legacy Barber`,
    html: layout({ body, button, footer }),
    text: plainText({ booking, intro, note, total, anyFromPrice, button, footer, showManageLink }),
  }
}

// --- Avviso a Nicolas (Fase 1, passo 6c) ------------------------------------

// Breve e pratico: chi, quando, cosa. Solo per le azioni dei clienti.
// Restituisce { subject, html, text } oppure null.
function buildNicolasEmail(booking, event, oldStartsAt) {
  const name = `${booking.first_name} ${booking.last_name}`
  const when = formatDateTime(booking.starts_at)
  let subject, intro

  if (event === 'created') {
    subject = `Nuova prenotazione: ${name}`
    intro = `<strong>${escapeHtml(name)}</strong> ha prenotato per <strong>${when}</strong>.`
  } else if (event === 'moved') {
    subject = `Appuntamento spostato: ${name}`
    intro = `<strong>${escapeHtml(name)}</strong> ha spostato l'appuntamento del ${formatDateTime(oldStartsAt)} a <strong>${when}</strong>. Il vecchio orario è di nuovo libero.`
  } else if (event === 'cancelled') {
    subject = `Disdetta: ${name}`
    intro = `<strong>${escapeHtml(name)}</strong> ha disdetto l'appuntamento del <strong>${when}</strong>. L'orario è di nuovo libero.`
  } else {
    return null
  }

  const services = booking.services ?? []
  const anyFromPrice = services.some((s) => s.from_price)
  const total = services.reduce((sum, s) => sum + Number(s.price), 0)
  const serviceList = services.map((s) => escapeHtml(s.name)).join(' · ')

  const body = `
    <p style="margin:0 0 16px;">${intro}</p>
    <p style="margin:0 0 8px;">${serviceList} – ${formatPrice(total, anyFromPrice)}</p>
    <p style="margin:0 0 16px;color:${COLOR.muted};font-size:15px;">
      Tel. ${escapeHtml(booking.phone)}<br>${escapeHtml(booking.email)}
    </p>`

  const button = { label: 'APRI L\'AGENDA', url: `${SITE_URL}/agenda` }
  const footer = 'Per scrivere al cliente basta rispondere a questa email.'
  const text = [
    stripTags(intro),
    '',
    `${services.map((s) => s.name).join(' · ')} – ${formatPrice(total, anyFromPrice)}`,
    `Tel. ${booking.phone}`,
    booking.email,
    '',
    button.url,
  ].join('\n')

  return { subject, html: layout({ body, button, footer }), text }
}

// La cornice comune: stessi colori e stesso logo delle email del login
// (supabase/templates/).
function layout({ body, button, footer }) {
  return `<!doctype html>
<html lang="it"><body style="margin:0;background:${COLOR.black};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.black};padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:${COLOR.surface};border:1px solid ${COLOR.goldDark};">
      <tr><td align="center" style="padding:32px 24px 8px;">
        <img src="${SITE_URL}/email/logo.png" width="96" height="96" alt="Velez Legacy Barber" style="display:block;border:0;border-radius:50%;">
      </td></tr>
      <tr><td align="center" style="padding:8px 24px;font-family:${DISPLAY};font-size:20px;letter-spacing:2px;color:${COLOR.gold};">
        VELEZ LEGACY BARBER
      </td></tr>
      <tr><td style="padding:16px 32px;font-family:${SERIF};font-size:17px;line-height:1.5;color:${COLOR.ivory};">
        ${body}
      </td></tr>
      <tr><td align="center" style="padding:0 32px 24px;">
        <a href="${button.url}" style="display:inline-block;padding:12px 28px;background:${COLOR.gold};color:${COLOR.black};font-family:${DISPLAY};font-size:15px;letter-spacing:1px;text-decoration:none;border-radius:2px;">${button.label}</a>
      </td></tr>
      <tr><td style="padding:0 32px 32px;font-family:${SERIF};font-size:14px;line-height:1.5;color:${COLOR.muted};">
        ${footer}
      </td></tr>
    </table>
    <p style="margin:16px 0 0;font-family:Georgia,serif;font-size:12px;color:${COLOR.muted};">${ADDRESS} · <span style="white-space:nowrap;">${PHONE}</span></p>
  </td></tr>
</table>
</body></html>`
}

// La versione solo testo, per i programmi di posta che non mostrano l'HTML
// (e aiuta a non finire nello spam).
function plainText({ booking, intro, note, total, anyFromPrice, button, footer, showManageLink }) {
  const lines = [
    `Gentile ${booking.first_name},`,
    '',
    stripTags(intro),
    '',
    ...(booking.services ?? []).map((s) => `- ${s.name}: ${formatPrice(s.price, s.from_price)}`),
    `Totale: ${formatPrice(total, anyFromPrice)}`,
    '',
  ]
  if (note) lines.push(note, '')
  if (showManageLink) lines.push('Il pagamento si effettua in salone.', ADDRESS, '')
  lines.push(button.url, '', footer, '', 'Velez Legacy Barber')
  return lines.join('\n')
}

// --- Piccole funzioni di formato --------------------------------------------

// "2026-11-20T09:00:00+00:00" → "venerdì 20 novembre 2026 alle 10:00"
// Sempre in ora italiana, qualunque sia il fuso del server.
function formatDateTime(isoString) {
  const date = new Date(isoString)
  const day = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
  const time = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
  return `${day} alle ${time}`
}

// Come formatPrice di src/utils/format.js: 18 → "€18", 18.5 → "€18,50"
function formatPrice(price, fromPrice = false) {
  const value = Number(price)
  const amount = Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',')
  return fromPrice ? `da €${amount}` : `€${amount}`
}

// Nomi scritti dai clienti: niente HTML dentro l'email
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '')
}
