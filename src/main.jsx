import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Caratteri salvati dentro il progetto (pacchetti @fontsource), non caricati da
// Google: così il telefono del cliente non invia il suo indirizzo IP a Google.
import '@fontsource/cormorant-garamond/300.css'
import '@fontsource/cormorant-garamond/300-italic.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/600.css'

import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
