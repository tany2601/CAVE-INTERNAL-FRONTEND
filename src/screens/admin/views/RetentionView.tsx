import { EmptyNote } from "../../../components/ui"
import { useState } from "react"
import {
  Repeat2,
} from "lucide-react"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { useAdminBranches } from "../../../hooks/useAdminBranches"
import { AsyncNotice, PageHeading, ViewMoreButton } from "../components"

export const RetentionView = () => {
  const [branch, setBranch] = useState("All Branches")
  const [limit, setLimit] = useState(5)
  const branchList = useAdminBranches()
  const { data, loading, error, reload } = useAsyncData(
    () => adminApi.getRetentionReport({ branchId: branchList.idOf(branch) }),
    [branch, branchList.branches.length],
  )
  const retentionCustomers = (data?.leaderboard ?? []).map((c) => [
    c.name,
    c.phone,
    c.lastBranch,
    String(c.visits),
  ])
  return (
    <div className="retention-page admin-photo-page min-h-full">
      <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <PageHeading
          eyebrow="Customer retention"
          title="Retention"
          description="Returning customers, retention rates and your most loyal visitors."
        />
        <div className="flex gap-2 overflow-x-auto mt-5 pb-1">
          {branchList.options.map((item) => (
            <button
              key={item}
              className={`retention-branch-pill ${branch === item ? "active" : ""}`}
              onClick={() => setBranch(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <AsyncNotice loading={loading && !data} error={error} onRetry={reload} />
        <section className="retention-hero mt-6">
          <div
            className="retention-ring"
            style={{ "--progress": `${data?.retentionRate ?? 0}%` } as React.CSSProperties}
          >
            <div>
              <strong>{data?.retentionRate ?? 0}%</strong>
              <span>Retention rate</span>
            </div>
          </div>
          <div className="retention-hero-copy">
            <div className="admin-kicker">All-time customer base</div>
            <div className="font-display font-800 text-5xl sm:text-7xl mt-2">
              {data?.totalCustomers ?? 0}
            </div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              total customers · <strong>{data?.returning ?? 0} returning</strong>
            </div>
          </div>
          <div className="retention-periods">
            {(data?.periods ?? []).map((p) => [
              p.label,
              `${p.rate}%`,
              `${p.newCustomers} new · ${p.returning} returning`,
            ]).map(([label, value, sub]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{sub}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-end justify-between">
            <div>
              <div className="admin-kicker">Loyalty leaderboard</div>
              <div className="font-display font-800 text-2xl tracking-wider uppercase mt-1">
                Top returning customers
              </div>
            </div>
            <Repeat2 size={20} className="text-[var(--text-muted)]" />
          </div>
          <div className="retention-leaderboard mt-4">
            {data && retentionCustomers.length === 0 && (
              <EmptyNote>No returning customers yet.</EmptyNote>
            )}
            {retentionCustomers.slice(0, limit).map((customer, index) => (
              <article key={customer[0]}>
                <div className="retention-position">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="w-10 h-10 rounded-full bg-[var(--elevated)] flex items-center justify-center font-display font-800">
                  {customer[0].slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-600">{customer[0]}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    {customer[1] || "No phone"} · Last: {customer[2]}
                  </div>
                </div>
                <div className="text-right">
                  <strong className="font-display font-800 text-2xl">
                    {customer[3]}
                  </strong>
                  <div className="admin-kicker">Visits</div>
                </div>
              </article>
            ))}
          </div>
          {retentionCustomers.length > limit && (
            <ViewMoreButton onClick={() => setLimit((value) => value + 5)} />
          )}
        </section>
      </div>
    </div>
  )
}
