export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: React.ReactNode
  description: string
}) {
  return (
    <div>
      <div className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-muted)]">
        {eyebrow}
      </div>
      <div className="font-display font-800 text-3xl sm:text-4xl tracking-[0.08em] uppercase mt-1 leading-none">
        {title}
      </div>
      <div className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2">
        {description}
      </div>
    </div>
  )
}
