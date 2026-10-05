import { Check } from "lucide-react"

export function CheckItem({
  task,
  description,
  done,
  onToggle,
}: {
  task: string
  description?: string
  done: boolean
  onToggle: () => void
}) {
  return (
    <button
      className="w-full flex items-start gap-4 py-4 px-0 tap-target text-left"
      onClick={onToggle}
    >
      <div
        className={`w-5 h-5 rounded-sm border flex-shrink-0 flex items-center justify-center mt-0.5 transition-all ${
          done
            ? "bg-[var(--text)] border-[var(--text)]"
            : "border-[var(--text-faint)]"
        }`}
      >
        {done && (
          <Check size={12} className="text-[var(--bg)]" strokeWidth={2.5} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-medium ${
            done
              ? "text-[var(--text-muted)] line-through"
              : "text-[var(--text)]"
          }`}
        >
          {task}
        </div>
        {description && (
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {description}
          </div>
        )}
      </div>
    </button>
  )
}
