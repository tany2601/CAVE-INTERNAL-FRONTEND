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

// Installed iOS apps can report a layout viewport a few dozen pixels shorter than the screen, which
// leaves a black strip under the app. When that happens, size the app to the real screen height.
const fitInstalledScreen = () => {
  const root = document.documentElement
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  const portrait = window.innerHeight >= window.innerWidth
  // iOS reports screen.width/height in portrait terms whatever the orientation.
  const long = Math.max(screen.width, screen.height)
  const short = Math.min(screen.width, screen.height)
  const fullWidth = Math.abs(window.innerWidth - (portrait ? short : long)) <= 1
  const gap = (portrait ? long : short) - window.innerHeight
  // Only when the width is the full screen (not Split View) and the shortfall is a safe-area-sized gap.
  if (standalone && fullWidth && gap > 4 && gap <= 100) {
    root.style.setProperty('--app-h', `${portrait ? long : short}px`)
  } else {
    root.style.removeProperty('--app-h')
  }
}
fitInstalledScreen()
window.addEventListener('resize', fitInstalledScreen)
window.addEventListener('orientationchange', () => window.setTimeout(fitInstalledScreen, 250))
