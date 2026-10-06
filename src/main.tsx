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

// iOS 18 home-screen apps can end up with a layout viewport shorter than the screen (a dark strip at
// the bottom, at launch or after the keyboard has been used). WebKit only re-measures it when the
// full-height element is re-laid out, so when the app is shorter than the screen we flip #root's
// display to force that, then check again. Android and browsers never trigger this.
const healViewport = () => {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  if (!standalone || !/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)) return
  const portrait = window.innerHeight >= window.innerWidth
  const full = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height)
  const fullWidth = Math.abs(window.innerWidth - (portrait ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height))) <= 1
  if (!fullWidth || full - window.innerHeight <= 4) return
  const root = document.getElementById('root')
  if (!root) return
  root.style.display = 'none'
  void root.offsetHeight // forces a synchronous reflow
  root.style.display = ''
}
const scheduleHeal = (...delays: number[]) => delays.forEach((d) => window.setTimeout(healViewport, d))
scheduleHeal(0, 150, 600, 1500)
window.addEventListener('resize', () => scheduleHeal(50, 300))
window.addEventListener('orientationchange', () => scheduleHeal(300, 900))
window.addEventListener('focusout', () => scheduleHeal(140, 500))
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') scheduleHeal(0, 300)
})
