import { useRef, useState } from "react"
import { Session, Service } from "../../types"
import { Button, SectionLabel, AmountRow, Select, ServiceTile } from "../../components/ui"
import { formatAmount } from "../../lib/format"
import { useBranchData } from "../../context/BranchDataContext"
import { X, Plus, Minus, Check } from "lucide-react"

interface Props {
  session: Session
  onComplete: (data: {
    services: Service[]
    tip: number
    tipMode: "cash" | "gpay"
    paymentMode: "cash" | "gpay"
    products: { name: string; qty: number; price: number }[]
    discount: number
    discountType: "amount" | "percent"
    discountValue: number
  }) => Promise<void> | void
  onCancel: () => void
}

interface Product {
  name: string
  price: number
  image?: string
  qty: number
}

export default function CloseSession({ session, onComplete, onCancel }: Props) {
  const { services: SERVICES, products: checkoutProducts, getStylist } =
    useBranchData()
  // Retail products managed by admins (Admin → Products).
  const CATALOG: Product[] = checkoutProducts.map((p) => ({
    name: p.name,
    price: p.price,
    qty: 0,
    image: p.imageUrl ?? undefined,
  }))
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedServices, setSelectedServices] = useState<Service[]>(
    session.services,
  )
  // A billed session being corrected by a manager re-opens with its saved values.
  const editing = session.status === "closed"
  const [tip, setTip] = useState(session.tip ?? 0)
  // "Custom" reveals an amount field; an edited bill with a non-preset tip opens in that mode.
  const [customTip, setCustomTip] = useState(
    ![0, 50, 100, 200].includes(session.tip ?? 0),
  )
  const [tipMode, setTipMode] = useState<"cash" | "gpay">(
    session.tipMode ?? "cash",
  )
  const [paymentMode, setPaymentMode] = useState<"cash" | "gpay">(
    session.paymentMode ?? "cash",
  )
  const [products, setProducts] = useState<Product[]>(
    (session.products ?? []).map((p) => ({ ...p })),
  )
  const [discountValue, setDiscountValue] = useState(session.discountValue ?? 0)
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">(
    session.discountType ?? "percent",
  )
  const stylist = getStylist(session.stylistId)

  // Anything selected that isn't on the branch menu is a one-off custom service.
  const menuIds = new Set(SERVICES.map((service) => service.id))
  const customServices = selectedServices.filter((service) => !menuIds.has(service.id))
  const nextCustomId = useRef(0)
  const addCustomService = () =>
    setSelectedServices((current) => [
      ...current,
      { id: `custom-${Date.now()}-${nextCustomId.current++}`, name: "", price: 0 },
    ])
  const updateCustomService = (id: string, patch: Partial<Service>) =>
    setSelectedServices((current) =>
      current.map((service) => (service.id === id ? { ...service, ...patch } : service)),
    )
  const removeCustomService = (id: string) =>
    setSelectedServices((current) => current.filter((service) => service.id !== id))
  const customInvalid = customServices.some(
    (service) => service.name.trim().length === 0 || !(service.price > 0),
  )

  const toggleService = (service: Service) => {
    setSelectedServices((current) =>
      current.some((item) => item.id === service.id)
        ? current.filter((item) => item.id !== service.id)
        : [...current, service],
    )
  }

  const serviceTotal = selectedServices.reduce(
    (sum, service) => sum + service.price,
    0,
  )
  const productTotal = products.reduce(
    (sum, product) => sum + product.price * product.qty,
    0,
  )
  const subtotal = serviceTotal + productTotal
  const discount =
    discountMode === "percent"
      ? Math.min(
          subtotal,
          Math.round((subtotal * Math.min(discountValue, 100)) / 100),
        )
      : Math.min(subtotal, discountValue)
  const total = Math.max(0, subtotal - discount + tip)

  const updateCatalogProduct = (product: Product) => {
    setProducts((current) => {
      const existing = current.find((item) => item.name === product.name)
      if (!existing) return [...current, { ...product, qty: 1 }]
      return current.map((item) =>
        item.name === product.name ? { ...item, qty: item.qty + 1 } : item,
      )
    })
  }

  const updateQuantity = (index: number, delta: number) => {
    setProducts((current) =>
      current
        .map((product, productIndex) =>
          productIndex === index
            ? { ...product, qty: product.qty + delta }
            : product,
        )
        .filter((product) => product.qty > 0),
    )
  }

  return (
    <div className="fixed inset-0 z-40 bg-[var(--bg)] flex flex-col animate-slide-up">
      <div className="flex items-center justify-between px-5 pt-page pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="font-display font-800 tracking-wider uppercase text-base text-[var(--text)]">
            {editing ? "Edit session" : "Complete session"}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {session.customerName} · {stylist ? `with ${stylist.name}` : "No stylist assigned"}
          </div>
        </div>
        <button
          className="w-9 h-9 flex items-center justify-center text-[var(--text-muted)]"
          onClick={onCancel}
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-5 flex flex-col gap-7">
          <div>
            <SectionLabel>Most selected</SectionLabel>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {SERVICES.slice(0, 3).map((service) => {
                const selected = selectedServices.some(
                  (item) => item.id === service.id,
                )
                return (
                  <button
                    key={service.id}
                    className={`flex-shrink-0 px-4 py-2.5 border text-xs font-medium ${
                      selected
                        ? "bg-[var(--text)] text-[var(--bg)] border-[var(--text)]"
                        : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]"
                    }`}
                    onClick={() => toggleService(service)}
                  >
                    {service.name} · {formatAmount(service.price)}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <SectionLabel>All services</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {SERVICES.map((service, index) => {
                const selected = selectedServices.some(
                  (item) => item.id === service.id,
                )
                return (
                  <ServiceTile
                    key={service.id}
                    name={service.name}
                    price={service.price}
                    index={index}
                    selected={selected}
                    onToggle={() => toggleService(service)}
                  />
                )
              })}
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {customServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border-subtle)] p-3 animate-fade-in"
                >
                  <div className="flex-1 min-w-0">
                    <input
                      className="w-full bg-transparent text-sm text-[var(--text)] outline-none"
                      value={service.name}
                      placeholder="Service name"
                      aria-label="Custom service name"
                      maxLength={60}
                      onChange={(event) =>
                        updateCustomService(service.id, { name: event.target.value })
                      }
                    />
                    <div className="flex items-center mt-1 text-[var(--text-muted)]">
                      <span className="text-xs mr-1">₹</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        className="w-24 bg-transparent text-xs outline-none"
                        value={service.price || ""}
                        placeholder="Price"
                        aria-label="Custom service price"
                        onChange={(event) =>
                          updateCustomService(service.id, {
                            price: Math.max(0, Number(event.target.value) || 0),
                          })
                        }
                      />
                    </div>
                  </div>
                  <button
                    aria-label="Remove custom service"
                    className="w-8 h-8 flex items-center justify-center border border-[var(--border)] text-[var(--text-muted)]"
                    onClick={() => removeCustomService(service.id)}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              <button
                className="flex items-center gap-2 py-2 text-[10px] tracking-[0.15em] uppercase text-[var(--text-muted)]"
                onClick={addCustomService}
              >
                <Plus size={13} /> Add custom service
              </button>
              {customInvalid && (
                <div className="text-[10px] text-[#E06060]">
                  Give each custom service a name and a price.
                </div>
              )}
            </div>
          </div>

          <div>
            <SectionLabel>Add products</SectionLabel>
            {CATALOG.length === 0 && (
              <div className="text-xs text-[var(--text-muted)] mb-2">
                No products in the catalogue yet. You can still add a custom product below.
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {CATALOG.map((product) => (
                <button
                  key={product.name}
                  className="bg-[var(--surface)] border border-[var(--border-subtle)] overflow-hidden text-left"
                  onClick={() => updateCatalogProduct(product)}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt=""
                      className="w-full h-20 object-cover grayscale"
                    />
                  ) : (
                    <div className="w-full h-20 bg-[var(--elevated)]" />
                  )}
                  <div className="p-2">
                    <div className="font-display font-700 text-xs text-[var(--text)] truncate">
                      {product.name}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {formatAmount(product.price)}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {products.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border-subtle)] p-3"
                >
                  <div className="flex-1 min-w-0">
                    <input
                      className="w-full bg-transparent text-sm text-[var(--text)] outline-none"
                      value={
                        product.name === "Custom product" ? "" : product.name
                      }
                      placeholder="Custom product"
                      onChange={(event) =>
                        setProducts((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  name: event.target.value || "Custom product",
                                }
                              : item,
                          ),
                        )
                      }
                    />
                    <div className="flex items-center mt-1 text-[var(--text-muted)]">
                      <span className="text-xs mr-1">₹</span>
                      <input
                        type="number"
                        className="w-20 bg-transparent text-xs outline-none"
                        value={product.price || ""}
                        placeholder="Price"
                        onChange={(event) =>
                          setProducts((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    price: Number(event.target.value) || 0,
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="w-8 h-8 flex items-center justify-center border border-[var(--border)] text-[var(--text-muted)]"
                    onClick={() => updateQuantity(index, -1)}
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-display font-700 text-sm text-[var(--text)]">
                    {product.qty}
                  </span>
                  <button
                    className="w-8 h-8 flex items-center justify-center border border-[var(--border)] text-[var(--text)]"
                    onClick={() => updateQuantity(index, 1)}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ))}
              <button
                className="flex items-center gap-2 py-2 text-[10px] tracking-[0.15em] uppercase text-[var(--text-muted)]"
                onClick={() =>
                  setProducts((current) => [
                    ...current,
                    { name: "Custom product", price: 0, qty: 1 },
                  ])
                }
              >
                <Plus size={13} /> Add custom product
              </button>
            </div>
          </div>

          <div>
            <SectionLabel>Discount</SectionLabel>
            <div className="flex">
              <Select
                ariaLabel="Discount type"
                className="w-[4.5rem] shrink-0 bg-[var(--elevated)] border border-r-0 border-[var(--border)] px-3 font-display font-700 text-base text-[var(--text)] outline-none select-compact"
                value={discountMode}
                onChange={(value) => setDiscountMode(value as "amount" | "percent")}
                options={[
                  { value: "percent", label: "% Percent", shortLabel: "%" },
                  { value: "amount", label: "₹ Amount", shortLabel: "₹" },
                ]}
              />
              <input
                type="number"
                inputMode="decimal"
                className="flex-1 min-w-0 bg-[var(--surface)] border border-[var(--border)] px-4 py-3 text-[var(--text)] outline-none"
                placeholder="0"
                value={discountValue || ""}
                onChange={(event) =>
                  setDiscountValue(Number(event.target.value) || 0)
                }
              />
            </div>
            {discount > 0 && (
              <div className="text-[10px] text-[var(--text-muted)] mt-2">
                You’re applying a {formatAmount(discount)} discount.
              </div>
            )}
          </div>

          <div>
            <SectionLabel>Tip</SectionLabel>
            <div className="flex gap-2 mb-3">
              {[0, 50, 100, 200].map((amount) => (
                <button
                  key={amount}
                  className={`flex-1 py-2 border text-xs ${
                    !customTip && tip === amount
                      ? "bg-[var(--text)] text-[var(--bg)] border-[var(--text)]"
                      : "border-[var(--border)] text-[var(--text-muted)]"
                  }`}
                  onClick={() => {
                    setCustomTip(false)
                    setTip(amount)
                  }}
                >
                  {amount ? formatAmount(amount) : "None"}
                </button>
              ))}
              <button
                className={`flex-1 py-2 border text-xs ${
                  customTip
                    ? "bg-[var(--text)] text-[var(--bg)] border-[var(--text)]"
                    : "border-[var(--border)] text-[var(--text-muted)]"
                }`}
                onClick={() => {
                  setCustomTip(true)
                  setTip(0)
                }}
              >
                Custom
              </button>
            </div>
            {customTip && (
              <div className="flex items-center gap-2 mb-3 bg-[var(--surface)] border border-[var(--border)] px-4 animate-fade-in">
                <span className="text-[var(--text-muted)]">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  autoFocus
                  aria-label="Custom tip amount"
                  className="flex-1 min-w-0 bg-transparent py-3 text-[var(--text)] outline-none"
                  placeholder="Enter tip amount"
                  value={tip || ""}
                  onChange={(event) => {
                    const value = Math.round(Math.max(0, Number(event.target.value) || 0) * 100) / 100
                    setTip(value)
                  }}
                />
              </div>
            )}
            <Segmented value={tipMode} onChange={setTipMode} />
          </div>

          <div>
            <SectionLabel>Payment method</SectionLabel>
            <Segmented value={paymentMode} onChange={setPaymentMode} />
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] p-4">
            <SectionLabel>Summary</SectionLabel>
            <AmountRow label="Services" value={formatAmount(serviceTotal)} />
            {productTotal > 0 && (
              <AmountRow label="Products" value={formatAmount(productTotal)} />
            )}
            {discount > 0 && (
              <AmountRow
                label="Discount"
                value={`-${formatAmount(discount)}`}
                muted
              />
            )}
            {tip > 0 && (
              <AmountRow label={`Tip (${tipMode})`} value={formatAmount(tip)} />
            )}
            <div className="border-t border-[var(--border-subtle)] mt-2 pt-3">
              <AmountRow label="Total" value={formatAmount(total)} bold />
            </div>
          </div>

          <div className="text-[11px] text-[var(--text-subtle)]">
            {session.customerPhone
              ? `Bill will be sent to ${session.customerPhone} via WhatsApp.`
              : "No WhatsApp number is saved for this customer."}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-[var(--border-subtle)] safe-bottom bg-[var(--bg)]">
        {submitError && (
          <div className="text-xs text-[#E06060] tracking-wide mb-3 text-center animate-fade-in">
            {submitError}
          </div>
        )}
        <Button
          fullWidth
          size="lg"
          disabled={selectedServices.length === 0 || customInvalid || submitting}
          onClick={async () => {
            setSubmitting(true)
            setSubmitError(null)
            try {
              await onComplete({
                services: selectedServices,
                tip,
                tipMode,
                paymentMode,
                products,
                discount,
                discountType: discountMode,
                discountValue,
              })
            } catch (e) {
              setSubmitError(
                e instanceof Error ? e.message : "Could not close the session.",
              )
              setSubmitting(false)
            }
          }}
        >
          {submitting
            ? editing
              ? "Saving…"
              : "Closing…"
            : editing
              ? `Save changes · ${formatAmount(total)}`
              : `Close & send ${formatAmount(total)} bill`}
        </Button>
      </div>
    </div>
  )
}

function Segmented<T extends "cash" | "gpay">({
  value,
  onChange,
}: {
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["cash", "gpay"] as T[]).map((mode) => (
        <button
          key={mode}
          className={`h-11 border font-display font-700 uppercase tracking-wider text-xs ${
            value === mode
              ? "bg-[var(--text)] text-[var(--bg)] border-[var(--text)]"
              : "bg-[var(--elevated)] text-[var(--text-muted)] border-[var(--border)]"
          }`}
          onClick={() => onChange(mode)}
        >
          {mode === "gpay" ? "GPay" : "Cash"}
        </button>
      ))}
    </div>
  )
}
