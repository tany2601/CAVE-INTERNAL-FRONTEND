import { EmptyNote } from "../../../components/ui"
import { useState } from "react"
import {
  ChevronRight,
} from "lucide-react"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { useAdminBranches } from "../../../hooks/useAdminBranches"
import { formatMoney } from "../adminTypes"
import { AsyncNotice, PageHeading, AdminSelect, StatusBadge, ViewMoreButton } from "../components"

export function CommissionView() {
  const [branch, setBranch] = useState("All Branches")
  const [limit, setLimit] = useState(4)
  const branchList = useAdminBranches()
  const { data, loading, error, reload } = useAsyncData(
    () =>
      adminApi.getCommissionReport({
        branchId: branchList.idOf(branch),
        period: "TODAY",
      }),
    [branch, branchList.branches.length],
  )
  const visible = data?.data ?? []
  const totalPayout = data?.totals.pending ?? 0
  return (
    <div className="commission-page admin-photo-page min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <PageHeading
          eyebrow="Payouts"
          title="Commission"
          description="Commission earned by each stylist today and what is still to be paid."
        />
        <section className="commission-command-bar mt-6">
          <div className="commission-total">
            <div className="admin-kicker">Today’s payout run</div>
            <div className="font-display font-800 text-4xl sm:text-5xl mt-3">
              {formatMoney(totalPayout)}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              Pending across {visible.length} stylists
            </div>
          </div>
          <div className="commission-command-metric">
            <span>Revenue base</span>
            <strong>
              {formatMoney(data?.totals.revenue ?? 0)}
            </strong>
          </div>
          <div className="commission-command-metric">
            <span>Average rate</span>
            <strong>{data?.totals.averageRate ?? 0}%</strong>
          </div>
          <div className="commission-filter">
            <AdminSelect
              value={branch}
              onChange={(value) => {
                setBranch(value)
                setLimit(4)
              }}
              options={branchList.options}
              full
            />
          </div>
        </section>

        <AsyncNotice loading={loading && !data} error={error} onRetry={reload} />
        <section className="mt-7">
          <div className="flex items-center justify-between mb-3">
            <div className="admin-kicker">Pending payouts</div>
            <div className="text-[10px] text-[var(--text-muted)]">
              Showing {Math.min(limit, visible.length)} of {visible.length}
            </div>
          </div>
          <div className="flex flex-col">
            {data && visible.length === 0 && (
              <EmptyNote>No pending payouts. Everyone is paid up.</EmptyNote>
            )}
            {visible.slice(0, limit).map((item, index) => (
              <div key={item.userId} className="commission-queue-row">
                <div className="commission-rank">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <div className="font-display font-800 text-xl uppercase tracking-wider">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1">
                    {item.branch} · {item.customers} customers
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="admin-kicker">Revenue basis</div>
                  <div className="font-display font-700 mt-1">
                    {formatMoney(item.revenue)}
                  </div>
                </div>
                <div className="min-w-20">
                  <div className="admin-kicker">Payout</div>
                  <div className="font-display font-800 text-2xl mt-0.5">
                    {formatMoney(item.pending || item.payout)}
                  </div>
                </div>
                <StatusBadge
                  label={item.status}
                  tone={item.status === "Paid" ? "success" : "danger"}
                />
                <button
                  className="admin-icon-button"
                  aria-label={`Review ${item.name}`}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            ))}
          </div>
          {visible.length > limit && (
            <ViewMoreButton onClick={() => setLimit((value) => value + 4)} />
          )}
        </section>
      </div>
    </div>
  )
}
