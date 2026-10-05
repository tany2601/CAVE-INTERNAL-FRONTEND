import type { ReactNode } from "react"

export function EmptyState({
  icon,
  title,
  message,
}: {
  icon?: ReactNode
  title: string
  message?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
      {icon && <div className="text-[var(--text-faint)] mb-2">{icon}</div>}
      <div className="font-display font-600 tracking-wider uppercase text-sm text-[var(--text-muted)]">
        {title}
      </div>
      {message && (
        <p className="text-[12px] text-[var(--text-subtle)] leading-relaxed max-w-xs">
          {message}
        </p>
      )}
    </div>
  )
}
