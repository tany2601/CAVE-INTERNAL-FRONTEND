// Shapes returned by the CAVE backend (see BACKEND/src/**).

export type ApiRole = "ADMIN" | "MANAGER" | "STYLIST"
export type ApiPaymentMode = "CASH" | "GPAY"
export type ApiDiscountType = "NONE" | "PERCENTAGE" | "FIXED"
export type ApiTransactionType = "GENERAL_EXPENSE" | "EMPLOYEE_ADVANCE"

export interface BranchLoginResponse {
  accessToken: string
  branch: { id: string; name: string; code: string }
  role: ApiRole
}

export interface AdminLoginResponse {
  accessToken: string
}

export interface ApiSessionService {
  id: string
  servicePricingId: string | null
  serviceName: string
  price: number
  isCustom: boolean
}

export interface ApiSession {
  id: string
  branchId: string
  stylistId: string | null
  stylist: { id: string; name: string } | null
  customerId: string | null
  customerName: string
  customerMobile: string | null
  status: "ACTIVE" | "COMPLETED" | "CANCELLED"
  subtotal: number
  discountType: ApiDiscountType
  discountValue: number
  discountAmount: number
  isEdited?: boolean
  products: { id: string; productName: string; price: number; paymentMode: ApiPaymentMode }[]
  tipAmount: number
  totalAmount: number
  paymentMode: ApiPaymentMode | null
  startedAt: string | null
  closedAt: string | null
  createdAt: string
  services: ApiSessionService[]
}

export interface ApiMenuItem {
  /** servicePricingId, the identifier /close expects */
  id: string
  serviceId: string
  name: string
  category: string | null
  price: number
}

export interface ApiStylist {
  id: string
  name: string
  specialty: string
  available: boolean
  activeSessions: number
  completedToday: number
  revenueToday: number
  commission: number
  tips: number
  dailyTarget: number
  services: { name: string; count: number }[]
  commissionPaid?: boolean
  commissionPaidAmount?: number
}

export interface ApiDay {
  date: string
  openingSet: boolean
  openingCash: number
  openingGpay: number
  closed: boolean
  expectedCash: number | null
  expectedGpay: number | null
  closingCash: number | null
  closingGpay: number | null
}

export interface ApiPayout {
  id: string
  userId: string
  kind: "COMMISSION" | "TIP_WITHDRAWAL"
  amount: number
  paymentMode: ApiPaymentMode
  createdAt: string
}

export interface ApiChecklistItem {
  id: string
  task: string
  description: string
  done: boolean
}

export interface ApiExpense {
  id: string
  type: ApiTransactionType
  description: string
  amount: number
  paymentMode: ApiPaymentMode
  employeeId: string | null
  addedBy: string
  createdAt: string
}

export interface TodayResponse {
  branch: { id: string; name: string; code: string }
  stylists: ApiStylist[]
  activeSessions: ApiSession[]
  closedSessions: ApiSession[]
  expenses: ApiExpense[]
  payouts: ApiPayout[]
  day: ApiDay
}

export interface CustomerLookupResponse {
  found: boolean
  name?: string
  visitCount: number
  loyaltyTarget: number
  rewardReady: boolean
}

export interface CloseSessionPayload {
  services?: { servicePricingId: string }[]
  customServices?: { name: string; price: number }[]
  productSales?: { productName: string; price: number; paymentMode?: ApiPaymentMode }[]
  discountType?: ApiDiscountType
  discountValue?: number
  tipAmount?: number
  paymentMode: ApiPaymentMode
}

// ── Admin API ────────────────────────────────────────────────────────

export interface Paginated<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface ApiBranch {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  state: string | null
  phone: string | null
  imageUrl: string | null
  monthlyTarget: number
  managerId: string | null
  isActive: boolean
  createdAt: string
}

export interface ApiRoleRef {
  id: string
  name: ApiRole
  description?: string | null
}

export type ApiCommissionModel =
  | "FLAT_PERCENTAGE"
  | "DAILY_TARGET"
  | "MONTHLY_TARGET"

export interface ApiStaffSlab {
  slabOrder: number
  minRevenue: number | string
  commissionPercentage: number | string
}

export interface ApiStaff {
  id: string
  name: string
  email: string | null
  roleId: string
  role: ApiRoleRef
  branchId: string | null
  branch: ApiBranch | null
  phone: string | null
  photoUrl: string | null
  dailyRevenueTarget: number | null
  monthlyRevenueTarget: number | null
  monthlySalary: number | string | null
  commissionModel: ApiCommissionModel | null
  flatCommissionPercentage: number | string | null
  dailyTargetAmount: number | string | null
  commissionSlabs: ApiStaffSlab[]
  isActive: boolean
}

export interface ApiService {
  id: string
  name: string
  description: string | null
  category: string | null
  durationMin: number | null
  isActive: boolean
}

export interface ApiBranchPricing {
  id: string
  branchId: string
  serviceId: string
  price: number
  isActive: boolean
  service: ApiService
}

export interface ApiTransaction {
  id: string
  branchId: string
  branch: { id: string; name: string; code: string } | null
  type: ApiTransactionType
  description: string
  amount: number
  paymentMode: ApiPaymentMode
  employeeId: string | null
  employee: { id: string; name: string } | null
  createdBy: { id: string; name: string } | null
  createdAt: string
}

export type SummaryPeriod = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "ALL_TIME" | "CUSTOM"

// ── Admin reports ────────────────────────────────────────────────────

export type ReportPeriod = SummaryPeriod

export interface ReportFinance {
  customers: number
  revenue: number
  serviceRevenue: number
  productSalesCash: number
  productSalesGpay: number
  productSales: number
  tips: number
  cashCollected: number
  gpayCollected: number
  expensesCash: number
  expensesGpay: number
  expenses: number
  advances: number
  commissionPaid: number
  tipWithdrawals: number
  netInHand: number
}

export interface OverviewReport {
  period: ReportPeriod
  totals: { revenue: number; customers: number; avgTicket: number; activeNow: number }
  payroll: { month: string; salaryBill: number; advances: number; salaryPaid: number; netPayable: number }
  branches: {
    id: string
    name: string
    location: string
    revenue: number
    customers: number
    active: number
    target: number
    monthRevenue: number
  }[]
  weekly: { day: string; date: string; value: number }[]
  topServices: { name: string; count: number }[]
}

export interface BranchSummaryReport {
  branch: {
    id: string
    name: string
    location: string
    monthlyTarget: number
    imageUrl: string | null
    phone: string | null
  }
  period: ReportPeriod
  activeNow: number
  monthRevenue: number
  targetPercent: number
  finance: ReportFinance
}

export interface SessionsReport {
  total: number
  totals: { count: number; amount: number; cash: number; gpay: number }
  byBranch: { branchId: string; name: string; customers: number }[]
  data: {
    id: string
    closedAt: string | null
    customer: string
    phone: string
    branchId: string
    branch: string
    stylist: string
    services: string
    amount: number
    mode: "GPay" | "Cash"
    tip: number
    durationMin: number
    status: "Original" | "Edited"
  }[]
}

export interface CustomersReport {
  stats: {
    totalProfiles: number
    returning: number
    avgLifetimeValue: number
    spendBands: { label: string; count: number }[]
  }
  total: number
  data: {
    id: string
    name: string
    phone: string
    visits: number
    totalSpent: number
    favouriteService: string
    lastVisit: string | null
    branch: string
  }[]
}

export interface RetentionReport {
  totalCustomers: number
  returning: number
  retentionRate: number
  periods: { label: string; rate: number; newCustomers: number; returning: number }[]
  leaderboard: { id: string; name: string; phone: string; lastBranch: string; visits: number }[]
}

export interface EmployeeRow {
  id: string
  name: string
  branchId: string | null
  branch: string
  role: ApiRole
  photoUrl: string | null
  daily: number
  salary: number
  advance: number
  paid: number
  net: number
  revenue: number
  customers: number
  ticket: number
  minutesWorked: number
  time: string
  commission: number
  commissionPaid: number
}

export interface CommissionReport {
  totals: { pending: number; payout: number; revenue: number; averageRate: number }
  data: {
    userId: string
    name: string
    branch: string
    customers: number
    revenue: number
    payout: number
    paid: number
    pending: number
    status: "Paid" | "Pending"
  }[]
}

export interface MonthlyBranchRow {
  id: string
  name: string
  serviceRevenue: number
  products: number
  cash: number
  gpay: number
  commission: number
  expenses: number
  advances: number
  tipWithdrawals: number
  net: number
}

export interface MonthlyReport {
  year: number
  month: number
  monthLabel: string
  firstWeekday: number
  today: string
  branches: MonthlyBranchRow[]
  total: MonthlyBranchRow
  days: {
    date: string
    day: number
    revenue: number
    branches: {
      branchId: string
      name: string
      revenue: number
      customers: number
      cash: number
      gpay: number
      products: number
      expenses: number
      commission: number
      netInHand: number
    }[]
  }[]
}

export interface AdminChecklistTask {
  id: string
  task: string
  description: string
  branchId: string | null
}

export interface AdminProfile {
  id: string
  name: string
  email: string | null
  branchCount: number
}

export interface ApiProduct {
  id: string
  name: string
  description: string
  category: string
  price: number
  imageUrl: string | null
  isActive: boolean
}

/** Product as offered at checkout (active only). */
export interface ApiCheckoutProduct {
  id: string
  name: string
  price: number
  imageUrl: string | null
  category: string | null
}

export interface RolePinValues {
  branchId: string
  roles: { role: "MANAGER" | "STYLIST"; isConfigured: boolean; pin: string | null }[]
}
