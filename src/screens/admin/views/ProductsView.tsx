import { useState } from "react"
import {
  ImagePlus,
  Package,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react"
import { Input } from "../../../components/ui"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { useImageUpload } from "../../../hooks/useImageUpload"
import type { ApiProduct } from "../../../types/api"
import { formatMoney } from "../adminTypes"
import { AdminModal, AdminSelect, AsyncNotice, Field, PageHeading, StatusBadge, ViewMoreButton } from "../components"
import { useAdminActions } from "../hooks/useAdminActions"

interface ProductForm {
  id?: string
  name: string
  price: string
  category: string
  description: string
  image: string | null
  active: boolean
}

const emptyForm: ProductForm = {
  name: "",
  price: "",
  category: "",
  description: "",
  image: null,
  active: true,
}

export function ProductsView() {
  const actions = useAdminActions()
  const { data, loading, error, reload } = useAsyncData(() => adminApi.listProducts())
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState(9)
  const [editing, setEditing] = useState<ProductForm | undefined>()
  const photo = useImageUpload("products")

  const products = data ?? []
  const term = query.trim().toLowerCase()
  const visible = products.filter(
    (p) =>
      !term || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(term),
  )

  const update = (patch: Partial<ProductForm>) =>
    setEditing((current) => (current ? { ...current, ...patch } : current))

  const canSave = (f: ProductForm) =>
    f.name.trim().length > 0 && f.price !== "" && Number(f.price) >= 0 && !photo.uploading

  const save = async (f: ProductForm) => {
    const body = {
      name: f.name.trim(),
      price: Number(f.price),
      category: f.category.trim(),
      description: f.description.trim(),
      imageUrl: f.image ?? "",
      isActive: f.active,
    }
    if (f.id) await adminApi.updateProduct(f.id, body)
    else await adminApi.createProduct(body)
    setEditing(undefined)
    await reload()
  }

  const edit = (p: ApiProduct) =>
    setEditing({
      id: p.id,
      name: p.name,
      price: String(p.price),
      category: p.category,
      description: p.description,
      image: p.imageUrl,
      active: p.isActive,
    })

  return (
    <div className="products-page admin-photo-page min-h-full">
      <div className="max-w-[1350px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <PageHeading
            eyebrow="Retail catalogue"
            title="Products"
            description="Products stylists can add to a bill. Hidden products are not shown at checkout."
          />
          <button
            className="admin-primary-button"
            onClick={() => setEditing({ ...emptyForm })}
          >
            <Plus size={15} /> Add product
          </button>
        </div>

        <label className="admin-input h-12 flex items-center gap-3 mt-6">
          <Search size={16} />
          <input
            className="flex-1 bg-transparent outline-none min-w-0 text-sm"
            placeholder="Search products"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setLimit(9)
            }}
          />
          <span className="text-[9px] text-[var(--text-muted)]">
            {visible.length} of {products.length}
          </span>
        </label>

        <AsyncNotice loading={loading && !data} error={error} onRetry={reload} />

        {data && visible.length === 0 && (
          <div className="mt-10 text-center text-xs text-[var(--text-muted)]">
            {products.length === 0
              ? "No products yet. Add the first one above."
              : "No products match your search."}
          </div>
        )}

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {visible.slice(0, limit).map((p) => (
            <article key={p.id} className="admin-card overflow-hidden flex flex-col">
              <div className="relative h-36 bg-[var(--elevated)] flex items-center justify-center text-[var(--text-faint)]">
                {p.imageUrl ? (
                  <img
                    className="absolute inset-0 h-full w-full object-cover"
                    src={p.imageUrl}
                    alt={p.name}
                  />
                ) : (
                  <Package size={30} strokeWidth={1.4} />
                )}
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-display font-800 text-xl uppercase tracking-wider truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                      {p.category || "Uncategorised"}
                    </div>
                  </div>
                  <StatusBadge
                    label={p.isActive ? "Active" : "Hidden"}
                    tone={p.isActive ? "success" : "danger"}
                  />
                </div>
                {p.description && (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {p.description}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-1">
                  <div className="font-display font-800 text-2xl">{formatMoney(p.price)}</div>
                  <div className="flex gap-2">
                    <button
                      className="admin-icon-button"
                      aria-label={`Edit ${p.name}`}
                      onClick={() => edit(p)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="admin-danger-icon"
                      aria-label={`Delete ${p.name}`}
                      onClick={() =>
                        actions.request({
                          title: `Delete ${p.name}?`,
                          message:
                            "It will no longer be offered at checkout. Past bills keep their product lines.",
                          confirmLabel: "Delete product",
                          destructive: true,
                          action: async () => {
                            await adminApi.deleteProduct(p.id)
                            await reload()
                          },
                          successMessage: `${p.name} deleted`,
                        })
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        {visible.length > limit && (
          <ViewMoreButton onClick={() => setLimit((value) => value + 9)} />
        )}
      </div>

      {editing && (
        <AdminModal
          title={editing.id ? "Edit product" : "Add product"}
          onClose={() => setEditing(undefined)}
        >
          <label className="relative mb-4 flex min-h-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--border)]">
            {editing.image ? (
              <img
                className="absolute inset-0 h-full w-full object-cover"
                src={editing.image}
                alt="Product preview"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                <ImagePlus size={22} />
                <span>{photo.uploading ? "Uploading…" : "Add product image"}</span>
              </div>
            )}
            <Input
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (event) => {
                const image = await photo.upload(event.target.files?.[0])
                if (image) update({ image })
              }}
            />
          </label>
          {photo.error && <div className="mb-3 text-xs text-[#E06060]">{photo.error}</div>}
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Product name">
              <input
                className="admin-input w-full"
                value={editing.name}
                maxLength={100}
                onChange={(event) => update({ name: event.target.value })}
                placeholder="e.g. Matte Clay"
              />
            </Field>
            <Field label="Price">
              <input
                className="admin-input w-full"
                value={editing.price}
                inputMode="decimal"
                onChange={(event) =>
                  update({
                    price: event.target.value
                      .replace(/[^\d.]/g, "")
                      .replace(/(\..*)\./g, "$1")
                      .replace(/^(\d*\.\d{0,2}).*$/, "$1"),
                  })
                }
                placeholder="₹0"
              />
            </Field>
            <Field label="Category">
              <input
                className="admin-input w-full"
                value={editing.category}
                maxLength={60}
                onChange={(event) => update({ category: event.target.value })}
                placeholder="e.g. Styling"
              />
            </Field>
            <Field label="Visibility">
              <AdminSelect
                value={editing.active ? "Active" : "Hidden"}
                onChange={(value) => update({ active: value === "Active" })}
                options={["Active", "Hidden"]}
                full
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <input
                  className="admin-input w-full"
                  value={editing.description}
                  maxLength={300}
                  onChange={(event) => update({ description: event.target.value })}
                  placeholder="Short note shown to admins"
                />
              </Field>
            </div>
          </div>
          <button
            className="admin-primary-button w-full mt-5"
            disabled={!canSave(editing)}
            onClick={() =>
              actions.request({
                title: editing.id ? "Save product changes?" : "Add this product?",
                message: `${editing.name.trim()} will ${
                  editing.id ? "be updated" : "be added"
                } at ${formatMoney(Number(editing.price))}.`,
                confirmLabel: editing.id ? "Save changes" : "Add product",
                action: () => save(editing),
                successMessage: editing.id ? "Product updated" : "Product added",
              })
            }
          >
            <Save size={15} /> Save product
          </button>
        </AdminModal>
      )}
      {actions.feedback}
    </div>
  )
}
