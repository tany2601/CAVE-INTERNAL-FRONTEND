export function CardHeader({
  title,
  meta,
  className = "",
}: {
  title: string
  meta?: string
  className?: string
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="text-[10px] font-600 tracking-[0.22em] uppercase">{title}</div>
      {meta && <div className="text-[9px] text-[var(--text-muted)]">{meta}</div>}
    </div>
  )
}
