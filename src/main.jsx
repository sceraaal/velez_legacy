import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Caratteri salvati dentro il progetto (pacchetti @fontsource), non caricati da
// Google: così il telefono del cliente non invia il suo indirizzo IP a Google.
import '@fontsource/cinzel/400.css'
import '@fontsource/cinzel/600.css'
import '@fontsource/lato/400.css'
import '@fontsource/lato/400-italic.css'
import '@fontsource/lato/700.css'

import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
