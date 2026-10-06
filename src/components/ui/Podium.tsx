import { Crown } from "lucide-react"
import { formatAmount } from "../../lib/format"

export interface PodiumEntry {
  id: string
  name: string
  /** Revenue the ranking is based on. */
  value: number
  /** Small line under the amount, e.g. "12 customers". */
  detail?: string
}

const RANK_STYLE = {
  1: { block: "h-28", ring: "border-[#D4AF37] text-[#D4AF37]", tint: "bg-[rgba(212,175,55,0.12)]" },
  2: { block: "h-20", ring: "border-[#B8BCC4] text-[#B8BCC4]", tint: "bg-[rgba(184,188,196,0.1)]" },
  3: { block: "h-14", ring: "border-[#B87333] text-[#B87333]", tint: "bg-[rgba(184,115,51,0.12)]" },
} as const

/**
 * Top three by revenue, shown as a podium: 2nd · 1st · 3rd. With only two entries it shows
 * 2nd · 1st, and with one just the winner. Entries with no sales are not ranked.
 */
export function Podium({ entries, onSelect }: { entries: PodiumEntry[]; onSelect?: (id: string) => void }) {
  const ranked = [...entries]
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((entry, index) => ({ entry, rank: (index + 1) as 1 | 2 | 3 }))
  if (ranked.length === 0) return null

  const byRank = (rank: number) => ranked.find((r) => r.rank === rank)
  // Visual left-to-right order; missing ranks are simply left out.
  const order = [byRank(2), byRank(1), byRank(3)].filter(Boolean) as typeof ranked

  return (
    <div
      className="grid items-end gap-2"
      style={{ gridTemplateColumns: `repeat(${order.length}, minmax(0, 1fr))` }}
    >
      {order.map(({ entry, rank }) => {
        const style = RANK_STYLE[rank]
        return (
          <button
            key={entry.id}
            type="button"
            disabled={!onSelect}
            onClick={() => onSelect?.(entry.id)}
            className="flex min-w-0 flex-col items-center text-center tap-target disabled:cursor-default"
            data-haptic="none"
          >
            {rank === 1 && <Crown size={18} className="mb-1 text-[#D4AF37]" strokeWidth={1.8} />}
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 bg-[var(--elevated)] font-display text-base font-800 ${style.ring} ${
                rank === 1 ? "h-14 w-14 text-lg" : ""
              }`}
            >
              {entry.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="mt-2 w-full truncate px-1 font-display text-[13px] font-800 uppercase tracking-wider text-[var(--text)]">
              {entry.name}
            </div>
            <div className="font-display text-sm font-700 text-[var(--text)]">{formatAmount(entry.value)}</div>
            {entry.detail && (
              <div className="w-full truncate text-[9px] text-[var(--text-muted)]">{entry.detail}</div>
            )}
            <div
              className={`mt-2 flex w-full items-start justify-center rounded-t-md border border-b-0 border-[var(--border-subtle)] pt-2 ${style.block} ${style.tint}`}
            >
              <span className={`font-display text-3xl font-800 leading-none ${style.ring.split(" ")[1]}`}>{rank}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
