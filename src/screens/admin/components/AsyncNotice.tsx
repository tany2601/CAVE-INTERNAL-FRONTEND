import { useEffect, useRef } from "react"

/**
 * Loading / error placeholder for admin views that fetch from the API.
 *
 * While the first load is running, everything rendered after this component is hidden (it keeps its
 * space, so nothing jumps) and fades in as one when the data arrives. See `.async-loading` in index.css.
 */
export function AsyncNotice({
  loading,
  error,
  onRetry,
}: {
  loading: boolean
  error: string | null
  onRetry?: () => void
}) {
  const node = useRef<HTMLElement | null>(null)
  const wasLoading = useRef(false)

  useEffect(() => {
    if (loading) {
      wasLoading.current = true
      return
    }
    if (!wasLoading.current) return
    wasLoading.current = false
    const parent = node.current?.parentElement
    if (!parent) return
    parent.classList.add("admin-reveal")
    window.setTimeout(() => parent.classList.remove("admin-reveal"), 450)
  }, [loading])

  if (!loading && !error) {
    return <span hidden ref={node} className="async-marker" />
  }
  return (
    <div
      ref={(el) => {
        node.current = el
      }}
      className={`async-marker mt-7 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-8 text-center ${
        loading ? "async-loading" : ""
      }`}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-3 text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)]">
          <span className="h-3 w-3 animate-spin rounded-full border border-[var(--text-muted)] border-t-transparent" />
          Loading
        </div>
      ) : (
        <>
          <div className="text-sm text-[#E06060]">{error}</div>
          {onRetry && (
            <button className="admin-secondary-button mt-4" onClick={onRetry}>
              Retry
            </button>
          )}
        </>
      )}
    </div>
  )
}
