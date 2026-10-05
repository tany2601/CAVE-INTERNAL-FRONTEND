export function CompactMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "success" | "danger"
}) {
  return (
    <div className="rounded-xl bg-[var(--elevated)] border border-[var(--border-subtle)] p-3 min-w-0">
      <div className="text-[8px] tracking-wider uppercase text-[var(--text-muted)] truncate">
        {label}
      </div>
      <div
        className={`font-display font-700 text-base mt-1 truncate ${
          tone === "success"
            ? "text-[#4CAF86]"
            : tone === "danger"
              ? "text-[#E06060]"
              : ""
        }`}
      >
        {value}
      </div>
    </div>
  )
}
