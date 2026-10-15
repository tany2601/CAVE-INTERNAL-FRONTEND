import { useEffect, useState } from "react"
import { BadgePercent, Save } from "lucide-react"
import { adminApi } from "../../../lib/api"
import type { BranchDiscountRow } from "../../../lib/api/admin"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { formatMoney } from "../adminTypes"
import { AdminPage, AsyncNotice, PageHeading } from "../components"
import { useAdminActions } from "../hooks/useAdminActions"
import { useUnsavedChanges } from "../hooks/useUnsavedChanges"

/** What is typed for one discount: the number is kept as text so a digit can be deleted without the box jumping to 0. */
interface DraftPart {
  type: "PERCENTAGE" | "FIXED"
  value: string
}
interface Draft {
  enabled: boolean
  services: DraftPart
  products: DraftPart
}

const toDraft = (row: BranchDiscountRow): Draft => ({
  enabled: row.enabled,
  services: { type: row.services.type, value: row.services.value > 0 ? String(row.services.value) : "" },
  products: { type: row.products.type, value: row.products.value > 0 ? String(row.products.value) : "" },
})

const num = (v: string) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const same = (a: Draft, b: Draft) =>
  a.enabled === b.enabled &&
  a.services.type === b.services.type &&
  num(a.services.value) === num(b.services.value) &&
  a.products.type === b.products.type &&
  num(a.products.value) === num(b.products.value)

const describe = (d: DraftPart) =>
  num(d.value) > 0 ? (d.type === "PERCENTAGE" ? `${num(d.value)}% off` : `${formatMoney(num(d.value))} off`) : "no discount"

/** Admin → Discounts: each branch's discount on services and on products, switched on or off. */
export const DiscountsView = () => {
  const actions = useAdminActions()
  const { data, loading, error, reload } = useAsyncData(() => adminApi.listDiscounts())
  // Edits per branch; a branch without an entry shows what is saved.
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})

  // Fresh data from the server (after saving, or a background refresh) never overwrites what is being typed.
  useEffect(() => {
    setDrafts((current) => {
      const next: Record<string, Draft> = {}
      for (const row of data ?? []) {
        const saved = toDraft(row)
        next[row.branchId] = current[row.branchId] && !same(current[row.branchId], toDraft(row)) ? current[row.branchId] : saved
      }
      return next
    })
  }, [data])

  const dirtyIds = (data ?? []).filter((r) => drafts[r.branchId] && !same(drafts[r.branchId], toDraft(r))).map((r) => r.branchId)
  useUnsavedChanges(dirtyIds.length > 0)

  const set = (id: string, patch: (d: Draft) => Draft) => setDrafts((c) => ({ ...c, [id]: patch(c[id]) }))

  const invalid = (d: Draft) =>
    [d.services, d.products].some((p) => num(p.value) < 0 || (p.type === "PERCENTAGE" && num(p.value) > 100))

  const save = async (row: BranchDiscountRow) => {
    const d = drafts[row.branchId]
    await adminApi.saveDiscount(row.branchId, {
      enabled: d.enabled,
      services: { type: d.services.type, value: num(d.services.value) },
      products: { type: d.products.type, value: num(d.products.value) },
    })
    await reload()
  }

  return (
    <AdminPage>
      <PageHeading
        eyebrow="Offers"
        title="Discounts"
        description="Set a discount for each branch. When it is on, the billing screen starts with it, and staff can still change it on a bill."
      />
      <AsyncNotice loading={loading && !data} error={error} onRetry={() => void reload()} />
      <div className="grid gap-4 lg:grid-cols-2">
        {(data ?? []).map((row) => {
          const d = drafts[row.branchId] ?? toDraft(row)
          const dirty = !same(d, toDraft(row))
          return (
            <section key={row.branchId} className="admin-card p-5" aria-label={`${row.branchName} discount`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display font-800 text-2xl uppercase tracking-wider">{row.branchName}</div>
                  <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                    {d.enabled
                      ? `On: services ${describe(d.services)}, products ${describe(d.products)}`
                      : "Off: bills start with no discount"}
                    {!row.isActive && " · branch is switched off"}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={d.enabled}
                  aria-label={`${row.branchName} discount ${d.enabled ? "on" : "off"}`}
                  className={`relative h-8 w-14 shrink-0 rounded-full border transition-colors ${
                    d.enabled ? "border-[#3D6FA8] bg-[#3D6FA8]" : "border-[var(--border)] bg-[var(--elevated)]"
                  }`}
                  onClick={() => set(row.branchId, (x) => ({ ...x, enabled: !x.enabled }))}
                >
                  <span
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${d.enabled ? "left-7" : "left-1"}`}
                  />
                </button>
              </div>

              <div className={`mt-5 grid gap-4 sm:grid-cols-2 ${d.enabled ? "" : "opacity-60"}`}>
                {(["services", "products"] as const).map((part) => (
                  <div key={part}>
                    <div className="admin-kicker mb-2">{part === "services" ? "On services" : "On products (the total)"}</div>
                    <div className="flex">
                      <div className="flex shrink-0 border border-r-0 border-[var(--border)]" role="group" aria-label={`${part} discount type`}>
                        {(["PERCENTAGE", "FIXED"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            aria-pressed={d[part].type === t}
                            className={`h-12 w-12 font-display text-lg font-700 ${
                              d[part].type === t ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--elevated)] text-[var(--text-muted)]"
                            }`}
                            onClick={() => set(row.branchId, (x) => ({ ...x, [part]: { ...x[part], type: t } }))}
                          >
                            {t === "PERCENTAGE" ? "%" : "₹"}
                          </button>
                        ))}
                      </div>
                      <input
                        className="admin-input h-12 min-w-0 flex-1 text-[16px]"
                        inputMode="decimal"
                        placeholder="0"
                        aria-label={`${row.branchName} ${part} discount`}
                        value={d[part].value}
                        onChange={(event) => {
                          let text = event.target.value.replace(/[^\d.]/g, "")
                          const dot = text.indexOf(".")
                          if (dot >= 0) text = text.slice(0, dot + 1) + text.slice(dot + 1).replace(/\./g, "").slice(0, 2)
                          if (d[part].type === "PERCENTAGE" && Number(text) > 100) text = "100"
                          set(row.branchId, (x) => ({ ...x, [part]: { ...x[part], value: text.slice(0, 9) } }))
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="admin-primary-button mt-5 w-full justify-center"
                disabled={!dirty || invalid(d)}
                title={!dirty ? "Nothing to save yet" : undefined}
                onClick={() =>
                  actions.request({
                    title: `Save the ${row.branchName} discount?`,
                    message: d.enabled
                      ? `From the next bill, ${row.branchName} starts with ${describe(d.services)} on services and ${describe(d.products)} on products.`
                      : `${row.branchName} will start bills with no discount.`,
                    confirmLabel: "Save",
                    action: () => save(row),
                    successMessage: "Discount saved",
                  })
                }
              >
                <Save size={15} /> {dirty ? "Save changes" : "Saved"}
              </button>
            </section>
          )
        })}
      </div>
      {data && data.length === 0 && (
        <div className="admin-card flex items-center gap-3 p-6 text-sm text-[var(--text-muted)]">
          <BadgePercent size={18} /> Add a branch first, then set its discount here.
        </div>
      )}
      {actions.feedback}
    </AdminPage>
  )
}
