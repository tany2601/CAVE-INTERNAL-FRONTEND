export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="h-0.5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
      <div
        className="h-full bg-[var(--text)] transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
