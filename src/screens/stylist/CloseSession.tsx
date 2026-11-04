import { useRef, useState } from "react"
import { Session, Service } from "../../types"
import { Button, SectionLabel, AmountRow, Select, ServiceColorTile, PhoneInput, HScroller, QtyStepper, PayLabel, QuickSteps } from "../../components/ui"
import { isValidPhone, sanitizePhone } from "../../lib/phone"
import { billNo, billText, invoiceOf, whatsappLink } from "../../lib/billText"
import { billGst, serviceNets, type GstConfig } from "../../lib/gst"
import { assignServiceColors } from "../../lib/serviceColors"
import { formatAmount } from "../../lib/format"
import { round2, sumMoney } from "../../lib/money"
import { freeHaircutIndex } from "../../lib/loyalty"
import { discountOn, groupLines, gstRows, parseValue, withQty, type DiscountMode } from "../../lib/billing"
import type { BranchDiscountConfig, DiscountSetting } from "../../types/api"
import { useBranchData } from "../../context/BranchDataContext"
import { X, Plus, Minus, Check, ArrowLeft } from "lucide-react"

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
    /** The total on screen; the server refuses the bill if it works out a different one. */
    total: number
  }) => Promise<{ id: string; session?: Session } | void> | { id: string; session?: Session } | void
  /** A quick bill: the bill is made in steps (services, products, then the bill) instead of one long page. */
  wizard?: boolean
  /** May be async (a quick bill is removed from the server); if it throws, the message is shown and the bill stays open. */
  onCancel: () => void | Promise<void>
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

export default function CloseSession({ session, onComplete, onCancel, productOnly = false, wizard = false }: Props) {
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
  // Quick bill: which step is showing. Everything else about the bill (totals, GST, discounts) is the same page.
  const [step, setStep] = useState<"services" | "products" | "summary">("services")
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement | null>(null)
  const goTo = (next: "services" | "products" | "summary") => {
    setStep(next)
    scroller.current?.scrollTo({ top: 0 })
  }
  /** Is this part of the page showing? (A normal bill shows everything.) */
  const showIn = (...steps: Array<"services" | "products" | "summary">) => !wizard || steps.includes(step)
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
  // Nothing is pre-selected on a new bill: a button lights up only once the person has tapped it. A bill being
  // corrected opens with what was saved.
  const [tipTouched, setTipTouched] = useState(editing)
  const [tipMode, setTipMode] = useState<"cash" | "gpay" | null>(editing ? (session.tipMode ?? session.paymentMode ?? null) : null)
  const [paymentMode, setPaymentMode] = useState<"cash" | "gpay" | null>(editing ? (session.paymentMode ?? null) : null)
  const [products, setProducts] = useState<Product[]>(
    (session.products ?? []).map((p) => ({ ...p })),
  )
  const stylist = getStylist(session.stylistId)
  const { whatsapp: waSettings, branchName, branchAddress, branchPhone, gst: gstConfig, discount: branchDiscount } = useBranchData()
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
  const serviceColors = assignServiceColors(SERVICES.map((s) => s.name))
  const colorOf = (name: string) => serviceColors.get(name) ?? "#475569"
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
  // GST: worked from the services and the products after their own discounts; the tip carries none. A new bill
  // uses today's GST settings; a bill being corrected keeps the terms it was issued under (and a bill from before
  // GST stays without).
  const servicesNet = round2(serviceTotal - serviceDiscountAmount)
  const productsNet = round2(productTotal - productDiscountAmount)
  const gstTerms: Pick<GstConfig, "services" | "products"> | null = editing
    ? session.gst
      ? { services: session.gst.services, products: session.gst.products }
      : null
    : gstConfig
  // Services whose price includes GST (haircuts and beard unless the admin chose otherwise) and the rest, which
  // have it added on top, share the services discount in proportion (same rule as the server).
  const inclusiveIds = (editing ? session.gst?.inclusiveServiceIds : gstConfig?.inclusiveServiceIds) ?? []
  const serviceIdOf = new Map(SERVICES.map((s) => [s.id, s.serviceId]))
  const includesGst = (s: Service) => {
    const serviceId = serviceIdOf.get(s.id)
    return serviceId ? inclusiveIds.includes(serviceId) : (gstTerms?.services.inclusive ?? false)
  }
  const inclusiveGross = sumMoney(billServices.filter(includesGst).map((s) => s.price))
  const nets = serviceNets(inclusiveGross, round2(serviceTotal - inclusiveGross), serviceDiscountAmount)
  const gst = gstTerms
    ? billGst(gstTerms, { servicesInclusive: nets.inclusive, servicesExclusive: nets.exclusive, products: productsNet })
    : null
  const total = Math.max(0, round2((gst ? gst.payable : servicesNet + productsNet) + tip))
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

  const updateCatalogProduct = (product: Product) => {
    setProducts((current) => {
      const existing = current.find((item) => item.name === product.name)
      if (!existing) return [...current, { ...product, qty: 1 }]
      return current.map((item) =>
        item.name === product.name ? { ...item, qty: item.qty + 1 } : item,
      )
    })
  }

  const decreaseCatalogProduct = (product: Product) =>
    setProducts((current) => {
      const at = current.findIndex((item) => item.name === product.name)
      if (at < 0) return current
      return current
        .map((item, i) => (i === at ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0)
    })

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

  const closeBill = async () => {
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
        tipMode: tipMode ?? paymentMode!,
        paymentMode: paymentMode!,
        products,
        discount,
        serviceDiscount,
        productDiscount,
        whatsappTo: !session.customerPhone && isValidPhone(whatsapp) ? whatsapp : undefined,
        total,
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
            total: closed?.session?.total ?? total,
            paymentMode: paymentMode!,
            billNo: billNo(closed?.id ?? session.id),
            invoice: invoiceOf(closed?.session, gstConfig, branchAddress, branchPhone),
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
  }

  return (
    <div className="fixed inset-0 z-40 bg-[var(--bg)] flex flex-col animate-slide-up">
      <div className="flex items-center justify-between px-5 pt-page pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="font-display font-800 tracking-wider uppercase text-base text-[var(--text)]">
            {wizard ? "Quick bill" : productOnly ? "Sell products" : editing ? "Edit session" : "Complete session"}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {productOnly ? "Products only · no services" : `${session.customerName} · ${stylist ? `with ${stylist.name}` : "No stylist assigned"}`}
          </div>
        </div>
        <button
          className="w-9 h-9 flex items-center justify-center text-[var(--text-muted)]"
          aria-label="Cancel"
          onClick={wizard ? () => setConfirmCancel(true) : onCancel}
        >
          <X size={18} />
        </button>
      </div>
      {wizard && (
        <div className="border-b border-[var(--border-subtle)] px-5 py-3">
          <QuickSteps current={step === "services" ? 2 : step === "products" ? 3 : 4} />
        </div>
      )}

      <div ref={scroller} className="flex-1 overflow-y-auto">
        <div className="px-5 py-5 flex flex-col gap-7">
          {wizard && step === "services" && (
            <div className="order-first">
              <h1 className="font-display text-2xl font-800 leading-tight text-[var(--text)]">What did the customer have?</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Tap each service once. Tap again, or use + and −, if the customer had it more than once.</p>
            </div>
          )}
          {wizard && step === "products" && (
            <div className="order-first">
              <h1 className="font-display text-2xl font-800 leading-tight text-[var(--text)]">Did the customer buy a product?</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Tap the product to add it. If the customer bought nothing, tap “No product”.</p>
            </div>
          )}
          {wizard && step === "summary" && (
            <div className="order-first">
              <h1 className="font-display text-2xl font-800 leading-tight text-[var(--text)]">Check the bill</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Look at the total, add a discount or tip if needed, choose how the customer paid, then close the bill.</p>
            </div>
          )}
          {!productOnly && showIn("services") && (
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
                    <span aria-hidden className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: colorOf(service.name) }} />
                    {service.name} · {formatAmount(service.price)}
                    {qty > 0 && ` · ×${qty}`}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <SectionLabel>All services</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
              {SERVICES.map((service) => (
                <ServiceColorTile
                  key={service.id}
                  name={service.name}
                  price={service.price}
                  color={colorOf(service.name)}
                  qty={qtyOf(service.id)}
                  onAdd={() => addService(service)}
                  onRemove={() => removeServiceUnit(service.id)}
                />
              ))}
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

            </>
          )}

          {showIn("products") && (
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
                  <div
                    key={product.name}
                    className={`relative overflow-hidden border bg-[var(--surface)] transition-colors ${
                      selected ? "border-[var(--text)]" : "border-[var(--border-subtle)]"
                    }`}
                  >
                    <button aria-pressed={selected} type="button" className="block w-full text-left" onClick={() => updateCatalogProduct(product)}>
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
                      <div className="p-2 pb-12">
                        <MiddleEllipsis text={product.name} className="font-display font-700 text-xs text-[var(--text)]" />
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatAmount(product.price)}</div>
                      </div>
                    </button>
                    {/* The count lives inside the card, at the bottom. */}
                    {selected && (
                      <QtyStepper
                        qty={qty}
                        label={product.name}
                        onMinus={() => decreaseCatalogProduct(product)}
                        onPlus={() => updateCatalogProduct(product)}
                        className="absolute bottom-2 right-2"
                      />
                    )}
                  </div>
                )
              })}
            </HScroller>

            <div className="mt-3 flex flex-col gap-2">
              {products.map((product, index) =>
                CATALOG.some((c) => c.name === product.name) ? null : (
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
          )}

          {showIn("summary") && (
            <>
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
                    tipTouched && !customTip && tip === amount
                      ? "bg-[var(--text)] text-[var(--bg)] border-[var(--text)]"
                      : "border-[var(--border)] text-[var(--text-muted)]"
                  }`}
                  onClick={() => {
                    setTipTouched(true)
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
                  setTipTouched(true)
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
            <div className="mb-1.5 text-[11px] text-[var(--text-muted)]">Tip paid by{tip > 0 ? "" : " (if there is a tip)"}</div>
            <Segmented value={tipMode} onChange={setTipMode} label="Tip paid by" />
          </div>

          <div>
            <SectionLabel>Payment method</SectionLabel>
            <Segmented value={paymentMode} onChange={setPaymentMode} label="Payment method" />
          </div>

          <div className={`bg-[var(--surface)] border border-[var(--border-subtle)] p-4 ${wizard ? "order-first" : ""}`}>
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
                  <AmountRow label="Services" value={formatAmount(serviceTotal)} />
                  <AmountRow label="Products" value={formatAmount(productTotal)} />
                </>
              )}
              {serviceDiscountAmount > 0 && (
                <AmountRow label="Discount on services" value={`-${formatAmount(serviceDiscountAmount)}`} />
              )}
              {productDiscountAmount > 0 && (
                <AmountRow label="Discount on products" value={`-${formatAmount(productDiscountAmount)}`} />
              )}
              {gst &&
                gstRows(gst, { services: gstConfig?.servicesCode, products: gstConfig?.productsCode }).map((row) => (
                  <AmountRow key={row.label} label={row.label} value={formatAmount(row.amount)} />
                ))}
              {tip > 0 && <AmountRow label={tipMode ? `Tip (${tipMode === "gpay" ? "GPay" : "cash"})` : "Tip"} value={formatAmount(tip)} />}
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
            </>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-[var(--border-subtle)] safe-bottom bg-[var(--bg)]">
        {submitError && (
          <div className="text-xs text-[#E06060] tracking-wide mb-3 text-center animate-fade-in">
            {submitError}
          </div>
        )}
        {wizard && step === "services" && (
          <>
            {(selectedServices.length === 0 || customInvalid) && (
              <div className="mb-2 text-center text-sm text-[var(--text-muted)]">
                {customInvalid ? "Fill in the name and price of the custom service." : "Tap at least one service to continue."}
              </div>
            )}
            <Button fullWidth size="lg" disabled={selectedServices.length === 0 || customInvalid} onClick={() => goTo("products")}>
              Next: products →
            </Button>
          </>
        )}
        {wizard && step === "products" && (
          <>
            {products.length === 0 && (
              <div className="mb-2 text-center text-sm text-[var(--text-muted)]">Tap a product to add it, or tap “No product”.</div>
            )}
            <Button
              size="lg"
              fullWidth
              disabled={products.length === 0 || products.some((p) => p.name.trim() === "" || !(p.price > 0))}
              onClick={() => goTo("summary")}
            >
              Next: bill →
            </Button>
            <div className="mt-3 grid grid-cols-[auto_1fr] gap-3">
              <Button variant="outline" size="lg" aria-label="Back to services" onClick={() => goTo("services")}>
                <ArrowLeft size={18} />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  setProducts([])
                  goTo("summary")
                }}
              >
                No product
              </Button>
            </div>
          </>
        )}
        {showIn("summary") && (
          <>
            {!submitting && selectedServices.length + products.length > 0 && (!paymentMode || (tip > 0 && !tipMode)) && (
              <div className="mb-2 text-center text-sm text-[var(--text-muted)]">
                {!paymentMode ? "Choose how the customer paid to close the bill." : "Choose how the tip was paid."}
              </div>
            )}
            <div className="flex gap-3">
              {wizard && (
                <Button variant="outline" size="lg" aria-label="Back to products" onClick={() => goTo("products")}>
                  <ArrowLeft size={18} />
                </Button>
              )}
              <Button
                className="flex-1"
                fullWidth
                size="lg"
                disabled={
                    (productOnly ? products.length === 0 || subtotal <= 0 : selectedServices.length === 0) ||
                    customInvalid ||
                    !paymentMode ||
                    (tip > 0 && !tipMode) ||
                    submitting
                  }
                onClick={closeBill}
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
          </>
        )}
      </div>
      {confirmCancel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-6" role="dialog" aria-modal="true" aria-label="Cancel this bill?">
          <div className="w-full max-w-sm border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="font-display text-xl font-800 text-[var(--text)]">Cancel this bill?</div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Nothing has been charged. The customer will be removed and you will go back to the start.</p>
            <div className="mt-5 flex flex-col gap-2">
              <Button size="lg" fullWidth onClick={() => setConfirmCancel(false)}>
                No, keep billing
              </Button>
              {cancelError && <div className="text-sm text-[#E06060]">{cancelError}</div>}
              <Button
                size="lg"
                fullWidth
                variant="destructive"
                disabled={cancelling}
                onClick={async () => {
                  setCancelling(true)
                  setCancelError(null)
                  try {
                    await onCancel()
                  } catch (e) {
                    setCancelError(e instanceof Error ? e.message : "Could not cancel the bill. Please try again.")
                    setCancelling(false)
                  }
                }}
              >
                {cancelling ? "Cancelling…" : "Yes, cancel the bill"}
              </Button>
            </div>
          </div>
        </div>
      )}
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

function Segmented({
  value,
  onChange,
  label,
}: {
  /** null until the person has chosen: nothing is highlighted before that. */
  value: "cash" | "gpay" | null
  onChange: (value: "cash" | "gpay") => void
  label: string
}) {
  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label={label}>
      {(["cash", "gpay"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          aria-label={mode === "gpay" ? "GPay" : "Cash"}
          className={`flex h-12 items-center justify-center border font-display font-700 uppercase tracking-wider text-xs ${
            value === mode
              ? "bg-[var(--text)] text-[var(--bg)] border-[var(--text)]"
              : "bg-[var(--elevated)] text-[var(--text-muted)] border-[var(--border)]"
          }`}
          onClick={() => onChange(mode)}
        >
          <PayLabel mode={mode} />
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
