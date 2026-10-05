import { useState } from "react"
import {
  ChevronRight,
  Download,
  Search,
} from "lucide-react"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { useAdminBranches } from "../../../hooks/useAdminBranches"
import { formatMoney } from "../adminTypes"
import { AsyncNotice, PageHeading, AdminSelect, StatusBadge, ViewMoreButton } from "../components"

const SORTS = { "Top Spenders": "SPEND", "Most Visits": "VISITS", Recent: "RECENT" } as const

const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"

export function CustomersView() {
  const [query, setQuery] = useState("")
  const [branch, setBranch] = useState("All Branches")
  const [limit, setLimit] = useState(7)
  const [sort, setSort] = useState<keyof typeof SORTS>("Top Spenders")
  const branchList = useAdminBranches()
  const { data, loading, error, reload } = useAsyncData(
    () =>
      adminApi.getCustomersReport({
        branchId: branchList.idOf(branch),
        search: query.trim() || undefined,
        sort: SORTS[sort],
      }),
    [branch, query, sort, branchList.branches.length],
  )
  // Row shape used by the table and CSV export: name, phone, visits, spend, favourite, last visit, branch.
  const visible = (data?.data ?? []).map((c) => [
    c.name,
    c.phone,
    String(c.visits),
    formatMoney(c.totalSpent),
    c.favouriteService,
    shortDate(c.lastVisit),
    c.branch,
  ])
  const stats = data?.stats

  const exportCsv = () => {
    const lines = [
      ["Name", "Phone", "Visits", "Total spent", "Favourite service", "Last visit", "Branch"],
      ...visible,
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")
    const url = URL.createObjectURL(new Blob([lines], { type: "text/csv" }))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "cave-customers.csv"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="customers-page admin-photo-page min-h-full bg-[var(--surface-soft)]">
      <div className="max-w-[1500px] mx-auto">
        <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-8 border-b border-[var(--border-subtle)]">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <PageHeading
              eyebrow={`${stats?.totalProfiles ?? 0} customer profiles`}
              title="Customer directory"
              description="Spend, visits and last visit for every customer."
            />
            <button className="admin-primary-button" onClick={exportCsv}>
              <Download size={15} /> Export CSV
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-7">
            <div className="customer-hero-stat">
              <span>{stats?.totalProfiles ?? 0}</span>
              <small>Total profiles</small>
            </div>
            <div className="customer-hero-stat">
              <span>{stats?.returning ?? 0}</span>
              <small>Returning</small>
            </div>
            <div className="customer-hero-stat">
              <span>{formatMoney(stats?.avgLifetimeValue ?? 0)}</span>
              <small>Avg lifetime value</small>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[16rem_1fr] min-h-[40rem]">
          <aside className="p-4 sm:p-6 border-r border-[var(--border-subtle)]">
            <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-4">
              Refine directory
            </div>
            <div className="flex flex-col gap-3">
              <AdminSelect
                value={branch}
                onChange={setBranch}
                options={branchList.options}
                full
              />
              <AdminSelect
                value={sort}
                onChange={(value) => setSort(value as keyof typeof SORTS)}
                options={Object.keys(SORTS)}
                full
              />
            </div>
            <div className="mt-7">
              <div className="admin-kicker mb-3">Spend bands</div>
              {(stats?.spendBands ?? []).map((band) => (
                <div
                  key={band.label}
                  className="flex items-center justify-between py-2 text-xs"
                >
                  <span className="text-[var(--text-secondary)]">{band.label}</span>
                  <span>{band.count}</span>
                </div>
              ))}
            </div>
          </aside>

          <section className="p-4 sm:p-6 min-w-0">
            <label className="admin-input h-14 flex items-center gap-3 mb-4">
              <Search size={17} />
              <input
                className="flex-1 bg-transparent outline-none min-w-0 text-sm"
                placeholder="Search by customer name or mobile number"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <span className="text-[9px] text-[var(--text-muted)]">
                {visible.length} shown
              </span>
            </label>

            <AsyncNotice loading={loading && !data} error={error} onRetry={reload} />
            {data && visible.length === 0 && (
              <div className="py-10 text-center text-xs text-[var(--text-muted)]">
                No customers match.
              </div>
            )}
            <div className="flex flex-col">
              {visible.slice(0, limit).map((customer, index) => (
                <article
                  key={`${customer[0]}-${index}`}
                  className="customer-directory-row"
                >
                  <div className="w-11 h-11 rounded-full bg-[var(--elevated)] flex items-center justify-center font-display font-800">
                    {customer[0].slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-600 text-sm">{customer[0]}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {customer[1] || "No phone"} · Last {customer[5]}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] mt-1 truncate">
                      {customer[4]}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <StatusBadge label={customer[6]} tone="info" />
                  </div>
                  <div className="text-center">
                    <div className="font-display font-800 text-lg">{customer[2]}</div>
                    <div className="admin-kicker">Visits</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-800 text-lg">{customer[3]}</div>
                    <div className="admin-kicker">Lifetime spend</div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="hidden sm:block text-[var(--text-muted)]"
                  />
                </article>
              ))}
            </div>
            {visible.length > limit && (
              <ViewMoreButton onClick={() => setLimit((value) => value + 7)} />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
