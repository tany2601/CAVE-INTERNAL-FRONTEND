import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useAuth } from "./AuthContext"

/** How often screens quietly re-check the server while the app is open and visible. */
const POLL_MS = 30_000

interface DataRefreshValue {
  /** Bumps on every poll / manual refresh; data hooks re-fetch (silently) when it changes. */
  version: number
  /** Re-fetch everything on screen now. */
  refreshAll: () => void
  /** True from a manual refresh until the next tick (for the spinner on the refresh button). */
  refreshing: boolean
}

const DataRefreshContext = createContext<DataRefreshValue>({
  version: 0,
  refreshAll: () => {},
  refreshing: false,
})

export function DataRefreshProvider({ children }: { children: ReactNode }) {
  const { auth } = useAuth()
  const signedIn = !!auth
  const [version, setVersion] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const refreshAll = useCallback(() => {
    setRefreshing(true)
    bump()
    window.setTimeout(() => setRefreshing(false), 900)
  }, [bump])

  // Poll while signed in and visible; catch up as soon as the app comes back to the foreground.
  useEffect(() => {
    if (!signedIn) return
    const tick = () => {
      if (document.visibilityState === "visible") bump()
    }
    const id = window.setInterval(tick, POLL_MS)
    document.addEventListener("visibilitychange", tick)
    window.addEventListener("online", tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", tick)
      window.removeEventListener("online", tick)
    }
  }, [signedIn, bump])

  const value = useMemo(
    () => ({ version, refreshAll, refreshing }),
    [version, refreshAll, refreshing],
  )
  return <DataRefreshContext.Provider value={value}>{children}</DataRefreshContext.Provider>
}

export const useDataRefresh = () => useContext(DataRefreshContext)
