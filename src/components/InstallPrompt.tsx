import { useEffect, useState } from "react"
import { Download, Share } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)

/** "Install app" button (Android / desktop Chrome) or the Add-to-Home-Screen hint (iOS Safari). */
export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (installed || isStandalone()) return null

  if (event) {
    return (
      <button
        className="mx-auto flex h-10 items-center gap-2 border border-[var(--border)] px-4 text-[10px] tracking-[0.25em] uppercase text-[var(--text-secondary)] tap-target"
        onClick={async () => {
          await event.prompt()
          await event.userChoice
          setEvent(null)
        }}
      >
        <Download size={14} /> Install app
      </button>
    )
  }

  if (isIos()) {
    return (
      <div className="mx-auto flex items-center gap-2 text-center text-[10px] leading-relaxed tracking-wide text-[var(--text-muted)]">
        <Share size={13} className="shrink-0" />
        <span>To install: tap Share, then “Add to Home Screen”.</span>
      </div>
    )
  }
  return null
}
