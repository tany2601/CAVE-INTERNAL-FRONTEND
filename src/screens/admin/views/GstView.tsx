import { useEffect, useState } from "react"
import { Receipt, Save } from "lucide-react"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { billGst, halfRate, isValidGstin, type GstConfig, type GstMode } from "../../../lib/gst"
import { GstModeSelector } from "../components/GstModeSelector"
import { categoryOf, CATEGORY_ORDER } from "../../../lib/menuOrder"
import { formatMoney } from "../adminTypes"
import { AdminPage, AsyncNotice, Field, PageHeading } from "../components"
import { useAdminActions } from "../hooks/useAdminActions"
import { GstBranches } from "./GstBranches"
import { useUnsavedChanges } from "../hooks/useUnsavedChanges"

/** What is typed: rates stay as text so a digit can be deleted without the box jumping to 0. */
interface Draft {
  enabled: boolean
  gstin: string
  legalName: string
  servicesRate: string
  /** How GST works for each service (by id); a service not listed is + GST. */
  serviceModes: Record<string, GstMode>
  productsRate: string
  productsInclusive: boolean
  servicesCode: string
  productsCode: string
}

const toDraft = (c: GstConfig): Draft => ({
  enabled: c.enabled,
  gstin: c.gstin,
  legalName: c.legalName,
  servicesRate: String(c.services.rate),
  serviceModes: { ...c.serviceModes },
  productsRate: String(c.products.rate),
  productsInclusive: c.products.inclusive,
  servicesCode: c.servicesCode,
  productsCode: c.productsCode,
})

const num = (v: string) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const toConfig = (d: Draft): GstConfig => ({
  enabled: d.enabled,
  gstin: d.gstin.trim().toUpperCase(),
  legalName: d.legalName.trim(),
  // A service that is not on the menu (a custom one) always has the GST added on top.
  services: { rate: num(d.servicesRate), inclusive: false },
  // Only what differs from the default (+ GST) is kept, so a service set back to + GST is not a change.
  serviceModes: Object.fromEntries(Object.entries(d.serviceModes).filter(([, m]) => m !== "ADD_ON_TOP").sort(([a], [b]) => a.localeCompare(b))),
  products: { rate: num(d.productsRate), inclusive: d.productsInclusive },
  servicesCode: d.servicesCode.trim(),
  productsCode: d.productsCode.trim(),
})
const same = (a: Draft, b: Draft) => JSON.stringify(toConfig(a)) === JSON.stringify(toConfig(b))

const rateText = (text: string) => {
  let t = text.replace(/[^\d.]/g, "")
  const dot = t.indexOf(".")
  if (dot >= 0) t = t.slice(0, dot + 1) + t.slice(dot + 1).replace(/\./g, "").slice(0, 2)
  return Number(t) > 100 ? "100" : t.slice(0, 6)
}

/** Admin → GST: the GSTIN printed on every bill, the rates, and whether menu prices include the tax. */
export const GstView = () => {
  const actions = useAdminActions()
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [config, services] = await Promise.all([adminApi.getGst(), adminApi.listServices()])
    return { config, services: services.filter((s) => s.isActive) }
  })
  const [draft, setDraft] = useState<Draft | null>(null)

  // Fresh data from the server never overwrites what is being typed.
  useEffect(() => {
    if (!data) return
    setDraft((current) => (current && !same(current, toDraft(data.config)) ? current : toDraft(data.config)))
  }, [data])

  const dirty = !!data && !!draft && !same(draft, toDraft(data.config))
  useUnsavedChanges(dirty)

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d))
  const cfg = draft ? toConfig(draft) : null
  const gstinOk = !!cfg && isValidGstin(cfg.gstin)
  const codeOk = (c: string) => c === "" || /^\d{4,8}$/.test(c)
  const valid = !!cfg && gstinOk && codeOk(cfg.servicesCode) && codeOk(cfg.productsCode)

  // A worked example from the figures on screen, so the effect of each choice is visible before saving.
  const example = cfg ? billGst(cfg, { servicesInclusive: 300, servicesExclusive: 1200, servicesExempt: 150, products: 599 }) : null
  const setMode = (id: string, mode: GstMode) => setDraft((d) => (d ? { ...d, serviceModes: { ...d.serviceModes, [id]: mode } } : d))
  // The menu grouped like the billing screen: Hair, Beard, Skin, Combo, then the rest.
  const groups = new Map<string, { id: string; name: string }[]>()
  for (const svc of data?.services ?? []) {
    const key = categoryOf(svc.name, svc.category)
    groups.set(key, [...(groups.get(key) ?? []), { id: svc.id, name: svc.name }])
  }
  const orderedGroups = [...groups.entries()].sort(([a], [b]) => {
    const rank = (k: string) => (CATEGORY_ORDER.includes(k) ? CATEGORY_ORDER.indexOf(k) : CATEGORY_ORDER.length)
    return rank(a) - rank(b) || a.localeCompare(b)
  })

  const save = async () => {
    if (!cfg) return
    await adminApi.saveGst(cfg)
    await reload()
  }

  return (
    <AdminPage>
      <PageHeading
        eyebrow="Tax"
        title="GST"
        description="Your GSTIN and the business settings (used by every branch and as the starting point for new ones), then each branch's own switch, rates and services. Each bill keeps the figures it was issued with, so changes only affect new bills."
      />
      <AsyncNotice loading={loading && !data} error={error} onRetry={() => void reload()} />
      {draft && cfg && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="admin-card p-5" aria-label="GST settings">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display font-800 text-2xl uppercase tracking-wider">Business settings</div>
                <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                  {draft.enabled
                    ? "On: closed bills are GST tax invoices with their own invoice number (each branch can still switch itself off below)."
                    : "Off: no branch issues GST. Bills have no GST and no invoice number."}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.enabled}
                aria-label={`GST ${draft.enabled ? "on" : "off"}`}
                className={`relative h-8 w-14 shrink-0 rounded-full border transition-colors ${
                  draft.enabled ? "border-[#3D6FA8] bg-[#3D6FA8]" : "border-[var(--border)] bg-[var(--elevated)]"
                }`}
                onClick={() => set({ enabled: !draft.enabled })}
              >
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${draft.enabled ? "left-7" : "left-1"}`} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="GSTIN">
                  <input
                    className="admin-input w-full text-[16px] uppercase tracking-wider"
                    value={draft.gstin}
                    maxLength={15}
                    autoCapitalize="characters"
                    aria-invalid={!gstinOk}
                    onChange={(e) => set({ gstin: e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "") })}
                  />
                </Field>
                <div className={`mt-1 text-[11px] ${gstinOk ? "text-[#4CAF86]" : "text-[#E06060]"}`}>
                  {gstinOk ? "Valid GSTIN. State code " + cfg.gstin.slice(0, 2) : "This is not a valid GSTIN. Check each character."}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Field label="Registered name on the bill (optional)">
                  <input
                    className="admin-input w-full text-[16px]"
                    placeholder="As registered with GST, e.g. CAVE Salons Pvt Ltd"
                    value={draft.legalName}
                    maxLength={120}
                    onChange={(e) => set({ legalName: e.target.value })}
                  />
                </Field>
              </div>

              {(["services", "products"] as const).map((side) => {
                const rate = side === "services" ? draft.servicesRate : draft.productsRate
                const inclusive = draft.productsInclusive
                const code = side === "services" ? draft.servicesCode : draft.productsCode
                return (
                  <div key={side} className="rounded-xl border border-[var(--border-subtle)] p-4">
                    <div className="admin-kicker mb-3">{side === "services" ? "Services" : "Products"}</div>
                    <Field label="Total GST rate (%)">
                      <input
                        className="admin-input w-full text-[16px]"
                        inputMode="decimal"
                        value={rate}
                        aria-label={`${side} GST rate`}
                        onChange={(e) => set(side === "services" ? { servicesRate: rateText(e.target.value) } : { productsRate: rateText(e.target.value) })}
                      />
                    </Field>
                    <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                      CGST {halfRate(num(rate))}% + SGST {halfRate(num(rate))}%
                    </div>
                    {side === "services" ? (
                      <div className="mt-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
                        Whether GST is inside a service's price is set per service below.
                      </div>
                    ) : (
                      <>
                        <div className="mt-3 text-xs text-[var(--text-secondary)]">Product prices</div>
                        <div className="mt-1 flex" role="group" aria-label="product prices and GST">
                          {([false, true] as const).map((inc) => (
                            <button
                              key={String(inc)}
                              type="button"
                              aria-pressed={inclusive === inc}
                              className={`h-11 flex-1 border border-[var(--border)] px-2 text-[11px] font-700 uppercase tracking-wide ${
                                inclusive === inc ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--elevated)] text-[var(--text-muted)]"
                              }`}
                              onClick={() => set({ productsInclusive: inc })}
                            >
                              {inc ? "Include GST" : "GST added on top"}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    <div className="mt-3">
                      <Field label={side === "services" ? "SAC code (optional)" : "HSN code (optional)"}>
                        <input
                          className="admin-input w-full text-[16px]"
                          inputMode="numeric"
                          value={code}
                          maxLength={8}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "")
                            set(side === "services" ? { servicesCode: v } : { productsCode: v })
                          }}
                        />
                      </Field>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-5 rounded-xl border border-[var(--border-subtle)] p-4">
              <div className="admin-kicker">How GST works for each service</div>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                <strong>+ GST</strong>: GST is added on top of the menu price. <strong>Incl. GST</strong>: the customer pays the menu price and the GST is
                taken out of it. <strong>No GST</strong>: no GST is charged and the price is not counted as taxable. Haircuts and beard start as Incl. GST;
                these settings are what every branch starts with.
              </p>
              <div className="mt-3 grid gap-4">
                {orderedGroups.map(([group, items]) => (
                  <div key={group}>
                    <div className="mb-1 text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">{group}</div>
                    <ul className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
                      {items.map((svc) => (
                        <li key={svc.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-2">
                          <span className="min-w-0 text-sm">{svc.name}</span>
                          <GstModeSelector name={svc.name} value={draft.serviceModes[svc.id] ?? "ADD_ON_TOP"} onChange={(m) => setMode(svc.id, m)} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="admin-primary-button mt-5 w-full justify-center"
              disabled={!dirty || !valid}
              title={!dirty ? "Nothing to save yet" : !valid ? "Fix the highlighted fields first" : undefined}
              onClick={() =>
                actions.request({
                  title: "Save the GST settings?",
                  message: cfg.enabled
                    ? `New bills will carry GSTIN ${cfg.gstin}: services ${cfg.services.rate}% (set per service: + GST, Incl. GST or No GST), products ${cfg.products.rate}% (${cfg.products.inclusive ? "included in" : "added to"} the price). Bills already issued do not change.`
                    : "New bills will be issued without GST. Bills already issued do not change.",
                  confirmLabel: "Save",
                  action: save,
                  successMessage: "GST settings saved",
                })
              }
            >
              <Save size={15} /> {dirty ? "Save changes" : "Saved"}
            </button>
          </section>

          <aside className="admin-card p-5" aria-label="Worked example">
            <div className="flex items-center gap-2 font-display text-lg font-700 uppercase tracking-wider">
              <Receipt size={17} /> Example
            </div>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">A haircut at ₹300 (Incl. GST), a ₹1,200 facial (+ GST), a ₹150 service with No GST and a ₹599 product, no discount.</p>
            {example && cfg.enabled ? (
              <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm [font-variant-numeric:tabular-nums]">
                <dt className="admin-kicker col-span-2 mt-1">Services</dt>
                <dt>Taxable value</dt><dd>{formatMoney(example.services.taxable)}</dd>
                <dt>CGST @ {halfRate(example.services.rate)}%</dt><dd>{formatMoney(example.services.cgst)}</dd>
                <dt>SGST @ {halfRate(example.services.rate)}%</dt><dd>{formatMoney(example.services.sgst)}</dd>
                {example.services.exempt > 0 && (
                  <>
                    <dt>Non-GST services (no GST)</dt><dd>{formatMoney(example.services.exempt)}</dd>
                  </>
                )}
                <dt className="font-600">Customer pays</dt><dd className="font-600">{formatMoney(example.services.payable)}</dd>
                <dt className="admin-kicker col-span-2 mt-3">Products</dt>
                <dt>Taxable value</dt><dd>{formatMoney(example.products.taxable)}</dd>
                <dt>CGST @ {halfRate(example.products.rate)}%</dt><dd>{formatMoney(example.products.cgst)}</dd>
                <dt>SGST @ {halfRate(example.products.rate)}%</dt><dd>{formatMoney(example.products.sgst)}</dd>
                <dt className="font-600">Customer pays</dt><dd className="font-600">{formatMoney(example.products.payable)}</dd>
                <dt className="mt-3 border-t border-[var(--border-subtle)] pt-3 font-700">Bill total</dt>
                <dd className="mt-3 border-t border-[var(--border-subtle)] pt-3 font-display text-xl font-800">{formatMoney(example.payable)}</dd>
              </dl>
            ) : (
              <p className="mt-4 text-sm text-[var(--text-muted)]">GST is off, so bills have no tax lines.</p>
            )}
            <p className="mt-4 text-[11px] leading-relaxed text-[var(--text-muted)]">
              The tip is not part of the price and carries no GST. CGST and SGST are always equal halves, worked to the paisa.
            </p>
          </aside>
        </div>
      )}
      {draft && <GstBranches groups={orderedGroups.map(([group, items]) => ({ group, items }))} />}
      {actions.feedback}
    </AdminPage>
  )
}
