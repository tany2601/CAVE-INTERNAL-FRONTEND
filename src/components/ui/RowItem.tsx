import type { ReactNode } from "react"
import { ChevronRight } from "lucide-react"

export function RowItem({
  left,
  right,
  onClick,
  border = true,
}: {
  left: ReactNode
  right?: ReactNode
  onClick?: () => void
  border?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between py-3.5 ${
        border ? "border-b border-[var(--border-subtle)]" : ""
      } ${onClick ? "card-press cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">{left}</div>
      {right ||
        (onClick && (
          <ChevronRight
            size={14}
            className="text-[var(--text-faint)] flex-shrink-0"
          />
        ))}
    </div>
  )
}
