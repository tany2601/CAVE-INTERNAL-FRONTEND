export function AmountRow({
  label,
  value,
  bold,
  accent,
  muted,
}: {
  label: string
  value: string
  bold?: boolean
  accent?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span
        className={`text-sm ${
          muted ? "text-[var(--text-muted)]" : "text-[var(--text-secondary)]"
        }`}
      >
        {label}
      </span>
      <span
        className={`font-display ${
          bold ? "font-700" : "font-600"
        } tracking-wide ${
          accent
            ? "text-[#6B9FD4]"
            : bold
              ? "text-[var(--text)]"
              : "text-[var(--text-secondary)]"
        } ${muted ? "text-[var(--text-muted)] line-through" : ""}`}
      >
        {value}
      </span>
    </div>
  )
}
