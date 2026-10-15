import { useEffect } from "react"

let unsaved = false

/** True while the page being shown has edits that haven't been saved. */
export const hasUnsavedChanges = () => unsaved

/**
 * Call from a page with `dirty = there are unsaved edits`. The admin shell asks before moving to another
 * page (see AdminDashboard), and the browser asks before the tab is closed or reloaded.
 */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    unsaved = dirty
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])
  useEffect(
    () => () => {
      unsaved = false
    },
    [],
  )
}
