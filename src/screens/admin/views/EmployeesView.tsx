import { EmptyNote } from "../../../components/ui"
import { useState } from "react"
import {
  Banknote,
} from "lucide-react"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { useAdminBranches } from "../../../hooks/useAdminBranches"
import { formatMoney } from "../adminTypes"
import { AsyncNotice, ScrollHint, PageHeading, AdminSelect, Field, ViewMoreButton } from "../components"
import { useAdminActions } from "../hooks/useAdminActions"

export function EmployeesView() {
  const actions = useAdminActions()
  const [branch, setBranch] = useState("All Branches")
  const [period, setPeriod] = useState("This Month")
  const [employee, setEmployee] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [via, setVia] = useState("GPay")
  const [saved, setSaved] = useState(false)
  const [limit, setLimit] = useState(5)
  const branchList = useAdminBranches()
  const { data, loading, error, reload } = useAsyncData(
    () =>
      adminApi.getEmployeesReport({
        branchId: branchList.idOf(branch),
        period: period === "All Time" ? "ALL_TIME" : "THIS_MONTH",
      }),
    [branch, period, branchList.branches.length],
  )
  const visible = data ?? []
  const labelOf = (item: { name: string; branch: string }) => `${item.name} (${item.branch})`
  const selectedEmployee = visible.find((item) => labelOf(item) === employee) ?? visible[0]
  const VIA = { GPay: "GPAY", Cash: "CASH", "Bank transfer": "BANK_TRANSFER" } as const

  return (
    <div className="employee-page admin-photo-page min-h-full">
      <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <PageHeading
            eyebrow="Payroll"
            title="Team payroll"
            description="Salary, advances and performance for each team member."
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <AdminSelect
              value={branch}
              onChange={setBranch}
              options={branchList.options}
            />
            <div className="admin-segment">
              {["This Month", "All Time"].map((item) => (
                <button
                  key={item}
                  className={period === item ? "active" : ""}
                  onClick={() => setPeriod(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <AsyncNotice loading={loading && !data} error={error} onRetry={reload} />
        <div className="employee-card mt-7">
        <ScrollHint />
        <div className="employee-roster">
          <div className="employee-roster-head">
            <span>Team member</span>
            <span>Salary position</span>
            <span>Performance</span>
            <span>Time</span>
          </div>
          {data && visible.length === 0 && (
            <EmptyNote className="m-4">No employees to show yet.</EmptyNote>
          )}
          {visible.slice(0, limit).map((item) => (
            <article key={item.id} className="employee-roster-row">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--text)] text-[var(--bg)] flex items-center justify-center font-display font-800 text-lg overflow-hidden">
                  {item.photoUrl ? (
                    <img
                      className="h-full w-full object-cover"
                      src={item.photoUrl}
                      alt={item.name}
                    />
                  ) : (
                    item.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="font-display font-800 text-xl uppercase tracking-wider">
                    {item.name}
                  </div>
                  <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                    {item.branch} · Daily {formatMoney(item.daily)}
                  </div>
                </div>
              </div>
              <div className="employee-pay-block">
                <div>
                  <span>Net payable</span>
                  <strong className="text-[#4CAF86]">
                    {formatMoney(item.net)}
                  </strong>
                </div>
                <div>
                  <span>Salary / advance / paid</span>
                  <small>
                    {formatMoney(item.salary)} / {formatMoney(item.advance)} /{" "}
                    {formatMoney(item.paid)}
                  </small>
                </div>
              </div>
              <div className="employee-performance-block">
                <div>
                  <strong>{formatMoney(item.revenue)}</strong>
                  <span>Revenue</span>
                </div>
                <div>
                  <strong>{item.customers}</strong>
                  <span>Customers</span>
                </div>
                <div>
                  <strong>{formatMoney(item.ticket)}</strong>
                  <span>Avg ticket</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display font-800 text-xl">{item.time}</div>
                <div className="admin-kicker">Worked</div>
              </div>
            </article>
          ))}
        </div>
        </div>
        {visible.length > limit && (
          <ViewMoreButton onClick={() => setLimit((value) => value + 5)} />
        )}

        <section className="payroll-console mt-5">
          <div className="payroll-console-copy">
            <div className="admin-kicker">Payroll action</div>
            <div className="font-display font-800 text-3xl uppercase tracking-wider mt-2">
              Mark salary paid
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-2 max-w-xs">
              Record a verified payment and keep the employee’s payable balance
              accurate.
            </div>
            <Banknote size={44} className="text-[var(--text-faint)] mt-8" />
          </div>
          <div className="payroll-console-form">
        <div className="grid md:grid-cols-2 gap-3 mt-4">
          <Field label="Employee">
            <AdminSelect
              value={selectedEmployee ? labelOf(selectedEmployee) : ""}
              onChange={setEmployee}
              options={visible.map(labelOf)}
              full
            />
          </Field>
          <Field label="Amount paid">
            <label className="admin-input flex items-center gap-2">
              <span>₹</span>
              <input
                className="flex-1 bg-transparent outline-none min-w-0"
                inputMode="numeric"
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))}
                placeholder="0"
              />
            </label>
          </Field>
          <Field label="Note">
            <input
              className="admin-input w-full"
              placeholder="e.g. March salary"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
          <Field label="Via">
            <AdminSelect value={via} onChange={setVia} options={["GPay", "Cash", "Bank transfer"]} full />
          </Field>
        </div>
        <button
          className="admin-primary-button mt-4"
          disabled={!amount || !selectedEmployee}
          onClick={() =>
            actions.request({
              title: "Record this salary payment?",
              message: `${formatMoney(
                Number(amount),
              )} will be recorded for ${selectedEmployee ? labelOf(selectedEmployee) : ""}.`,
              confirmLabel: "Record payment",
              action: async () => {
                if (!selectedEmployee) return
                await adminApi.createSalaryPayment({
                  userId: selectedEmployee.id,
                  amount: Number(amount),
                  via: VIA[via as keyof typeof VIA],
                  note: note.trim() || undefined,
                })
                setSaved(true)
                setAmount("")
                setNote("")
                await reload()
              },
              successMessage: "Salary payment recorded",
            })
          }
        >
          <Banknote size={15} /> Record salary payment
        </button>
        {saved && (
          <div className="mt-3 text-xs text-[#4CAF86]">
            Salary payment recorded successfully.
          </div>
        )}
          </div>
        </section>
      </div>
      {actions.feedback}
    </div>
  )
}
