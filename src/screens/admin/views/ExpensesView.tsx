import { useState } from "react"
import {
  ArrowRight,
  Plus,
  Save,
  SlidersHorizontal,
} from "lucide-react"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import type { ApiTransaction, SummaryPeriod } from "../../../types/api"
import { formatMoney } from "../adminTypes"
import type { DateRange } from "../components"
import { AdminModal, AsyncNotice, DateRangePicker, PageHeading, PeriodTabs, AdminSelect, Field, StatusBadge, ViewMoreButton } from "../components"
import { useAdminActions } from "../hooks/useAdminActions"
import type { Period } from "../types"

const PERIOD_MAP: Record<Period, SummaryPeriod> = {
  Today: "TODAY",
  "This Week": "THIS_WEEK",
  "This Month": "THIS_MONTH",
  Custom: "CUSTOM",
}

const EXPENSE_TYPES = ["General expense", "Advance", "Utilities", "Supplies"]

/** Start of the period in the browser's (branch) local time, as an ISO string. */
const periodStartISO = (period: Period, range: DateRange): string | undefined => {
  if (period === "Custom") return range.from ? `${range.from}T00:00:00+05:30` : undefined
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (period === "Today") return start.toISOString()
  if (period === "This Week") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    return start.toISOString()
  }
  if (period === "This Month") {
    start.setDate(1)
    return start.toISOString()
  }
  return undefined
}

/** End of a custom range (inclusive of the last day); other periods run up to now. */
const periodEndISO = (period: Period, range: DateRange): string | undefined =>
  period === "Custom" && range.to ? `${range.to}T23:59:59.999+05:30` : undefined

export const ExpensesView = () => {
  const actions = useAdminActions()
  const [showAdd, setShowAdd] = useState(false)
  const [period, setPeriod] = useState<Period>("This Month")
  const [range, setRange] = useState<DateRange>({})
  const customReady = period !== "Custom" || (!!range.from && !!range.to)
  const [branchFilter, setBranchFilter] = useState("All Branches")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [branch, setBranch] = useState("")
  const [expenseType, setExpenseType] = useState(EXPENSE_TYPES[0])
  const [employee, setEmployee] = useState("")
  const [mode, setMode] = useState("Cash")
  const [limit, setLimit] = useState(5)

  const lookups = useAsyncData(async () => {
    const [branches, staff] = await Promise.all([
      adminApi.listBranches(),
      adminApi.listStaff({ isActive: true }),
    ])
    return { branches, staff }
  })
  const branches = lookups.data?.branches ?? []
  const filterBranchId = branches.find((b) => b.name === branchFilter)?.id

  const ledgerState = useAsyncData(async () => {
    if (!customReady) return undefined
    const [transactions, revenue] = await Promise.all([
      adminApi.listTransactions({
        branchId: filterBranchId,
        startDate: periodStartISO(period, range),
        endDate: periodEndISO(period, range),
      }),
      adminApi.getRevenueSummary({
        branchId: filterBranchId,
        period: PERIOD_MAP[period],
        ...(period === "Custom" ? { from: range.from, to: range.to } : {}),
      }),
    ])
    return { transactions, revenue }
  }, [filterBranchId, period, range.from, range.to])

  const ledger: ApiTransaction[] = ledgerState.data?.transactions ?? []
  const moneyIn = ledgerState.data?.revenue.collected ?? 0
  const total = ledger.reduce((sum, item) => sum + item.amount, 0)
  const cashOut = ledger
    .filter((t) => t.paymentMode === "CASH")
    .reduce((sum, t) => sum + t.amount, 0)
  const gpayOut = total - cashOut

  const activeBranches = branches.filter((b) => b.isActive)
  const addBranch = activeBranches.find((b) => b.name === branch) ?? activeBranches[0]
  const branchStaff = (lookups.data?.staff ?? []).filter((s) => s.branchId === addBranch?.id)
  const isAdvance = expenseType === "Advance"
  const advanceEmployee = branchStaff.find((s) => s.name === employee) ?? branchStaff[0]
  const canSave =
    !!description.trim() && !!amount && Number(amount) > 0 && !!addBranch && (!isAdvance || !!advanceEmployee)

  const saveExpense = async () => {
    if (!addBranch) return
    const category = expenseType === "Utilities" || expenseType === "Supplies" ? expenseType : null
    await adminApi.createTransaction({
      branchId: addBranch.id,
      type: isAdvance ? "EMPLOYEE_ADVANCE" : "GENERAL_EXPENSE",
      description: category ? `${category}: ${description.trim()}` : description.trim(),
      amount: Number(amount),
      paymentMode: mode === "GPay" ? "GPAY" : "CASH",
      ...(isAdvance && advanceEmployee ? { employeeId: advanceEmployee.id } : {}),
    })
    setDescription("")
    setAmount("")
    setShowAdd(false)
    await ledgerState.reload()
  }

  return (
    <div className="expense-page admin-photo-page min-h-full">
      <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <PageHeading
            eyebrow="Expenses and cash flow"
            title="Expense dashboard"
            description="Money received from sessions against money spent, with every expense listed."
          />
          <button
            className="admin-primary-button"
            disabled={!lookups.data}
            onClick={() => {
              setBranch(activeBranches[0]?.name ?? "")
              setShowAdd(true)
            }}
          >
            <Plus size={15} /> Add expense
          </button>
        </div>

        <section className="expense-balance-strip mt-7">
          <div>
            <span className="admin-kicker">Money in</span>
            <strong className="text-[#4CAF86]">{formatMoney(moneyIn)}</strong>
            <small>Session revenue</small>
          </div>
          <div className="expense-flow-line">
            <ArrowRight size={19} />
          </div>
          <div>
            <span className="admin-kicker">Money out</span>
            <strong className="text-[#E06060]">{formatMoney(total)}</strong>
            <small>Expenses + advances</small>
          </div>
          <div className="expense-flow-line">
            <ArrowRight size={19} />
          </div>
          <div>
            <span className="admin-kicker">Net position</span>
            <strong>{formatMoney(moneyIn - total)}</strong>
            <small>Revenue minus expenses</small>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <AdminSelect
            value={branchFilter}
            onChange={(value) => {
              setBranchFilter(value)
              setLimit(5)
            }}
            options={["All Branches", ...branches.map((b) => b.name)]}
          />
          <PeriodTabs
            value={period}
            onChange={(value) => {
              setPeriod(value)
              setLimit(5)
            }}
            options={["Today", "This Week", "This Month", "Custom"]}
          />
          {period === "Custom" && (
            <DateRangePicker value={range} onChange={setRange} autoOpen={!range.from} />
          )}
        </div>
        {period === "Custom" && !customReady && (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] px-5 py-8 text-center text-xs text-[var(--text-muted)]">
            Choose a start and end date to see expenses for that range.
          </div>
        )}

        <AsyncNotice
          loading={ledgerState.loading && !ledgerState.data}
          error={ledgerState.error || lookups.error}
          onRetry={() => {
            void lookups.reload()
            void ledgerState.reload()
          }}
        />

        <div className="grid lg:grid-cols-[1fr_20rem] gap-4 mt-5">
          <section className="expense-ledger">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <div className="admin-kicker">Outgoing ledger</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">
                  {ledger.length} verified transactions
                </div>
              </div>
              <SlidersHorizontal size={17} className="text-[var(--text-muted)]" />
            </div>
            {ledger.slice(0, limit).map((item) => {
              const date = new Date(item.createdAt)
              return (
                <article key={item.id} className="expense-ledger-row">
                  <div className="expense-date">
                    <span>{String(date.getDate()).padStart(2, "0")}</span>
                    <small>{date.toLocaleDateString("en-IN", { month: "short" })}</small>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-600">{item.description}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusBadge
                        label={item.type === "EMPLOYEE_ADVANCE" ? "Advance" : "Expense"}
                        tone="info"
                      />
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {item.branch?.name}
                        {item.employee ? ` · ${item.employee.name}` : ""} ·{" "}
                        {item.paymentMode === "GPAY" ? "GPay" : "Cash"}
                      </span>
                    </div>
                  </div>
                  <div className="font-display font-800 text-xl text-[#E06060]">
                    -{formatMoney(item.amount)}
                  </div>
                </article>
              )
            })}
            {ledgerState.data && ledger.length === 0 && (
              <div className="px-5 py-8 text-center text-xs text-[var(--text-muted)]">
                No expenses recorded for this period.
              </div>
            )}
            {ledger.length > limit && (
              <ViewMoreButton onClick={() => setLimit((value) => value + 5)} />
            )}
          </section>

          <aside className="expense-receipt">
            <div className="admin-kicker">Period receipt</div>
            <div className="font-display font-800 text-4xl mt-5">{formatMoney(total)}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Total money out</div>
            <div className="border-t border-dashed border-[var(--border)] my-6" />
            <div className="flex justify-between text-xs">
              <span>Cash out</span>
              <strong>{formatMoney(cashOut)}</strong>
            </div>
            <div className="flex justify-between text-xs mt-3">
              <span>GPay out</span>
              <strong>{formatMoney(gpayOut)}</strong>
            </div>
            <div className="border-t border-[var(--border)] my-5" />
            <div className="flex justify-between">
              <span className="font-600">Net total</span>
              <strong>{formatMoney(total)}</strong>
            </div>
          </aside>
        </div>
      </div>

      {showAdd && (
        <AdminModal title="Add branch expense" onClose={() => setShowAdd(false)}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Branch">
              <AdminSelect
                value={addBranch?.name ?? ""}
                onChange={(value) => {
                  setBranch(value)
                  setEmployee("")
                }}
                options={activeBranches.map((b) => b.name)}
                full
              />
            </Field>
            <Field label="Expense type">
              <AdminSelect
                value={expenseType}
                onChange={setExpenseType}
                options={EXPENSE_TYPES}
                full
              />
            </Field>
            {isAdvance && (
              <div className="sm:col-span-2">
                <Field label="Employee">
                  <AdminSelect
                    value={advanceEmployee?.name ?? ""}
                    onChange={setEmployee}
                    options={branchStaff.map((s) => s.name)}
                    full
                  />
                </Field>
              </div>
            )}
            <div className="sm:col-span-2">
              <Field label="Description / reason">
                <input
                  className="admin-input w-full"
                  placeholder="e.g. Product restock, AC repair"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Field>
            </div>
            <Field label="Amount">
              <input
                className="admin-input w-full"
                inputMode="numeric"
                placeholder="₹0"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value.replace(/\D/g, ""))
                }
              />
            </Field>
            <Field label="Payment mode">
              <AdminSelect
                value={mode}
                onChange={setMode}
                options={["Cash", "GPay"]}
                full
              />
            </Field>
          </div>
          <button
            className="admin-primary-button w-full mt-5"
            disabled={!canSave}
            onClick={() =>
              actions.request({
                title: "Save this expense?",
                message: `${formatMoney(
                  Number(amount),
                )} for “${description}” will be recorded under ${addBranch?.name}.`,
                confirmLabel: "Save expense",
                action: saveExpense,
                successMessage: "Expense saved successfully",
              })
            }
          >
            <Save size={15} /> Save expense
          </button>
        </AdminModal>
      )}
      {actions.feedback}
    </div>
  )
}
