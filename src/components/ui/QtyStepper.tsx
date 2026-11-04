import { Minus, Plus } from "lucide-react"

/**
 * "− 2 +" for a card that has been added to the bill. Sits inside the card, at the bottom; the card itself adds
 * one more when tapped, so this is for taking one away (or adding several quickly).
 */
export function QtyStepper({
  qty,
  label,
  onMinus,
  onPlus,
  className = "",
}: {
  qty: number
  /** What the card is, for the buttons' screen-reader names ("Haircut"). */
  label: string
  onMinus: () => void
  onPlus: () => void
  className?: string
}) {
  const button =
    "flex h-8 w-8 items-center justify-center bg-black/55 text-white active:bg-black/80 backdrop-blur-sm"
  return (
    <div className={`z-10 flex items-center border border-white/35 bg-black/55 ${className}`} onClick={(e) => e.stopPropagation()}>
      <button type="button" aria-label={`One less ${label}`} className={button} onClick={onMinus}>
        <Minus size={13} />
      </button>
      <span className="min-w-7 px-1 text-center font-display text-sm font-700 text-white" aria-live="polite" aria-label={`${qty} ${label}`}>
        {qty}
      </span>
      <button type="button" aria-label={`One more ${label}`} className={button} onClick={onPlus}>
        <Plus size={13} />
      </button>
    </div>
  )
}
