import { useState } from "react"
import { ArrowDown } from "lucide-react"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { useAdminBranches } from "../../../hooks/useAdminBranches"
import { formatMoney } from "../adminTypes"
import { AsyncNotice, PageHeading, CardHeader, PeriodTabs, AdminSelect, StatusBadge, ViewMoreButton } from "../components"
import type { Period } from "../types"
import { PERIOD_TO_REPORT } from "../types"

export function SessionsView() {
  const [period, setPeriod] = useState<Period>("Today")
  const [branch, setBranch] = useState("All Branches")
  const [limit, setLimit] = useState(5)
  const branchList = useAdminBranches()
  const { data, loading, error, reload } = useAsyncData(
    () =>
      adminApi.getSessionsReport({
        branchId: branchList.idOf(branch),
        period: PERIOD_TO_REPORT[period],
        limit: 200,
      }),
    [branch, period, branchList.branches.length],
  )
  const visible = (data?.data ?? []).map((session) => ({
    ...session,
    date: session.closedAt
      ? new Date(session.closedAt).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
  }))
  const totals = data?.totals
  return (
    <div className="admin-sessions-page admin-photo-page min-h-full">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5 mb-6">
          <PageHeading
            eyebrow={`${totals?.count ?? 0} sessions · ${formatMoney(totals?.amount ?? 0)}`}
            title="Session stream"
            description="Every completed session, newest first."
          />
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
            <AdminSelect
              value={branch}
              onChange={setBranch}
              options={branchList.options}
            />
            <PeriodTabs
              value={period}
              onChange={setPeriod}
              options={["Today", "This Week", "This Month"]}
            />
            {/* Wrapper does the hiding: .admin-secondary-button sets its own display, which beats Tailwind's hidden. */}
            <div className="sm:hidden">
              <button
                className="admin-secondary-button w-full"
                onClick={() =>
                  document
                    .getElementById("session-ledger")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                <ArrowDown size={14} /> View ledger
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_18rem] gap-6">
          <div className="min-w-0">
            <AsyncNotice loading={loading && !data} error={error} onRetry={reload} />
            {data && visible.length === 0 && (
              <div className="py-10 text-center text-xs text-[var(--text-muted)]">
                No sessions for this period.
              </div>
            )}
            <div className="relative pl-5 sm:pl-8">
              <div className="absolute left-[0.45rem] sm:left-[0.7rem] top-3 bottom-3 w-px bg-[var(--border)]" />
              <div className="flex flex-col gap-3">
                {visible.slice(0, limit).map((session, index) => (
                  <article key={session.id} className="relative">
                    <span
                      className={`absolute -left-[1.15rem] sm:-left-[1.62rem] top-6 w-3 h-3 rounded-full border-2 border-[var(--bg)] ${
                        session.status === "Edited"
                          ? "bg-[#6B9FD4]"
                          : "bg-[#4CAF86]"
                      }`}
                    />
                    <div className="admin-card p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-[var(--elevated)] items-center justify-center font-display font-800 text-lg">
                          {session.customer.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div>
                              <div className="font-display font-800 text-xl tracking-wide">
                                {session.customer}
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                {session.phone || "No phone"} · {session.date}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge label={session.branch} tone="info" />
                              <StatusBadge
                                label={session.status}
                                tone={session.status === "Edited" ? "info" : "success"}
                              />
                            </div>
                          </div>
                          <div className="mt-4 py-3 border-y border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                            {session.services}
                          </div>
                          <div className="grid grid-cols-3 gap-3 mt-3">
                            <div>
                              <div className="admin-kicker">Stylist</div>
                              <div className="text-xs mt-1">{session.stylist}</div>
                            </div>
                            <div>
                              <div className="admin-kicker">Payment</div>
                              <div className="text-xs mt-1">{session.mode}</div>
                            </div>
                            <div className="text-right">
                              <div className="admin-kicker">Bill</div>
                              <div className="font-display font-800 text-lg mt-0.5">
                                {formatMoney(session.amount)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-2 right-4 bg-[var(--text)] text-[var(--bg)] rounded-full px-2.5 py-1 text-[8px] uppercase tracking-wider">
                        Latest
                      </div>
                    )}
                  </article>
                ))}
              </div>
              {visible.length > limit && (
                <ViewMoreButton onClick={() => setLimit((value) => value + 5)} />
              )}
            </div>
          </div>

          <aside id="session-ledger" className="lg:sticky lg:top-6 h-fit flex flex-col gap-3 scroll-mt-20">
            <div className="rounded-3xl bg-[var(--text)] text-[var(--bg)] p-6">
              <div className="text-[9px] tracking-[0.25em] uppercase opacity-55">
                Today’s ledger
              </div>
              <div className="font-display font-800 text-4xl mt-4">
                {formatMoney(totals?.amount ?? 0)}
              </div>
              <div className="text-xs opacity-60 mt-1">
                {totals?.count ?? 0} completed sessions
              </div>
              <div className="grid grid-cols-2 gap-2 mt-6">
                <div className="rounded-xl bg-[var(--bg)]/10 p-3">
                  <div className="text-[8px] uppercase opacity-60">GPay</div>
                  <div className="font-display font-700 mt-1">{formatMoney(totals?.gpay ?? 0)}</div>
                </div>
                <div className="rounded-xl bg-[var(--bg)]/10 p-3">
                  <div className="text-[8px] uppercase opacity-60">Cash</div>
                  <div className="font-display font-700 mt-1">{formatMoney(totals?.cash ?? 0)}</div>
                </div>
              </div>
            </div>
            <div className="admin-card p-5">
              <CardHeader title="Live split" meta="By branch" />
              {(data?.byBranch ?? []).map((item) => (
                <div
                  key={item.branchId}
                  className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0"
                >
                  <span className="text-xs">{item.name}</span>
                  <span className="font-display font-700">{item.customers}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
