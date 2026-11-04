import { Check } from "lucide-react"
import { formatAmount } from "../../lib/format"
import { QtyStepper } from "./QtyStepper"

/**
 * A service as a colour card: its own colour, the name big, the price below. Not added: a tinted card with a
 * thick coloured edge. Added: the whole card turns solid colour with a white border and a tick, and the count
 * (− 2 +) sits at the bottom.
 */
export function ServiceColorTile({
  name,
  price,
  color,
  qty,
  onAdd,
  onRemove,
}: {
  name: string
  price: number
  color: string
  qty: number
  onAdd: () => void
  onRemove: () => void
}) {
  const selected = qty > 0
  // Combo names carry their contents in brackets: show the name big and the contents small.
  const open = name.indexOf(" (")
  const title = open > 0 && name.endsWith(")") ? name.slice(0, open) : name
  const detail = open > 0 && name.endsWith(")") ? name.slice(open + 2, -1) : ""
  return (
    <div className="relative h-full min-h-28">
      <button
        type="button"
        aria-pressed={selected}
        onClick={onAdd}
        className="relative flex h-full min-h-28 w-full flex-col justify-start overflow-hidden border-2 p-3 pb-14 pl-5 text-left transition-colors"
        style={
          selected
            ? { background: color, borderColor: "#fff", color: "#fff" }
            : {
                background: `color-mix(in srgb, ${color} 20%, var(--surface))`,
                borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
                boxShadow: `inset 8px 0 0 ${color}`,
                color: "var(--text)",
              }
        }
      >
        <span className="font-display text-lg font-700 leading-tight tracking-wide">{title}</span>
        {detail && <span className="mt-1 text-[11px] leading-snug opacity-80">{detail}</span>}
        <span className="mt-auto pt-2 text-sm font-600 opacity-90">{formatAmount(price)}</span>
        {selected && (
          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white" style={{ color }}>
            <Check size={14} strokeWidth={3.5} />
          </span>
        )}
      </button>
      {selected && <QtyStepper qty={qty} label={title} onMinus={onRemove} onPlus={onAdd} className="absolute bottom-2 right-2" />}
    </div>
  )
}
