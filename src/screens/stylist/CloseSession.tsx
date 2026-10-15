import { useRef, useState } from "react"
import { Session, Service } from "../../types"
import { Button, SectionLabel, AmountRow, Select, ServiceTile, PhoneInput, HScroller } from "../../components/ui"
import { isValidPhone, sanitizePhone } from "../../lib/phone"
import { billNo, billText, whatsappLink } from "../../lib/billText"
import { formatAmount } from "../../lib/format"
import { round2, sumMoney } from "../../lib/money"
import { freeHaircutIndex } from "../../lib/loyalty"
import { discountOn, groupLines, parseValue, withQty, type DiscountMode } from "../../lib/billing"
import type { BranchDiscountConfig, DiscountSetting } from "../../types/api"
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
    /** Both discounts added up, in rupees. */
    discount: number
    /** The discount on the services and on the products; `amount` is the rupees it takes off. */
    serviceDiscount: { mode: DiscountMode; value: number; amount: number }
    productDiscount: { mode: DiscountMode; value: number; amount: number }
    /** 10-digit WhatsApp number typed at billing, when the customer had none saved. */
    whatsappTo?: string
  }) => Promise<{ id: string } | void> | { id: string } | void
  onCancel: () => void
  /** Sell products only: no services, and no stylist or customer to bill. */
  productOnly?: boolean
}

interface Product {
  name: string
  price: number
  image?: string
  qty: number
}

/** A discount as typed on the billing screen: percent or rupees, and the number (kept as text while typing). */
interface DiscountField {
  mode: DiscountMode
  value: string
}
const noDiscount: DiscountField = { mode: "percent", value: "" }
const fieldOf = (mode: DiscountMode, value: number): DiscountField => ({ mode, value: value > 0 ? String(value) : "" })
const fromSetting = (d: DiscountSetting): DiscountField => fieldOf(d.type === "PERCENTAGE" ? "percent" : "amount", d.value)

/**
 * What the two discount boxes start with: a bill being corrected keeps its own discounts; a new bill starts with
 * the branch's discount when the admin has switched it on (Admin → Discounts), otherwise with none.
 */
function startingDiscounts(session: Session, config: BranchDiscountConfig, editing: boolean): { services: DiscountField; products: DiscountField } {
  if (editing) {
    if (session.serviceDiscount || session.productDiscount) {
      const f = (d: Session["serviceDiscount"]) => (d ? fieldOf(d.mode, d.value) : noDiscount)
      return { services: f(session.serviceDiscount), products: f(session.productDiscount) }
    }
    // A bill from before the two were kept apart: one discount on the whole bill.
    if (session.discountType === "percent" && session.discountValue) {
      const f = fieldOf("percent", session.discountValue)
      return { services: f, products: f }
    }
    if (session.discountType === "amount" && session.discountAmount) {
      const f = fieldOf("amount", session.discountAmount)
      return session.services.length > 0 ? { services: f, products: noDiscount } : { services: noDiscount, products: f }
    }
    return { services: noDiscount, products: noDiscount }
  }
  if (config.enabled) return { services: fromSetting(config.services), products: fromSetting(config.products) }
  return { services: noDiscount, products: noDiscount }
}

export default function CloseSession({ session, onComplete, onCancel, productOnly = false }: Props) {
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
  const stylist = getStylist(session.stylistId)
  const { whatsapp: waSettings, branchName, discount: branchDiscount } = useBranchData()
  const [serviceDiscountField, setServiceDiscountField] = useState<DiscountField>(
    () => startingDiscounts(session, branchDiscount, session.status === "closed").services,
  )
  const [productDiscountField, setProductDiscountField] = useState<DiscountField>(
    () => startingDiscounts(session, branchDiscount, session.status === "closed").products,
  )
  const startedWithBranchDiscount = !editing && branchDiscount.enabled
  const waMode = waSettings.mode
  const [whatsapp, setWhatsapp] = useState("")

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

  // Each service on the bill is one entry, so three haircuts are three entries; the screens show them as
  // "Haircut ×3". Tapping a service adds one more; the − button takes one away.
  const addService = (service: Service) => setSelectedServices((current) => [...current, service])
  const removeServiceUnit = (id: string) =>
    setSelectedServices((current) => {
      const at = current.map((item) => item.id).lastIndexOf(id)
      return at < 0 ? current : current.filter((_, i) => i !== at)
    })
  const qtyOf = (id: string) => selectedServices.filter((item) => item.id === id).length

  // Same arithmetic as the server (paise-exact), so the bill shown here is the bill that gets saved.
  // Menu items are billed at today's menu price. On the customer's free (6th) visit the cheapest
  // haircut is ₹0, which also applies when a manager adds it later while editing the bill.
  const menuPrice = new Map(SERVICES.map((service) => [service.id, service.price]))
  const pricedServices = selectedServices.map((service) => ({
    ...service,
    price: menuPrice.get(service.id) ?? service.price,
  }))
  const freeIndex =
    session.freeVisit && !productOnly
      ? freeHaircutIndex(pricedServices.map((s) => (menuIds.has(s.id) ? s : { name: "", price: s.price })))
      : -1
  const billServices = pricedServices.map((service, index) =>
    index === freeIndex ? { ...service, price: 0 } : service,
  )
  const serviceTotal = sumMoney(billServices.map((service) => service.price))
  const productTotal = sumMoney(products.map((product) => product.price * product.qty))
  const subtotal = round2(serviceTotal + productTotal)
  const serviceDiscountValue = parseValue(serviceDiscountField.value)
  const productDiscountValue = parseValue(productDiscountField.value)
  const serviceDiscountAmount = discountOn(serviceDiscountField.mode, serviceDiscountValue, serviceTotal)
  const productDiscountAmount = discountOn(productDiscountField.mode, productDiscountValue, productTotal)
  const discount = round2(serviceDiscountAmount + productDiscountAmount)
  const total = Math.max(0, round2(subtotal - discount + tip))
  // What is sent for each part: a percentage as typed (at most 100), or the rupees actually taken off.
  const serviceDiscount = {
    mode: serviceDiscountField.mode,
    value: serviceDiscountField.mode === "percent" ? Math.min(serviceDiscountValue, 100) : serviceDiscountAmount,
    amount: serviceDiscountAmount,
  }
  const productDiscount = {
    mode: productDiscountField.mode,
    value: productDiscountField.mode === "percent" ? Math.min(productDiscountValue, 100) : productDiscountAmount,
    amount: productDiscountAmount,
  }
  // Summary lines: the same service several times is one line with its quantity.
  const serviceLines = groupLines(billServices)
  const productLines = groupLines(products.flatMap((p) => Array.from({ length: p.qty }, () => ({ name: p.name, price: p.price }))))
  const menuServiceGroups = [...new Set(selectedServices.filter((s) => menuIds.has(s.id)).map((s) => s.id))]

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
            {productOnly ? "Sell products" : editing ? "Edit session" : "Complete session"}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {productOnly ? "Products only · no services" : `${session.customerName} · ${stylist ? `with ${stylist.name}` : "No stylist assigned"}`}
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
          {!productOnly && (
            <>
          {session.freeVisit && (
            <div
              role="status"
              className="border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs leading-relaxed text-[var(--text-secondary)]"
            >
              <span className="font-display font-700 uppercase tracking-wider text-[var(--text)]">Free visit</span>
              {" · "}
              {freeIndex >= 0
                ? `The haircut is on us (${formatAmount(0)}). Everything else is charged as usual.`
                : "This is the customer's free visit. Add a Haircut and it bills at ₹0."}
            </div>
          )}
          <div>
            <SectionLabel>Most selected</SectionLabel>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {SERVICES.slice(0, 3).map((service) => {
                const qty = qtyOf(service.id)
                return (
                  <button
                    key={service.id}
                    className={`flex-shrink-0 px-4 py-2.5 border text-xs font-medium ${
                      qty > 0
                        ? "bg-[var(--text)] text-[var(--bg)] border-[var(--text)]"
                        : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]"
                    }`}
                    onClick={() => addService(service)}
                  >
                    {service.name} · {formatAmount(service.price)}
                    {qty > 0 && ` · ×${qty}`}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <SectionLabel>All services</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {SERVICES.map((service, index) => (
                <ServiceTile
                  key={service.id}
                  name={service.name}
                  price={service.price}
                  index={index}
                  selected={qtyOf(service.id) > 0}
                  qty={qtyOf(service.id)}
                  onToggle={() => addService(service)}
                />
              ))}
            </div>

            {/* The services on the bill, with how many of each: three people, three haircuts. */}
            {menuServiceGroups.length > 0 && (
              <div className="mt-3 flex flex-col gap-2" aria-label="Selected services">
                {menuServiceGroups.map((id) => {
                  const service = SERVICES.find((x) => x.id === id)!
                  const qty = qtyOf(id)
                  return (
                    <div key={id} className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border-subtle)] p-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[var(--text)] truncate">{service.name}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">
                          {formatAmount(service.price)} each
                          {qty > 1 && ` · ${formatAmount(round2(service.price * qty))}`}
                        </div>
                      </div>
                      <button
                        aria-label={`One less ${service.name}`}
                        className="w-8 h-8 flex items-center justify-center border border-[var(--border)] text-[var(--text)]"
                        onClick={() => removeServiceUnit(id)}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-display font-700 text-sm text-[var(--text)] w-5 text-center">{qty}</span>
                      <button
                        aria-label={`One more ${service.name}`}
                        className="w-8 h-8 flex items-center justify-center border border-[var(--border)] text-[var(--text)]"
                        onClick={() => addService(service)}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

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

            </>
          )}

          <div>
            <SectionLabel>Add products</SectionLabel>
            {CATALOG.length === 0 && (
              <div className="text-xs text-[var(--text-muted)] mb-2">
                No products in the catalogue yet. You can still add a custom product below.
              </div>
            )}
            <HScroller label="products" itemClass="w-36 md:w-52">
              {CATALOG.map((product) => {
                // A product that has been added to the bill shows in colour, with a border and how many were added.
                const qty = products.filter((p) => p.name === product.name).reduce((n, p) => n + p.qty, 0)
                const selected = qty > 0
                return (
                  <button
                    key={product.name}
                    aria-pressed={selected}
                    className={`relative block w-full overflow-hidden border text-left bg-[var(--surface)] transition-colors ${
                      selected ? "border-[var(--text)]" : "border-[var(--border-subtle)]"
                    }`}
                    onClick={() => updateCatalogProduct(product)}
                  >
                    {selected && (
                      <span className="absolute right-1.5 top-1.5 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--text)] px-1.5 text-[11px] font-700 text-[var(--bg)]">
                        ×{qty}
                      </span>
                    )}
                    {product.image ? (
                      <img
                        src={product.image}
                        alt=""
                        className={`w-full h-30 md:h-60 xl:h-70 object-cover transition-[filter] duration-200 ${
                          selected ? "" : "grayscale"
                        }`}
                      />
                    ) : (
                      <div className="w-full h-20 bg-[var(--elevated)]" />
                    )}
                    <div className="p-2">
                      <MiddleEllipsis text={product.name} className="font-display font-700 text-xs text-[var(--text)]" />
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        {formatAmount(product.price)}
                      </div>
                    </div>
                  </button>
                )
              })}
            </HScroller>

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
            {startedWithBranchDiscount && (
              <div className="mb-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
                This branch's discount is applied. You can change it for this bill.
              </div>
            )}
            <div className="flex flex-col gap-3">
              {!productOnly && (
                <DiscountRow
                  label="Services"
                  field={serviceDiscountField}
                  onChange={setServiceDiscountField}
                  taken={serviceDiscountAmount}
                  base={serviceTotal}
                />
              )}
              <DiscountRow
                label="Products"
                field={productDiscountField}
                onChange={setProductDiscountField}
                taken={productDiscountAmount}
                base={productTotal}
              />
            </div>
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
            {serviceLines.length === 0 && productLines.length === 0 && (
              <div className="text-xs text-[var(--text-muted)] pb-2">Nothing selected yet.</div>
            )}
            {serviceLines.map((line) => (
              <AmountRow
                key={`s-${line.name}-${line.price}`}
                label={withQty(line.name || "Custom service", line.qty)}
                value={line.total === 0 ? "FREE" : formatAmount(line.total)}
              />
            ))}
            {productLines.map((line) => (
              <AmountRow key={`p-${line.name}-${line.price}`} label={withQty(line.name, line.qty)} value={formatAmount(line.total)} />
            ))}
            <div className="border-t border-[var(--border-subtle)] mt-2 pt-2">
              {serviceLines.length > 0 && productTotal > 0 && (
                <>
                  <AmountRow label="Services" value={formatAmount(serviceTotal)} muted />
                  <AmountRow label="Products" value={formatAmount(productTotal)} muted />
                </>
              )}
              {serviceDiscountAmount > 0 && (
                <AmountRow label="Discount on services" value={`-${formatAmount(serviceDiscountAmount)}`} muted />
              )}
              {productDiscountAmount > 0 && (
                <AmountRow label="Discount on products" value={`-${formatAmount(productDiscountAmount)}`} muted />
              )}
              {tip > 0 && <AmountRow label={`Tip (${tipMode})`} value={formatAmount(tip)} />}
            </div>
            <div className="border-t border-[var(--border-subtle)] mt-2 pt-3">
              <AmountRow label="Total" value={formatAmount(total)} bold />
            </div>
          </div>

          {!editing && (
            <div>
              <SectionLabel>WhatsApp bill</SectionLabel>
              {session.customerPhone ? (
                <div className="text-[11px] leading-relaxed text-[var(--text-subtle)]">
                  The bill will be sent to {session.customerPhone} on WhatsApp when you close it.
                </div>
              ) : (
                <>
                  <PhoneInput
                    value={whatsapp}
                    onChange={setWhatsapp}
                    placeholder="Customer's WhatsApp number (optional)"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] px-4 py-3 text-[var(--text)] outline-none"
                  />
                  <div className="mt-2 text-[11px] leading-relaxed text-[var(--text-subtle)]">
                    {whatsapp.length === 10
                      ? `The bill will be sent to +91 ${whatsapp} on WhatsApp.`
                      : "Add a number to send the bill on WhatsApp, or leave it empty."}
                  </div>
                </>
              )}
            </div>
          )}
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
          disabled={
            (productOnly ? products.length === 0 || subtotal <= 0 : selectedServices.length === 0) ||
            customInvalid ||
            submitting
          }
          onClick={async () => {
            setSubmitting(true)
            setSubmitError(null)
            // Manual WhatsApp mode: browsers only let a tap open a new window, and billing takes a moment,
            // so a blank window is opened right now and pointed at the customer's chat once the bill is saved.
            const savedNumber = sanitizePhone(session.customerPhone ?? "")
            const chatNumber = isValidPhone(savedNumber) ? savedNumber : whatsapp
            const chatWindow =
              waMode === "manual" && !editing && isValidPhone(chatNumber) ? window.open("", "_blank") : null
            try {
              const closed = await onComplete({
                services: billServices,
                tip,
                tipMode,
                paymentMode,
                products,
                discount,
                serviceDiscount,
                productDiscount,
                whatsappTo: !session.customerPhone && isValidPhone(whatsapp) ? whatsapp : undefined,
              })
              if (chatWindow) {
                const link = whatsappLink(
                  chatNumber,
                  billText({
                    customerName: session.customerName,
                    branchName,
                    services: billServices,
                    products,
                    discountAmount: discount,
                    tip,
                    total,
                    paymentMode,
                    billNo: billNo(closed?.id ?? session.id),
                  }),
                )
                if (link) chatWindow.location.href = link
                else chatWindow.close()
              }
            } catch (e) {
              chatWindow?.close()
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
              : productOnly
                ? `Bill ${formatAmount(total)}`
                : `Close & send ${formatAmount(total)} bill`}
        </Button>
      </div>
    </div>
  )
}

/** One line that never spills out of its card: a long name is cut in the middle and ends with its last two words. */
function MiddleEllipsis({ text, className = "" }: { text: string; className?: string }) {
  const words = text.trim().split(/\s+/)
  if (words.length <= 3) {
    return (
      <div title={text} className={`truncate ${className}`}>
        {text}
      </div>
    )
  }
  return (
    <div title={text} className={`flex min-w-0 ${className}`}>
      <span className="min-w-0 truncate">{words.slice(0, -2).join(" ")}</span>
      <span className="max-w-[60%] shrink-0 truncate">&nbsp;{words.slice(-2).join(" ")}</span>
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

/** One discount: % or ₹ and the number, and what it takes off. */
function DiscountRow({
  label,
  field,
  onChange,
  taken,
  base,
}: {
  label: string
  field: DiscountField
  onChange: (next: DiscountField) => void
  taken: number
  base: number
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="text-[var(--text-muted)]">
          {base > 0 ? (taken > 0 ? `-${formatAmount(taken)} off ${formatAmount(base)}` : `on ${formatAmount(base)}`) : "nothing to discount yet"}
        </span>
      </div>
      <div className="flex">
        <Select
          ariaLabel={`${label} discount type`}
          className="w-[4.5rem] shrink-0 bg-[var(--elevated)] border border-r-0 border-[var(--border)] px-3 font-display font-700 text-base text-[var(--text)] outline-none select-compact"
          value={field.mode}
          onChange={(value) => onChange({ ...field, mode: value as DiscountMode })}
          options={[
            { value: "percent", label: "% Percent", shortLabel: "%" },
            { value: "amount", label: "₹ Amount", shortLabel: "₹" },
          ]}
        />
        <input
          type="text"
          inputMode="decimal"
          aria-label={`${label} discount`}
          className="flex-1 min-w-0 bg-[var(--surface)] border border-[var(--border)] px-4 py-3 text-[var(--text)] outline-none"
          placeholder="0"
          value={field.value}
          onChange={(event) => {
            // digits and one decimal point only, at most 2 decimals; a percentage never goes past 100
            let text = event.target.value.replace(/[^\d.]/g, "")
            const dot = text.indexOf(".")
            if (dot >= 0) text = text.slice(0, dot + 1) + text.slice(dot + 1).replace(/\./g, "").slice(0, 2)
            if (field.mode === "percent" && Number(text) > 100) text = "100"
            onChange({ ...field, value: text.slice(0, 9) })
          }}
        />
      </div>
    </div>
  )
}
