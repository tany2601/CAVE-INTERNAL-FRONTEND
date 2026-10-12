import { Check } from "lucide-react"
import { formatAmount } from "../../lib/format"

// All colour photographs: tiles are greyscaled by CSS until selected, so a source image that is
// already black & white would never visibly "turn on".
const SERVICE_IMAGES = [
  "/images/photos/1621605815971-fbc98d665033.jpg",
  "/images/photos/1599351431202-1e0f0137899a.jpg",
  "/images/photos/1605497788044-5a32c7078486.jpg",
  "/images/photos/1622286342621-4bd786c2447c.jpg",
  "/images/photos/1585747860715-2ba37e788b70.jpg",
]

/** Service card: black & white until selected, then full colour with a tick. */
export function ServiceTile({
  name,
  price,
  index,
  selected,
  onToggle,
}: {
  name: string
  price: number
  index: number
  selected: boolean
  onToggle: () => void
}) {
  // Combo names carry their contents in brackets: "The Basic (Haircut + …)". Show the name big and
  // the contents small so the tile never has to cut text off.
  const open = name.indexOf(" (")
  const title = open > 0 && name.endsWith(")") ? name.slice(0, open) : name
  const detail = open > 0 && name.endsWith(")") ? name.slice(open + 2, -1) : ""
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`relative flex h-full min-h-28 flex-col justify-end overflow-hidden text-left border transition-colors ${
        selected ? "border-white" : "border-[var(--border-subtle)]"
      }`}
      onClick={onToggle}
    >
      <img
        src={SERVICE_IMAGES[index % SERVICE_IMAGES.length]}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-[filter] duration-200 ${
          selected ? "" : "grayscale"
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center">
          <Check size={13} />
        </div>
      )}
      <div className="relative p-3 pt-10 text-white">
        <div className="font-display font-700 leading-tight tracking-wide">{title}</div>
        {detail && <div className="mt-1 text-[10px] leading-snug text-white/70">{detail}</div>}
        <div className="text-xs text-white/65 mt-0.5">{formatAmount(price)}</div>
      </div>
    </button>
  )
}
