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


// Launch splash (markup lives in index.html): shown for 3.5 s when the app is opened fresh, skipped
// when the page is just reloaded inside a running session.
const splash = document.getElementById('splash')
if (splash) {
  let seen = false
  try {
    seen = sessionStorage.getItem('cave-splash') === '1'
    sessionStorage.setItem('cave-splash', '1')
  } catch {
    // ignore
  }
  const dismiss = () => {
    splash.classList.add('hide')
    window.setTimeout(() => splash.remove(), 500)
  }
  if (seen) splash.remove()
  else window.setTimeout(dismiss, 3500)
}
