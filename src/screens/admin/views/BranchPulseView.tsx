import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { AdminPage, AsyncNotice, BranchPulseCard, DateRangePicker, PageHeading, PeriodTabs } from "../components"
import type { DateRange } from "../components"
import type { Period } from "../types"
import { PERIOD_TO_REPORT } from "../types"

/** Every branch's pulse card (the overview only previews the first few). Tap one for its details. */
export function BranchPulseView({
  period,
  onPeriod,
  onBranch,
  onBack,
}: {
  period: Period
  onPeriod: (period: Period) => void
  onBranch: (id: string, name: string) => void
  onBack: () => void
}) {
  const [range, setRange] = useState<DateRange>({})
  const custom = period === "Custom"
  const rangeReady = !custom || (!!range.from && !!range.to)
  const { data, loading, error, reload } = useAsyncData(
    () =>
      rangeReady
        ? adminApi.getOverview({
            period: PERIOD_TO_REPORT[period],
            ...(custom ? { from: range.from, to: range.to } : {}),
          })
        : Promise.resolve(undefined),
    [period, range.from, range.to],
  )
  const branches = data?.branches ?? []

  return (
    <AdminPage>
      <button className="admin-back-button w-fit" onClick={onBack}>
        <ArrowLeft size={14} /> Overview
      </button>
      <PageHeading
        eyebrow={`${branches.length} ${branches.length === 1 ? "branch" : "branches"}`}
        title="Branch pulse"
        description="Revenue, customers and live activity for every branch. Tap a branch for its details."
      />
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <PeriodTabs value={period} onChange={onPeriod} custom />
        {custom && <DateRangePicker value={range} onChange={setRange} autoOpen={!range.from} />}
      </div>
      <AsyncNotice loading={loading && !data} error={error} onRetry={reload} />
      {custom && !rangeReady && (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-5 py-8 text-center text-xs text-[var(--text-muted)]">
          Choose a start and end date to see each branch for that range.
        </div>
      )}
      {data && branches.length === 0 && (
        <div className="py-10 text-center text-xs text-[var(--text-muted)]">No active branches yet.</div>
      )}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {branches.map((branch) => (
          <BranchPulseCard key={branch.id} branch={branch} onOpen={onBranch} />
        ))}
      </div>
    </AdminPage>
  )
}
