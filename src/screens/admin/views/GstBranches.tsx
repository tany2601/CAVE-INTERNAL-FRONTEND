import { useEffect, useState } from "react"
import { RotateCcw, Save } from "lucide-react"
import { adminApi } from "../../../lib/api"
import type { BranchGstRow } from "../../../lib/api/admin"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { halfRate, type GstMode } from "../../../lib/gst"
import { GstModeSelector } from "../components/GstModeSelector"
import { AdminSelect, AsyncNotice, Field } from "../components"
import { useAdminActions } from "../hooks/useAdminActions"
import { useUnsavedChanges } from "../hooks/useUnsavedChanges"

interface ServiceGroup {
  group: string
  items: { id: string; name: string }[]
}

/** What is typed for a branch: rates stay as text so a digit can be deleted without the box jumping to 0. */
interface Draft {
  enabled: boolean
  servicesRate: string
  productsRate: string
  productsInclusive: boolean
  serviceModes: Record<string, GstMode>
}

const toDraft = (r: BranchGstRow): Draft => ({
  enabled: r.enabled,
  servicesRate: String(r.servicesRate),
  productsRate: String(r.productsRate),
  productsInclusive: r.productsInclusive,
  serviceModes: { ...r.serviceModes },
})
const num = (v: string) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const normal = (d: Draft) =>
  JSON.stringify({ ...d, servicesRate: num(d.servicesRate), productsRate: num(d.productsRate), serviceModes: Object.fromEntries(Object.entries(d.serviceModes).filter(([, m]) => m !== "ADD_ON_TOP").sort(([a], [b]) => a.localeCompare(b))) })
const rateText = (text: string) => {
  let t = text.replace(/[^\d.]/g, "")
  const dot = t.indexOf(".")
  if (dot >= 0) t = t.slice(0, dot + 1) + t.slice(dot + 1).replace(/\./g, "").slice(0, 2)
  return Number(t) > 100 ? "100" : t.slice(0, 6)
}

function Switch({ on, label, onClick, small }: { on: boolean; label: string; onClick: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`relative shrink-0 rounded-full border transition-colors ${small ? "h-7 w-12" : "h-8 w-14"} ${
        on ? "border-[#3D6FA8] bg-[#3D6FA8]" : "border-[var(--border)] bg-[var(--elevated)]"
      }`}
      onClick={onClick}
    >
      <span
        className={`absolute rounded-full bg-white transition-all ${small ? "top-0.5 h-5 w-5" : "top-1 h-6 w-6"} ${
          on ? (small ? "left-6" : "left-7") : small ? "left-0.5" : "left-1"
        }`}
      />
    </button>
  )
}

/**
 * Admin → GST → Branch settings: pick a branch from the list and change just that branch: its GST switch, its rates and
 * which services have GST inside their price. A branch that was never customised follows the business settings above
 * (5% on services, 18% on products), and so does every new branch.
 */
export function GstBranches({ groups }: { groups: ServiceGroup[] }) {
  const actions = useAdminActions()
  const { data, loading, error, reload } = useAsyncData(() => adminApi.listBranchGst())
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rows = data ?? []
  const row = rows.find((r) => r.branchId === selectedId) ?? rows[0]
  // The first branch is shown until another is picked.
  useEffect(() => {
    if (!selectedId && rows[0]) setSelectedId(rows[0].branchId)
  }, [rows, selectedId])

  // Fresh data from the server never overwrites what is being typed.
  useEffect(() => {
    setDrafts((current) => {
      const next: Record<string, Draft> = {}
      for (const r of data ?? []) {
        const saved = toDraft(r)
        next[r.branchId] = current[r.branchId] && normal(current[r.branchId]) !== normal(saved) ? current[r.branchId] : saved
      }
      return next
    })
  }, [data])

  const d = row ? (drafts[row.branchId] ?? toDraft(row)) : null
  const dirty = !!row && !!d && normal(d) !== normal(toDraft(row))
  useUnsavedChanges(dirty)

  const set = (patch: Partial<Draft>) => row && setDrafts((c) => ({ ...c, [row.branchId]: { ...(c[row.branchId] ?? toDraft(row)), ...patch } }))
  const setMode = (serviceId: string, mode: GstMode) => d && set({ serviceModes: { ...d.serviceModes, [serviceId]: mode } })

  /** Switching branch with edits not saved asks first, so nothing is lost by accident. */
  const pick = (name: string) => {
    const next = rows.find((r) => r.branchName === name)
    if (!next || next.branchId === row?.branchId) return
    if (!dirty || !row) return setSelectedId(next.branchId)
    actions.request({
      title: "Leave without saving?",
      message: `You changed the GST settings of ${row.branchName} but did not save them. If you go to ${next.branchName} now, those changes are lost.`,
      confirmLabel: "Discard and switch",
      destructive: true,
      action: () => {
        setDrafts((c) => ({ ...c, [row.branchId]: toDraft(row) }))
        setSelectedId(next.branchId)
      },
    })
  }

  const save = async () => {
    if (!row || !d) return
    await adminApi.saveBranchGst(row.branchId, {
      enabled: d.enabled,
      servicesRate: num(d.servicesRate),
      productsRate: num(d.productsRate),
      productsInclusive: d.productsInclusive,
      // Every service is sent with its mode (a service not touched is + GST)
      serviceModes: Object.fromEntries(groups.flatMap((g) => g.items.map((svc) => [svc.id, d.serviceModes[svc.id] ?? "ADD_ON_TOP"]))),
    })
    await reload()
  }
  const invalid = !!d && (num(d.servicesRate) > 100 || num(d.productsRate) > 100)

  return (
    <section className="mt-8" aria-label="GST for each branch">
      <div className="font-display text-2xl font-800 uppercase tracking-wider">GST for each branch</div>
      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-muted)]">
        Choose a branch, then switch its GST on or off, change its rates, and choose which services have GST inside their price. A branch
        you have not changed follows the business settings above (5% on services, 18% on products), and so does every new branch.
      </p>
      <AsyncNotice loading={loading && !data} error={error} onRetry={() => void reload()} />

      {row && d && (
        <div className="mt-4 max-w-3xl">
          <div className="mb-4 max-w-sm">
            <Field label="Branch">
              <AdminSelect value={row.branchName} onChange={pick} options={rows.map((r) => r.branchName)} full />
            </Field>
          </div>

          <article className="admin-card p-5" aria-label={`${row.branchName} GST`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display text-xl font-800 uppercase tracking-wider">{row.branchName}</div>
                <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                  {d.enabled
                    ? `GST on · services ${num(d.servicesRate)}% · products ${num(d.productsRate)}% ${d.productsInclusive ? "inside the price" : "added on top"}`
                    : "GST off: bills from this branch have no GST"}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-subtle)]">
                  {row.customised ? "Customised for this branch" : "Following the business settings"}
                  {!row.isActive && " · branch is switched off"}
                </div>
              </div>
              <Switch on={d.enabled} label={`${row.branchName} GST ${d.enabled ? "on" : "off"}`} onClick={() => set({ enabled: !d.enabled })} />
            </div>

            <div className={`mt-5 flex flex-col gap-5 ${d.enabled ? "" : "opacity-60"}`}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Field label="Services GST rate (%)">
                    <input
                      className="admin-input w-full text-[16px]"
                      inputMode="decimal"
                      value={d.servicesRate}
                      aria-label={`${row.branchName} services GST rate`}
                      onChange={(e) => set({ servicesRate: rateText(e.target.value) })}
                    />
                  </Field>
                  <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                    CGST {halfRate(num(d.servicesRate))}% + SGST {halfRate(num(d.servicesRate))}%
                  </div>
                </div>
                <div>
                  <Field label="Products GST rate (%)">
                    <input
                      className="admin-input w-full text-[16px]"
                      inputMode="decimal"
                      value={d.productsRate}
                      aria-label={`${row.branchName} products GST rate`}
                      onChange={(e) => set({ productsRate: rateText(e.target.value) })}
                    />
                  </Field>
                  <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                    CGST {halfRate(num(d.productsRate))}% + SGST {halfRate(num(d.productsRate))}%
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs text-[var(--text-secondary)]">Product prices</div>
                <div className="flex" role="group" aria-label={`${row.branchName} product prices and GST`}>
                  {([false, true] as const).map((inc) => (
                    <button
                      key={String(inc)}
                      type="button"
                      aria-pressed={d.productsInclusive === inc}
                      className={`h-11 flex-1 border border-[var(--border)] px-2 text-[11px] font-700 uppercase tracking-wide ${
                        d.productsInclusive === inc ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--elevated)] text-[var(--text-muted)]"
                      }`}
                      onClick={() => set({ productsInclusive: inc })}
                    >
                      {inc ? "Include GST" : "GST added on top"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="admin-kicker">How GST works for each service</div>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                  <strong>+ GST</strong>: added on top of the menu price. <strong>Incl. GST</strong>: inside the menu price. <strong>No GST</strong>: no GST charged and
                  not counted as taxable.
                </p>
                <div className="mt-2 grid gap-4">
                  {groups.map(({ group, items }) => (
                    <div key={group}>
                      <div className="mb-1 text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">{group}</div>
                      <ul className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
                        {items.map((svc) => (
                          <li key={svc.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-2">
                            <span className="min-w-0 text-sm">{svc.name}</span>
                            <GstModeSelector name={`${row.branchName} · ${svc.name}`} value={d.serviceModes[svc.id] ?? "ADD_ON_TOP"} onChange={(m) => setMode(svc.id, m)} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                className="admin-primary-button flex-1 justify-center"
                disabled={!dirty || invalid}
                title={!dirty ? "Nothing to save yet" : undefined}
                onClick={() =>
                  actions.request({
                    title: `Save the ${row.branchName} GST settings?`,
                    message: d.enabled
                      ? `From the next bill, ${row.branchName} charges GST at ${num(d.servicesRate)}% on services and ${num(d.productsRate)}% on products. Bills already issued do not change.`
                      : `From the next bill, ${row.branchName} issues bills without GST. Bills already issued do not change.`,
                    confirmLabel: "Save",
                    action: save,
                    successMessage: "GST settings saved",
                  })
                }
              >
                <Save size={15} /> {dirty ? "Save changes" : "Saved"}
              </button>
              {row.customised && (
                <button
                  className="admin-secondary-button justify-center"
                  title="Go back to the business settings"
                  onClick={() =>
                    actions.request({
                      title: `Use the business settings for ${row.branchName}?`,
                      message: "This branch goes back to the business GST settings above. Bills already issued do not change.",
                      confirmLabel: "Use business settings",
                      action: async () => {
                        await adminApi.resetBranchGst(row.branchId)
                        await reload()
                      },
                      successMessage: "Branch follows the business settings",
                    })
                  }
                >
                  <RotateCcw size={14} /> Use business settings
                </button>
              )}
            </div>
          </article>
        </div>
      )}
      {actions.feedback}
    </section>
  )
}
