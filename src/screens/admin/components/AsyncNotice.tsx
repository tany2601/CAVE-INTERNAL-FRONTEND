/** Loading / error placeholder for admin views that fetch from the API. */
export function AsyncNotice({
  loading,
  error,
  onRetry,
}: {
  loading: boolean
  error: string | null
  onRetry?: () => void
}) {
  if (!loading && !error) return null
  return (
    <div className="mt-7 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-8 text-center">
      {loading ? (
        <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)]">
          Loading…
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
