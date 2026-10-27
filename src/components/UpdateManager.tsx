import { useEffect, useRef, useState } from "react"
import { hasUnsavedChanges } from "../screens/admin/hooks/useUnsavedChanges"

const CHECK_EVERY_MS = 5 * 60 * 1000
const AWAY_BEFORE_RELOAD_MS = 30 * 1000

/** Screens that hold no half-finished work, so reloading from them loses nothing (the router restores them). */
const SAFE_SCREENS = new Set([
  "role-selection",
  "welcome",
  "stylist-home",
  "stylist-performance",
  "stylist-checklist",
  "stylist-menu",
  "manager-home",
  "manager-sessions",
  "commission",
  "cash",
  "expenses",
  "manager-menu",
  "admin-dashboard",
])

const latestBuild = async (): Promise<string | null> => {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" })
    if (!res.ok) return null
    const data = (await res.json()) as { build?: unknown }
    return typeof data.build === "string" ? data.build : null
  } catch {
    return null // offline or a hiccup: try again later
  }
}

/**
 * Keeps an open or installed app current without the client doing anything.
 *
 * It checks /version.json when the app is opened, brought back to the front, and every few minutes. When a newer
 * version exists it refreshes itself at a safe moment: when the app returns from the background (phone unlocked,
 * tab revisited) on a screen with nothing half-done. Mid-bill or mid-form it never interrupts; a small "Update"
 * bar appears instead, and the update is applied as soon as that screen is left.
 */
export function UpdateManager({ screen }: { screen: string }) {
  const [available, setAvailable] = useState(false)
  const hiddenAt = useRef<number | null>(null)
  const screenRef = useRef(screen)
  screenRef.current = screen

  const safeNow = () => SAFE_SCREENS.has(screenRef.current) && !hasUnsavedChanges()

  useEffect(() => {
    if (typeof __BUILD_ID__ === "undefined" || !import.meta.env.PROD) return
    let stopped = false

    const check = async () => {
      const build = await latestBuild()
      if (stopped || !build || build === __BUILD_ID__) return
      setAvailable(true)
      // Make sure the new service worker is fetched too, so the reload opens the new version at once.
      navigator.serviceWorker?.getRegistration().then((reg) => reg?.update()).catch(() => {})
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now()
        return
      }
      const awayFor = hiddenAt.current ? Date.now() - hiddenAt.current : 0
      hiddenAt.current = null
      void check().then(() => {
        if (stopped) return
        // Back from a real break, on a quiet screen: refresh now, nobody is mid-task.
        setAvailable((isNew) => {
          if (isNew && awayFor >= AWAY_BEFORE_RELOAD_MS && safeNow()) window.location.reload()
          return isNew
        })
      })
    }

    void check()
    const timer = window.setInterval(check, CHECK_EVERY_MS)
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("online", check)
    return () => {
      stopped = true
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("online", check)
    }
  }, [])

  // The moment the person leaves a busy screen for a quiet one, apply the waiting update.
  useEffect(() => {
    if (available && safeNow()) {
      const t = window.setTimeout(() => {
        if (safeNow()) window.location.reload()
      }, 1500)
      return () => window.clearTimeout(t)
    }
  }, [available, screen])

  if (!available) return null
  return (
    <div
      role="status"
      className="fixed left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--elevated)] py-2 pl-4 pr-2 text-xs text-[var(--text)] shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
      style={{ bottom: "calc(var(--sab, 0px) + 5.5rem)" }}
    >
      A new version is ready
      <button
        type="button"
        disabled={!safeNow()}
        className="rounded-full bg-[var(--text)] px-4 py-1.5 font-display text-[11px] font-700 uppercase tracking-wider text-[var(--bg)] disabled:opacity-40"
        onClick={() => window.location.reload()}
      >
        Update
      </button>
    </div>
  )
}
