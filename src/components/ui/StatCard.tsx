export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-sm p-4 flex flex-col gap-1">
      <span className="text-[10px] font-medium tracking-widest uppercase text-[var(--text-muted)]">
        {label}
      </span>
      <span
        className={`text-2xl font-display font-700 tracking-tight ${
          accent ? "text-[#6B9FD4]" : "text-[var(--text)]"
        }`}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[11px] text-[var(--text-muted)]">{sub}</span>
      )}
    </div>
  )
}
