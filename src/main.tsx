import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { installHaptics } from './lib/haptics'

installHaptics()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Installable app: the service worker caches the app shell (never API data). Production builds only.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Not fatal: the app simply isn't installable/offline-capable in this browser.
    })
  })
}
