import { request, requestBlob } from "./http"
import type {
  ApiProduct,
  ApiProductSummary,
  RolePinValues,
  AdminChecklistTask,
  AdminProfile,
  BranchSummaryReport,
  CommissionReport,
  CustomersReport,
  EmployeeRow,
  MonthlyReport,
  OverviewReport,
  ReportPeriod,
  RetentionReport,
  SessionsReport,
  ApiBranch,
  ApiBranchPricing,
  ApiCommissionModel,
  ApiPaymentMode,
  ApiRoleRef,
  ApiService,
  ApiStaff,
  ApiStaffSlab,
  ApiTransaction,
  ApiTransactionType,
  Paginated,
  SummaryPeriod,
} from "../../types/api"

const MAX = 100 // backend page-size ceiling

// ── Branches ─────────────────────────────────────────────────────────
/** Oldest first, so the first branch created is #1, the next #2, and so on. */
export const listBranches = (query: { search?: string; isActive?: boolean } = {}) =>
  request<Paginated<ApiBranch>>("GET", "/admin/branches", {
    query: { limit: MAX, ...query },
  }).then((r) =>
    [...r.data].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
  )

export interface BranchInput {
  name: string
  code: string
  address?: string
  city?: string
  state?: string
  phone?: string
  imageUrl?: string
  monthlyTarget?: number
  managerId?: string | null
  /** 4-digit login PINs, saved together with the branch (all or nothing). */
  managerPin?: string
  stylistPin?: string
}

export const createBranch = (body: BranchInput) =>
  request<{ branch?: ApiBranch } & Partial<ApiBranch>>("POST", "/admin/branches", {
    body,
  }).then((r) => (r.branch ?? r) as ApiBranch)

export const updateBranch = (id: string, body: Partial<BranchInput>) => request("PATCH", `/admin/branches/${id}`, { body })

export const setBranchStatus = (id: string, isActive: boolean) =>
  request("PATCH", `/admin/branches/${id}/status`, { body: { isActive } })

/** Permanently removes a branch that has never traded (the server refuses otherwise). */
export const deleteBranch = (id: string) => request<unknown>("DELETE", `/admin/branches/${id}`)

export const setBranchRolePin = (branchId: string, role: "MANAGER" | "STYLIST", pin: string) =>
  request("PUT", `/admin/branches/${branchId}/role-pins/${role}`, { body: { pin } })

/** Current PINs (null where only the hash is stored, i.e. never re-set since PINs became viewable). */
export const getBranchRolePinValues = (branchId: string) =>
  request<RolePinValues>("GET", `/admin/branches/${branchId}/role-pins/values`)

export const getAdminPin = () =>
  request<{ pin: string | null }>("GET", "/admin/auth/pin").then((r) => r.pin)

export const getBranchRolePins = (branchId: string) =>
  request<{ branchId: string; roles: { role: string; isConfigured: boolean }[] }>(
    "GET",
    `/admin/branches/${branchId}/role-pins`,
  )

// ── Roles & staff ────────────────────────────────────────────────────
export const listRoles = () =>
  request<{ data: ApiRoleRef[] }>("GET", "/admin/roles").then((r) => r.data)

export interface StaffInput {
  name: string
  roleId: string
  branchId: string
  monthlySalary?: number
  phone?: string
  photoUrl?: string
  dailyRevenueTarget?: number
  monthlyRevenueTarget?: number
  commissionModel?: ApiCommissionModel
  flatCommissionPercentage?: number
  dailyTargetAmount?: number
  commissionSlabs?: ApiStaffSlab[]
}

export const listStaff = (query: { branchId?: string; isActive?: boolean; search?: string } = {}) =>
  request<Paginated<ApiStaff>>("GET", "/admin/staff", {
    query: { limit: MAX, ...query },
  }).then((r) => r.data)

export const createStaff = (body: StaffInput) =>
  request<unknown>("POST", "/admin/staff", { body })

export const updateStaff = (id: string, body: Partial<StaffInput>) =>
  request<unknown>("PATCH", `/admin/staff/${id}`, { body })

export const setStaffStatus = (id: string, isActive: boolean) =>
  request<unknown>("PATCH", `/admin/staff/${id}/status`, { body: { isActive } })

/** Permanently removes a staff member with no history (the server refuses otherwise). */
export const deleteStaff = (id: string) => request<unknown>("DELETE", `/admin/staff/${id}`)

// ── Services & per-branch menu pricing ───────────────────────────────
export const listServices = () =>
  request<Paginated<ApiService>>("GET", "/admin/services", {
    query: { limit: MAX },
  }).then((r) => r.data)

export const createService = (body: { name: string; category?: string }) =>
  request<{ service?: ApiService } & Partial<ApiService>>("POST", "/admin/services", {
    body,
  }).then((r) => (r.service ?? r) as ApiService)

export const updateService = (id: string, body: { name?: string; category?: string }) =>
  request<unknown>("PATCH", `/admin/services/${id}`, { body })

export const listBranchPricing = (branchId: string) =>
  request<Paginated<ApiBranchPricing>>(
    "GET",
    `/admin/branches/${branchId}/menu-pricing`,
    { query: { limit: MAX } },
  ).then((r) => r.data)

export const createBranchPricing = (branchId: string, body: { serviceId: string; price: number }) =>
  request<unknown>("POST", `/admin/branches/${branchId}/menu-pricing`, { body })

export const updateBranchPricing = (
  branchId: string,
  pricingId: string,
  body: { price?: number; isActive?: boolean },
) => request<unknown>("PATCH", `/admin/branches/${branchId}/menu-pricing/${pricingId}`, { body })

export const deleteBranchPricing = (branchId: string, pricingId: string) =>
  request<unknown>("DELETE", `/admin/branches/${branchId}/menu-pricing/${pricingId}`)

// ── Transactions (expenses / advances) ───────────────────────────────
export const listTransactions = (
  query: {
    branchId?: string
    type?: ApiTransactionType
    startDate?: string
    endDate?: string
  } = {},
) =>
  request<Paginated<ApiTransaction>>("GET", "/admin/transactions", {
    query: { limit: MAX, ...query },
  }).then((r) => r.data)

export const getTransactionsSummary = (query: { branchId?: string; period?: SummaryPeriod } = {}) =>
  request<Record<string, unknown>>("GET", "/admin/transactions/summary", { query })

export const createTransaction = (body: {
  branchId: string
  type: ApiTransactionType
  description: string
  amount: number
  paymentMode: ApiPaymentMode
  employeeId?: string
}) => request<unknown>("POST", "/admin/transactions", { body })

// ── Admin account ────────────────────────────────────────────────────
export const changeAdminPin = (currentPin: string, newPin: string) =>
  request<{ message: string }>("PATCH", "/admin/auth/pin", {
    body: { currentPin, newPin },
  })

// ── Reports ──────────────────────────────────────────────────────────
export interface RevenueSummary {
  period: SummaryPeriod
  sessions: number
  collected: number
  tips: number
  revenue: number
  cashCollected: number
  gpayCollected: number
  /** Commission and tips handed to staff in the period. */
  commissionPaid: number
  tipWithdrawals: number
  byBranch: { branchId: string; name: string; collected: number; sessions: number }[]
}

export const getRevenueSummary = (
  query: { branchId?: string; period?: SummaryPeriod; from?: string; to?: string } = {},
) =>
  request<RevenueSummary>("GET", "/admin/reports/revenue", { query })

const reportQuery = (query: { branchId?: string; period?: ReportPeriod; from?: string; to?: string }) => query

export const getOverview = (
  query: { branchId?: string; period?: ReportPeriod; from?: string; to?: string } = {},
) =>
  request<OverviewReport>("GET", "/admin/reports/overview", { query: reportQuery(query) })

export const getBranchSummary = (branchId: string, period: ReportPeriod) =>
  request<BranchSummaryReport>("GET", `/admin/reports/branches/${branchId}/summary`, {
    query: { period },
  })

export const getSessionsReport = (query: {
  branchId?: string
  period?: ReportPeriod
  page?: number
  limit?: number
}) => request<SessionsReport>("GET", "/admin/reports/sessions", { query })

export const getCustomersReport = (query: {
  branchId?: string
  search?: string
  sort?: "SPEND" | "VISITS" | "RECENT"
  limit?: number
}) => request<CustomersReport>("GET", "/admin/reports/customers", { query: { limit: 500, ...query } })

export const getRetentionReport = (query: { branchId?: string } = {}) =>
  request<RetentionReport>("GET", "/admin/reports/retention", { query })

export const getEmployeesReport = (query: { branchId?: string; period?: ReportPeriod }) =>
  request<{ data: EmployeeRow[] }>("GET", "/admin/reports/employees", { query }).then(
    (r) => r.data,
  )

export const getCommissionReport = (query: { branchId?: string; period?: ReportPeriod }) =>
  request<CommissionReport>("GET", "/admin/reports/commission", { query })

export const getMonthlyReport = (query: { branchId?: string; year?: number; month?: number }) =>
  request<MonthlyReport>("GET", "/admin/reports/monthly", { query })

// ── Salary payments ──────────────────────────────────────────────────
export const createSalaryPayment = (body: {
  userId: string
  amount: number
  via: "CASH" | "GPAY" | "BANK_TRANSFER"
  note?: string
}) => request<unknown>("POST", "/admin/salary-payments", { body })

// ── Checklist template ───────────────────────────────────────────────
export const listChecklist = () =>
  request<{ data: AdminChecklistTask[] }>("GET", "/admin/checklist").then((r) => r.data)

export const createChecklistTask = (task: string, description?: string) =>
  request<AdminChecklistTask>("POST", "/admin/checklist", { body: { task, description } })

export const updateChecklistTask = (id: string, body: { task?: string; description?: string }) =>
  request<AdminChecklistTask>("PATCH", `/admin/checklist/${id}`, { body })

export const deleteChecklistTask = (id: string) =>
  request<unknown>("DELETE", `/admin/checklist/${id}`)

// ── Profile & uploads ────────────────────────────────────────────────
export const getAdminProfile = () => request<AdminProfile>("GET", "/admin/auth/me")

/** Uploads a staff / branch photo to Supabase Storage and returns its public URL. */
export const uploadImage = (file: File, folder: "staff" | "branches" | "products" | "offers") => {
  const form = new FormData()
  form.append("file", file)
  return request<{ url: string }>("POST", "/admin/uploads/image", {
    body: form,
    query: { folder },
  }).then((r) => r.url)
}

// ── WhatsApp ─────────────────────────────────────────────────────────
export type WhatsappMode = "off" | "api" | "manual"

export interface WhatsappStatus {
  /** True once the server has its WhatsApp keys; nothing can be sent before that. */
  configured: boolean
  /** How bills are sent: not at all, automatically (Business API), or by hand from the staff app. */
  mode: WhatsappMode
  billFormat: "text" | "image"
  phones: string[]
  daily: boolean
  weekly: boolean
  monthly: boolean
  /** Send the full Excel report with each report message. */
  excel: boolean
  /** Sending is paused (WhatsApp complained, or the token failed); null when running normally. */
  paused: { until: string; reason: string } | null
  pausedScope: "all" | "offers" | null
  /** The webhook is set up on the server, so delivery status and STOP replies work. */
  webhookReady: boolean
  suppressed: { optedOut: number; undeliverable: number }
  offerLimit: { perDay: number; sentToday: number; minDaysBetween: number }
  templates: { bill: string; report: string; billImage: string; offer: string; offerImage: string; reportFile: string }
}

export interface WhatsappMessageRow {
  id: string
  kind: "BILL" | "REPORT" | "TEST" | "OFFER"
  status: "PENDING" | "SENT" | "FAILED"
  to: string
  attempts: number
  error: string | null
  errorCode: number | null
  /** After WhatsApp accepted it: "delivered", "read" or "failed". */
  deliveryStatus: "delivered" | "read" | "failed" | null
  createdAt: string
  sentAt: string | null
}

export const getWhatsapp = () => request<WhatsappStatus>("GET", "/admin/whatsapp")

export const saveWhatsapp = (
  body: Pick<WhatsappStatus, "phones" | "daily" | "weekly" | "monthly" | "excel" | "mode" | "billFormat">,
) =>
  request<WhatsappStatus>("PUT", "/admin/whatsapp", { body })

/** Sends a report to the saved numbers now. `from`/`to` (YYYY-MM-DD) pick the period; today so far by default. */
export const testWhatsapp = (range: { from?: string; to?: string } = {}) =>
  request<{ queued: number }>("POST", "/admin/whatsapp/test", { body: range })

/** The Excel report for a period, to check it without sending anything. */
export const downloadWhatsappReport = (from: string, to: string) =>
  requestBlob(`/admin/whatsapp/report?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)

export interface WhatsappOfferRow {
  id: string
  message: string
  imageUrl: string | null
  branches: string[]
  audience: number
  sent: number
  failed: number
  waiting: number
  createdAt: string
}

/** How many customers an offer to these branches (none = all) would reach. */
export interface WhatsappAudience {
  count: number
  /** Left out because they replied STOP or can't receive WhatsApp. */
  optedOut: number
  /** Left out because they already got an offer recently. */
  recentlyMessaged: number
}

export const whatsappAudience = (branchIds: string[]) =>
  request<WhatsappAudience>("GET", "/admin/whatsapp/offers/audience", {
    query: { branchIds: branchIds.join(",") },
  })

/** Start sending again after a pause, once the cause is fixed. */
export const resumeWhatsapp = () => request<{ resumed: boolean }>("POST", "/admin/whatsapp/resume", { body: {} })

export const sendWhatsappOffer = (body: { message: string; imageUrl?: string; branchIds: string[] }) =>
  request<{ offerId: string; audience: number; queued: number }>("POST", "/admin/whatsapp/offers", { body })

export const listWhatsappOffers = () =>
  request<{ data: WhatsappOfferRow[] }>("GET", "/admin/whatsapp/offers").then((r) => r.data)

export const retryFailedWhatsapp = () =>
  request<{ requeued: number }>("POST", "/admin/whatsapp/messages/retry", { body: {} })

export const listWhatsappMessages = () =>
  request<{ data: WhatsappMessageRow[] }>("GET", "/admin/whatsapp/messages").then((r) => r.data)

// ── Products ─────────────────────────────────────────────────────────
export interface ProductInput {
  name: string
  price: number
  description?: string
  category?: string
  imageUrl?: string
  isActive?: boolean
}

export type ProductPeriod = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "ALL_TIME"

/** Products with units sold / revenue for the period, plus the period's totals. */
export const listProducts = (period: ProductPeriod = "ALL_TIME") =>
  request<{ data: ApiProduct[]; summary: ApiProductSummary }>("GET", "/admin/products", {
    query: { period },
  })

export const createProduct = (body: ProductInput) =>
  request<ApiProduct>("POST", "/admin/products", { body })

export const updateProduct = (id: string, body: Partial<ProductInput>) =>
  request<ApiProduct>("PATCH", `/admin/products/${id}`, { body })

export const deleteProduct = (id: string) =>
  request<unknown>("DELETE", `/admin/products/${id}`)
