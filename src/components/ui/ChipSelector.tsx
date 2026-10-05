export function ChipSelector({
  options,
  selected,
  onToggle,
}: {
  options: { id: string; label: string; sub?: string }[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o.id)
        return (
          <button
            key={o.id}
            className={`chip ${active ? "selected" : ""}`}
            onClick={() => onToggle(o.id)}
          >
            {o.label}
            {o.sub && <span className="ml-1 opacity-60">{o.sub}</span>}
          </button>
        )
      })}
    </div>
  )
}
