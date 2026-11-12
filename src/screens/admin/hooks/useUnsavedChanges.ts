import { useEffect, useRef } from "react"

/** Every form on screen that currently has unsaved edits. (A page can have several, e.g. GST: business + branch.) */
const dirtyForms = new Set<symbol>()

/** True while the page being shown has edits that haven't been saved. */
export const hasUnsavedChanges = () => dirtyForms.size > 0

/**
 * Call from a form with `dirty = there are unsaved edits`. The admin shell asks before moving to another
 * page (see AdminDashboard), and the browser asks before the tab is closed or reloaded. Several forms on one page
 * each report on their own, so one being clean never hides another that is not.
 */
export function useUnsavedChanges(dirty: boolean) {
  const id = useRef(Symbol("form"))
  useEffect(() => {
    if (!dirty) {
      dirtyForms.delete(id.current)
      return
    }
    dirtyForms.add(id.current)
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => {
      window.removeEventListener("beforeunload", warn)
      dirtyForms.delete(id.current)
    }
  }, [dirty])
}
