/**
 * Haptic feedback for the main actions (add, start, save, close, delete…).
 *
 * Android and other browsers with the Vibration API use `navigator.vibrate`. iOS Safari has no
 * such API, but toggling a hidden `<input type="checkbox" switch>` (iOS 17.4+) produces the system
 * "tick", which also works in the installed app. Both need a real tap, so this runs from a click.
 */
export type HapticStrength = "light" | "medium" | "heavy"

const VIBRATE: Record<HapticStrength, number | number[]> = {
  light: 8,
  medium: 16,
  heavy: [24, 40, 24],
}

let tickLabel: HTMLLabelElement | null = null

const iosTick = () => {
  if (!tickLabel) {
    const input = document.createElement("input")
    input.type = "checkbox"
    input.setAttribute("switch", "")
    input.id = "haptic-switch"
    input.tabIndex = -1
    tickLabel = document.createElement("label")
    tickLabel.htmlFor = input.id
    tickLabel.setAttribute("aria-hidden", "true")
    tickLabel.style.cssText =
      "position:fixed;left:-100px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;"
    tickLabel.appendChild(input)
    document.body.appendChild(tickLabel)
  }
  tickLabel.click()
}

export function haptic(strength: HapticStrength = "medium") {
  try {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(VIBRATE[strength])
      return
    }
    iosTick()
    if (strength === "heavy") window.setTimeout(iosTick, 70)
  } catch {
    // Haptics are a nicety; never let them break a tap.
  }
}

const DESTRUCTIVE = /^(delete|remove|deactivate|cancel session|discard|log ?out|yes, )/i
const MAIN_ACTION =
  /^(add|new|create|start|save|close|complete|confirm|submit|record|pay|send|apply|update|continue|done|finish|open|mark|set|reset|refresh|generate|yes)\b/i

/** Picks a strength for a tapped button, or null when it isn't a "main" action. */
const strengthFor = (el: HTMLElement): HapticStrength | null => {
  const explicit = el.dataset.haptic
  if (explicit === "none") return null
  if (explicit === "light" || explicit === "medium" || explicit === "heavy") return explicit
  const label = (el.getAttribute("aria-label") || el.textContent || "").trim()
  if (DESTRUCTIVE.test(label) || el.classList.contains("destructive")) return "heavy"
  if (el.classList.contains("admin-primary-button") || MAIN_ACTION.test(label)) return "medium"
  return null
}

/** Listens once for taps anywhere in the app and fires feedback for the main buttons. */
export function installHaptics() {
  document.addEventListener(
    "click",
    (event) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "button, [role='button']",
      )
      if (!target || (target as HTMLButtonElement).disabled) return
      if (tickLabel && target.closest("label") === tickLabel) return
      const strength = strengthFor(target)
      if (strength) haptic(strength)
    },
    { capture: true },
  )
}
