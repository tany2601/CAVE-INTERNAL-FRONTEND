import { useCallback, useEffect, useRef, useState } from "react"
import { useDataRefresh } from "../context/DataRefreshContext"
import { asyncCache as cache } from "../lib/asyncCache"

interface AsyncState<T> {
  data: T | undefined
  /** True only while there is nothing to show yet; background refreshes don't flip it. */
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

/**
 * Results are kept for the session (lib/asyncCache), keyed by the loader + its deps. Returning to a
 * screen shows the last result immediately and refreshes it quietly in the background
 * (stale-while-revalidate), so navigating around never flashes a loading state for data you've seen.
 */
const keyOf = (load: () => unknown, deps: unknown[]) => {
  try {
    return `${load.toString()}|${JSON.stringify(deps)}`
  } catch {
    return `${load.toString()}|${deps.length}`
  }
}

/** Runs `load` on mount (and whenever `deps` change) and exposes loading/error state. */
export function useAsyncData<T>(
  load: () => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> {
  const { version } = useDataRefresh()
  const key = keyOf(load, deps)

  const [data, setData] = useState<T | undefined>(() => cache.get(key) as T | undefined)
  const [loading, setLoading] = useState(() => !cache.has(key))
  const [error, setError] = useState<string | null>(null)
  const latest = useRef(0)
  const loadRef = useRef(load)
  loadRef.current = load

  // Switching to different params: show their cached result right away, if any.
  const lastKey = useRef(key)
  if (lastKey.current !== key) {
    lastKey.current = key
    const cached = cache.get(key) as T | undefined
    setData(cached)
    setLoading(!cache.has(key))
  }

  const run = useCallback(async () => {
    const id = ++latest.current
    try {
      const result = await loadRef.current()
      if (id !== latest.current) return
      cache.set(key, result)
      setData(result)
      setError(null)
    } catch (e) {
      if (id !== latest.current) return
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      if (id === latest.current) setLoading(false)
    }
  }, [key])

  // On mount / params change, and again whenever a poll or manual refresh ticks.
  useEffect(() => {
    void run()
  }, [run, version])

  return { data, loading, error, reload: run }
}
