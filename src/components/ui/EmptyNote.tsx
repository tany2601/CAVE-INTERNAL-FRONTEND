import type { ReactNode } from "react"

/** Compact "nothing here yet" card for lists and charts that have no data. */
export function EmptyNote({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-[var(--border)] px-5 py-7 text-center text-xs leading-relaxed text-[var(--text-muted)] ${className}`}
    >
      {children}
    </div>
  )
}
