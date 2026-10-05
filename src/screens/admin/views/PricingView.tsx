import { EmptyNote } from "../../../components/ui"
import { useEffect, useState } from "react"
import {
  Plus,
  Save,
  Trash2,
} from "lucide-react"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { formatMoney } from "../adminTypes"
import { AsyncNotice, PageHeading, ViewMoreButton } from "../components"
import { useAdminActions } from "../hooks/useAdminActions"

interface PricingRow {
  pricingId: string
  serviceId: string
  name: string
  price: number
  category: string | null
  savedName: string
  savedPrice: number
}

export const PricingView = () => {
  const actions = useAdminActions()
  const branchesState = useAsyncData(() => adminApi.listBranches({ isActive: true }))
  const branches = branchesState.data ?? []
  const [branchId, setBranchId] = useState("")
  const [items, setItems] = useState<PricingRow[]>([])
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [saved, setSaved] = useState(false)
  const [limit, setLimit] = useState(8)

  const branch = branches.find((b) => b.id === branchId)

  useEffect(() => {
    if (!branchId && branches.length) setBranchId(branches[0].id)
  }, [branchId, branches])

  const pricing = useAsyncData(
    () => (branchId ? adminApi.listBranchPricing(branchId) : Promise.resolve([])),
    [branchId],
  )

  useEffect(() => {
    setItems(
      (pricing.data ?? []).map((p) => ({
        pricingId: p.id,
        serviceId: p.serviceId,
        name: p.service.name,
        price: p.price,
        category: p.service.category,
        savedName: p.service.name,
        savedPrice: p.price,
      })),
    )
  }, [pricing.data])

  const dirty = items.filter((i) => i.name !== i.savedName || i.price !== i.savedPrice)
  const categories = items.reduce<Record<string, number>>((acc, item) => {
    const key = item.category || "All services"
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const addService = async () => {
    const trimmed = name.trim()
    const services = await adminApi.listServices()
    let service = services.find((s) => s.name.toLowerCase() === trimmed.toLowerCase())
    if (!service) {
      service = await adminApi.createService({ name: trimmed })
    }
    await adminApi.createBranchPricing(branchId, { serviceId: service.id, price: Number(price) })
    setName("")
    setPrice("")
    await pricing.reload()
  }

  const syncMenu = async () => {
    for (const row of dirty) {
      if (row.name !== row.savedName) {
        await adminApi.updateService(row.serviceId, { name: row.name.trim() })
      }
      if (row.price !== row.savedPrice) {
        await adminApi.updateBranchPricing(branchId, row.pricingId, { price: row.price })
      }
    }
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
    await pricing.reload()
  }

  const busy = (branchesState.loading && !branchesState.data) || (pricing.loading && !pricing.data)
  const error = branchesState.error || pricing.error

  return (
    <div className="pricing-page admin-photo-page min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <PageHeading
            eyebrow="Menu editor"
            title="Menu pricing"
            description="Set the services and prices offered at each branch."
          />
          <div className="pricing-branch-switcher">
            {branches.map((item) => (
              <button
                key={item.id}
                className={branchId === item.id ? "active" : ""}
                onClick={() => {
                  setBranchId(item.id)
                  setLimit(8)
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <AsyncNotice
          loading={busy}
          error={error}
          onRetry={() => {
            void branchesState.reload()
            void pricing.reload()
          }}
        />

        <div className="grid lg:grid-cols-[14rem_1fr] gap-5 mt-7">
          <aside className="pricing-index">
            <div className="admin-kicker">Catalogue index</div>
            {Object.entries(categories).map(([label, count], index) => (
              <button key={label} className={index === 0 ? "active" : ""}>
                <span>{label}</span>
                <strong>{count}</strong>
              </button>
            ))}
            <div className="pricing-sync-note">
              <Save size={17} />
              <span>Saved changes appear in the app straight away.</span>
            </div>
          </aside>

          <section className="pricing-editor">
            <div className="pricing-editor-head">
              <div>
                <div className="admin-kicker">{branch?.name ?? ""}</div>
                <div className="font-display font-800 text-2xl mt-1">
                  {items.length} services
                </div>
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">
                Edit a name or price, then save
              </span>
            </div>
            <div className="pricing-add-row">
              <input
                placeholder="New service name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <input
                placeholder="Price"
                inputMode="numeric"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value.replace(/\D/g, ""))
                }
              />
              <button
                disabled={!name.trim() || !price || !branchId}
                onClick={() => {
                  actions.request({
                    title: "Add this service?",
                    message: `${name} will be added to the ${branch?.name} menu at ${formatMoney(
                      Number(price),
                    )}.`,
                    confirmLabel: "Add service",
                    action: addService,
                    successMessage: "Service added to menu",
                  })
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
            <div className="flex flex-col">
              {items.length === 0 && (
                <EmptyNote>No services are priced for this branch yet.</EmptyNote>
              )}
              {items.slice(0, limit).map((row, index) => (
                <div key={row.pricingId} className="pricing-row">
                  <span className="pricing-row-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <input
                    value={row.name}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((item) =>
                          item.pricingId === row.pricingId
                            ? { ...item, name: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                  <label>
                    <span>₹</span>
                    <input
                      value={row.price}
                      inputMode="numeric"
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((item) =>
                            item.pricingId === row.pricingId
                              ? {
                                  ...item,
                                  price: Number(event.target.value.replace(/\D/g, "")),
                                }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    aria-label={`Remove ${row.name}`}
                    onClick={() =>
                      actions.request({
                        title: "Delete this service?",
                        message: `${row.name} will be removed from the ${branch?.name} menu.`,
                        confirmLabel: "Delete service",
                        destructive: true,
                        action: async () => {
                          await adminApi.deleteBranchPricing(branchId, row.pricingId)
                          await pricing.reload()
                        },
                        successMessage: "Service deleted",
                      })
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            {items.length > limit && (
              <ViewMoreButton onClick={() => setLimit((value) => value + 8)} />
            )}
          </section>
        </div>
        <button
          className="pricing-save-button"
          disabled={dirty.length === 0}
          onClick={() =>
            actions.request({
              title: "Save and sync this menu?",
              message: `${dirty.length} changed ${
                dirty.length === 1 ? "service" : "services"
              } will be published${
                dirty.some((row) => row.name !== row.savedName)
                  ? ". Renaming a service renames it for every branch"
                  : ""
              }.`,
              confirmLabel: "Save & sync",
              action: syncMenu,
              successMessage: "Menu synced successfully",
            })
          }
        >
          <Save size={16} />
          {saved ? "Menu synced successfully" : "Save & sync menu"}
        </button>
      </div>
      {actions.feedback}
    </div>
  )
}
