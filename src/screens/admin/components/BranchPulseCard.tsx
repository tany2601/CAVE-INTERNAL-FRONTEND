import { ArrowRight } from "lucide-react"
import type { OverviewReport } from "../../../types/api"
import { formatMoney } from "../adminTypes"
import { CompactMetric } from "./CompactMetric"

export type BranchPulse = OverviewReport["branches"][number]

/** One branch's snapshot: revenue, customers, active sessions and progress to its monthly target. */
export function BranchPulseCard({
  branch,
  onOpen,
}: {
  branch: BranchPulse
  onOpen: (id: string, name: string) => void
}) {
  return (
    <button
      className="admin-card text-left p-5 card-press group"
      onClick={() => onOpen(branch.id, branch.name)}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display font-800 text-2xl tracking-wider uppercase">
            {branch.name}
          </div>
          <div className="text-[10px] tracking-widest uppercase text-[var(--text-muted)] mt-1">
            {branch.location}
          </div>
        </div>
        <div className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--text)]">
          <ArrowRight size={15} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 my-5">
        <CompactMetric label="Revenue" value={formatMoney(branch.revenue)} />
        <CompactMetric label="Customers" value={String(branch.customers)} />
        <CompactMetric label="Active" value={String(branch.active)} />
      </div>
      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <span>Monthly target</span>
        <span>
          {formatMoney(branch.monthRevenue)} / {formatMoney(branch.target)}
        </span>
      </div>
      <div className="h-1 bg-[var(--elevated)] rounded-full mt-2 overflow-hidden">
        <div
          className="h-full bg-[var(--text)] rounded-full"
          style={{
            width: `${Math.min(
              100,
              branch.target ? (branch.monthRevenue / branch.target) * 100 : 0,
            )}%`,
          }}
        />
      </div>
    </button>
  )
}
