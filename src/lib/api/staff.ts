import { request } from "./http"
import type {
  ApiCheckoutProduct,
  ApiChecklistItem,
  ApiDay,
  ApiPayout,
  ApiStylist,
  ApiExpense,
  ApiMenuItem,
  ApiSession,
  ApiTransactionType,
  ApiPaymentMode,
  CloseSessionPayload,
  CustomerLookupResponse,
  TodayResponse,
} from "../../types/api"

export const getMenu = () =>
  request<{ data: ApiMenuItem[] }>("GET", "/staff/menu").then((r) => r.data)

export const getToday = () => request<TodayResponse>("GET", "/staff/today")

export const lookupCustomer = (phone: string) =>
  request<CustomerLookupResponse>("GET", "/staff/customers/lookup", {
    query: { phone },
  })

export const createSession = (body: {
  customerName: string
  customerMobile?: string
  stylistId?: string
  /** Menu items (servicePricingIds) picked at check-in; pre-selected at billing. */
  serviceIds?: string[]
  /** Start the service timer in the same request. */
  startNow?: boolean
}) =>
  request<{ session: ApiSession }>("POST", "/staff/sessions", { body }).then(
    (r) => r.session,
  )

export const startService = (sessionId: string) =>
  request<{ session: ApiSession }>(
    "POST",
    `/staff/sessions/${sessionId}/start-service`,
  ).then((r) => r.session)

export const closeSession = (sessionId: string, body: CloseSessionPayload) =>
  request<{ session: ApiSession }>(
    "POST",
    `/staff/sessions/${sessionId}/close`,
    { body },
  ).then((r) => r.session)

export const createExpense = (body: {
  type: ApiTransactionType
  description: string
  amount: number
  paymentMode: ApiPaymentMode
  employeeId?: string
}) => request<ApiExpense>("POST", "/staff/expenses", { body })

export const getStats = (period: "TODAY" | "THIS_WEEK" | "THIS_MONTH") =>
  request<{ period: string; stylists: ApiStylist[] }>("GET", "/staff/stats", {
    query: { period },
  }).then((r) => r.stylists)

export const setOpeningBalance = (cash: number, gpay: number) =>
  request<ApiDay>("PUT", "/staff/day/opening", { body: { cash, gpay } })

export const closeDay = (actualCash: number, actualGpay: number) =>
  request<ApiDay>("POST", "/staff/day/close", { body: { actualCash, actualGpay } })

export const createPayout = (body: {
  userId: string
  paymentMode: ApiPaymentMode
  kind?: "COMMISSION" | "TIP_WITHDRAWAL"
  amount?: number
  note?: string
}) => request<ApiPayout>("POST", "/staff/payouts", { body })

export const getChecklist = () =>
  request<{ data: ApiChecklistItem[] }>("GET", "/staff/checklist").then((r) => r.data)

export const setChecklistItem = (taskId: string, done: boolean) =>
  request<{ data: ApiChecklistItem[] }>("PUT", `/staff/checklist/${taskId}`, {
    body: { done },
  }).then((r) => r.data)

export const editSession = (sessionId: string, body: CloseSessionPayload) =>
  request<{ session: ApiSession }>("PATCH", `/staff/sessions/${sessionId}`, {
    body,
  }).then((r) => r.session)

export const deleteSession = (sessionId: string) =>
  request<{ message: string }>("DELETE", `/staff/sessions/${sessionId}`)

export const getProducts = () =>
  request<{ data: ApiCheckoutProduct[] }>("GET", "/staff/products").then((r) => r.data)
