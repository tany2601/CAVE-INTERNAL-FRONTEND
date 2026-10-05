import type {
  Expense,
  Service,
  Session,
  Stylist,
} from "../types"
import type {
  ApiExpense,
  ApiMenuItem,
  ApiPaymentMode,
  ApiSession,
  ApiStylist,
} from "../types/api"

const mode = (m: ApiPaymentMode | null): "cash" | "gpay" | undefined =>
  m ? (m === "GPAY" ? "gpay" : "cash") : undefined

export const toApiMode = (m: "cash" | "gpay"): ApiPaymentMode =>
  m === "gpay" ? "GPAY" : "CASH"

export const mapSession = (s: ApiSession): Session => ({
  id: s.id,
  customerName: s.customerName,
  customerPhone: s.customerMobile ?? undefined,
  stylistId: s.stylistId ?? "",
  startTime: new Date(s.startedAt ?? s.createdAt),
  services: s.services.map((x) => ({
    id: x.servicePricingId ?? x.id,
    name: x.serviceName,
    price: x.price,
  })),
  status: s.status === "COMPLETED" ? "closed" : "active",
  total: s.status === "COMPLETED" ? s.totalAmount : undefined,
  paymentMode: mode(s.paymentMode),
  tip: s.tipAmount || undefined,
  // The backend records one payment mode per bill, so the tip follows it.
  tipMode: s.tipAmount ? mode(s.paymentMode) : undefined,
  closedAt: s.closedAt ? new Date(s.closedAt) : undefined,
  products: (s.products ?? []).reduce<{ name: string; price: number; qty: number }[]>(
    (acc, p) => {
      const existing = acc.find((x) => x.name === p.productName && x.price === p.price)
      if (existing) existing.qty += 1
      else acc.push({ name: p.productName, price: p.price, qty: 1 })
      return acc
    },
    [],
  ),
  discountType:
    s.discountType === "PERCENTAGE"
      ? "percent"
      : s.discountType === "FIXED"
        ? "amount"
        : undefined,
  discountValue: s.discountValue || undefined,
  isEdited: s.isEdited,
})

export const mapStylist = (s: ApiStylist): Stylist => ({
  ...s,
  commissionPaid: s.commissionPaid ?? false,
})

export const mapService = (m: ApiMenuItem): Service => ({
  id: m.id,
  name: m.name,
  price: m.price,
})

export const mapExpense = (e: ApiExpense): Expense => ({
  id: e.id,
  type: e.type === "EMPLOYEE_ADVANCE" ? "advance" : "general",
  description: e.description,
  amount: e.amount,
  paymentMode: e.paymentMode === "GPAY" ? "gpay" : "cash",
  addedBy: e.addedBy,
  time: new Date(e.createdAt),
  employeeId: e.employeeId ?? undefined,
})
