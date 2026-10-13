import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './dashboard-v2.css'
import { installHaptics } from './lib/haptics'

installHaptics()
try {
  // Leftovers from the removed layout-test panel.
  localStorage.removeItem('cave-fix')
  localStorage.removeItem('cave-viewport')
} catch {
  // ignore
}

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

// Home-indicator padding for installed iOS apps (see --sab in index.css): iPhones with a notch
// reserve 34px, iPads 20px. Android and browsers keep env(safe-area-inset-bottom).
{
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  if (ios && standalone) {
    const long = Math.max(screen.width, screen.height)
    const tablet = Math.min(screen.width, screen.height) >= 700
    document.documentElement.style.setProperty('--sab', tablet ? '20px' : long >= 812 ? '34px' : '0px')
  }
}
