import './TestBanner.css'

// Fascia "Versione di prova" in cima alla pagina.
// Compare solo se la variabile VITE_TEST_VERSION vale "true": la mettiamo
// nelle impostazioni di Cloudflare per il link di prova, non in .env.local.
// Quando il sito sarà quello vero, basta togliere la variabile.
const isTestVersion = import.meta.env.VITE_TEST_VERSION === 'true'

function TestBanner() {
  if (!isTestVersion) return null

  return (
    <p className="test-banner" role="note">
      <strong>Versione di prova.</strong> Per provare la prenotazione usi nomi, telefoni ed email
      di fantasia.
    </p>
  )
}

export default TestBanner
