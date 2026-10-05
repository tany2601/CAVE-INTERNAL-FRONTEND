import type { ReactNode } from "react"

export function TopBar({
  title,
  subtitle,
  left,
  right,
}: {
  title: string
  subtitle?: string
  left?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg)] safe-top flex-shrink-0">
      <div className="flex items-center gap-3">
        {left}
        <div>
          <div className="text-base font-display font-700 tracking-wider uppercase text-[var(--text)]">
            {title}
          </div>
          {subtitle && (
            <div className="text-[11px] text-[var(--text-muted)] tracking-wider uppercase">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  )
}
