import { request } from "./http"
import type {
  ApiProduct,
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
export const uploadImage = (file: File, folder: "staff" | "branches" | "products") => {
  const form = new FormData()
  form.append("file", file)
  return request<{ url: string }>("POST", "/admin/uploads/image", {
    body: form,
    query: { folder },
  }).then((r) => r.url)
}

// ── Products ─────────────────────────────────────────────────────────
export interface ProductInput {
  name: string
  price: number
  description?: string
  category?: string
  imageUrl?: string
  isActive?: boolean
}

export const listProducts = () =>
  request<{ data: ApiProduct[] }>("GET", "/admin/products").then((r) => r.data)

export const createProduct = (body: ProductInput) =>
  request<ApiProduct>("POST", "/admin/products", { body })

export const updateProduct = (id: string, body: Partial<ProductInput>) =>
  request<ApiProduct>("PATCH", `/admin/products/${id}`, { body })

export const deleteProduct = (id: string) =>
  request<unknown>("DELETE", `/admin/products/${id}`)
