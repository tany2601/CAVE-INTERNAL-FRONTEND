import { useEffect } from "react"

/**
 * For screens where a customer types (name, phone): keeps the page exactly where it is when the on-screen
 * keyboard opens, instead of letting the browser scroll or pan it so the field ends up hidden.
 *
 *  · the page behind can't scroll while the screen is shown (see `html.keyboard-stable` in index.css)
 *  · if the browser still nudges the page to reveal the field, it is put straight back
 *  · tapping anywhere that isn't a field closes the keyboard (a numeric keypad has no "done" key)
 */
export function useKeyboardStable() {
  useEffect(() => {
    const html = document.documentElement
    html.classList.add("keyboard-stable")

    const reset = () => {
      window.scrollTo(0, 0)
      document.scrollingElement?.scrollTo?.(0, 0)
      document.getElementById("root")?.scrollTo(0, 0)
    }
    // Browsers scroll a moment after the field gets focus, so correct it a few times.
    const settle = () => {
      reset()
      for (const ms of [50, 150, 300, 600]) window.setTimeout(reset, ms)
    }
    const onPointerDown = (event: PointerEvent) => {
      const el = document.activeElement as HTMLElement | null
      const target = event.target as HTMLElement | null
      if (!el || !target) return
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
      if (typing && !target.closest("input, textarea, select, label")) el.blur()
    }

    const vv = window.visualViewport
    vv?.addEventListener("resize", reset)
    vv?.addEventListener("scroll", reset)
    window.addEventListener("scroll", reset)
    document.addEventListener("focusin", settle)
    document.addEventListener("pointerdown", onPointerDown, true)
    return () => {
      html.classList.remove("keyboard-stable")
      vv?.removeEventListener("resize", reset)
      vv?.removeEventListener("scroll", reset)
      window.removeEventListener("scroll", reset)
      document.removeEventListener("focusin", settle)
      document.removeEventListener("pointerdown", onPointerDown, true)
    }
  }, [])
}
