import { useState } from "react"
import { Button, SectionLabel } from "../../components/ui"
import { formatAmount, formatTime } from "../../lib/format"
import { useBranchData } from "../../context/BranchDataContext"
import { staffApi } from "../../lib/api"
import { toApiMode } from "../../lib/mappers"
import { Expense, Stylist } from "../../types"
import { Plus, X } from "lucide-react"
import { ManagerNav } from "../../components/layout"

interface Props {
  onNav: (screen: string) => void
  navTab: string
}

export default function Expenses({ onNav, navTab }: Props) {
  const { expenses, stylists, refresh } = useBranchData()
  const [showAdd, setShowAdd] = useState(false)

  const cashOut = expenses
    .filter((e) => e.paymentMode === "cash")
    .reduce((a, e) => a + e.amount, 0)
  const gpayOut = expenses
    .filter((e) => e.paymentMode === "gpay")
    .reduce((a, e) => a + e.amount, 0)

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <div className="flex-1 overflow-y-auto pb-nav">
        {/* Header */}
        <div className="px-5 pt-page pb-5 border-b border-[var(--border-subtle)]">
          <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-subtle)]">
            Today's
          </div>
          <div className="font-display font-800 text-2xl tracking-wider text-[var(--text)] mt-0.5">
            Expenses
          </div>

          <div className="flex gap-2 mt-4">
            <SummaryPill label="Cash" value={formatAmount(cashOut)} />
            <SummaryPill label="GPay" value={formatAmount(gpayOut)} />
            <SummaryPill
              label="Total"
              value={formatAmount(cashOut + gpayOut)}
              red
            />
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-2.5">
          <SectionLabel>All Expenses</SectionLabel>
          {expenses.map((exp) => {
            const emp = exp.employeeId
              ? stylists.find((s) => s.id === exp.employeeId)
              : null
            return (
              <div
                key={exp.id}
                className="bg-[var(--surface)] border border-[var(--border-subtle)]"
                style={{ borderRadius: "4px" }}
              >
                <div className="flex items-start justify-between p-4">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-display font-700 tracking-wide text-sm text-[var(--text)]">
                        {exp.description}
                      </span>
                      <span
                        className={`inline-flex items-center justify-center min-w-[4.75rem] shrink-0 whitespace-nowrap text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                          exp.type === "advance"
                            ? "text-[var(--text-secondary)] border-[rgba(128,128,128,0.25)] bg-[rgba(128,128,128,0.08)]"
                            : "text-[var(--text-muted)] border-[var(--border)] bg-[var(--elevated)]"
                        }`}
                      >
                        {exp.type === "advance" ? "Advance" : "General"}
                      </span>
                    </div>
                    {emp && (
                      <div className="text-[10px] text-[var(--text-muted)] mb-0.5">
                        For: {emp.name}
                      </div>
                    )}
                    <div className="text-[10px] text-[var(--text-faint)]">
                      {exp.addedBy} · {formatTime(exp.time)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-display font-800 text-base text-[#E06060]">
                      -{formatAmount(exp.amount)}
                    </div>
                    <div
                      className={`text-[9px] uppercase tracking-wider mt-0.5 ${
                        exp.paymentMode === "gpay"
                          ? "text-[#6B9FD4]"
                          : "text-[var(--text-subtle)]"
                      }`}
                    >
                      {exp.paymentMode}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-nav-offset right-5 w-14 h-14 bg-[var(--text)] rounded-full flex items-center justify-center tap-target active:bg-[var(--text-secondary)] transition-all z-40"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
        onClick={() => setShowAdd(true)}
      >
        <Plus size={22} className="text-[var(--bg)]" strokeWidth={2} />
      </button>

      {showAdd && (
        <AddExpenseSheet
          stylists={stylists}
          onSave={async (exp) => {
            await staffApi.createExpense({
              type: exp.type === "advance" ? "EMPLOYEE_ADVANCE" : "GENERAL_EXPENSE",
              description: exp.description,
              amount: exp.amount,
              paymentMode: toApiMode(exp.paymentMode),
              employeeId: exp.employeeId,
            })
            await refresh()
            setShowAdd(false)
          }}
          onClose={() => setShowAdd(false)}
        />
      )}

      <ManagerNav active={navTab} onSelect={onNav} />
    </div>
  )
}

function SummaryPill({
  label,
  value,
  red,
}: {
  label: string
  value: string
  red?: boolean
}) {
  return (
    <div className="flex-1 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-sm p-3 text-center">
      <div className="text-[9px] text-[var(--text-subtle)] tracking-widest uppercase mb-1">
        {label}
      </div>
      <div
        className={`font-display font-800 text-sm ${
          red ? "text-[#E06060]" : "text-[var(--text)]"
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function AddExpenseSheet({
  stylists,
  onSave,
  onClose,
}: {
  stylists: Stylist[]
  onSave: (
    e: Pick<Expense, "type" | "description" | "amount" | "paymentMode" | "employeeId">,
  ) => Promise<void>
  onClose: () => void
}) {
  const [type, setType] = useState<"general" | "advance">("general")
  const [desc, setDesc] = useState("")
  const [amount, setAmount] = useState("")
  const [mode, setMode] = useState<"cash" | "gpay">("cash")
  const [empId, setEmpId] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!desc || !amount || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave({
        type,
        description: desc,
        amount: Number(amount),
        paymentMode: mode,
        employeeId: type === "advance" ? empId : undefined,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the expense.")
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface)] border-t border-[var(--border-subtle)] rounded-t-xl animate-sheet-up flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] flex-shrink-0">
          <span className="font-display font-700 tracking-wider uppercase text-sm text-[var(--text)]">
            Add Expense
          </span>
          <button
            className="text-[var(--text-muted)] tap-target"
            onClick={onClose}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-5">
          {/* Type */}
          <div>
            <div className="text-[9px] tracking-widest uppercase text-[var(--text-subtle)] mb-2">
              Expense Type
            </div>
            <div className="flex gap-2">
              {([
                ["general", "General"],
                ["advance", "Employee Advance"],
              ] as const).map(([val, label]) => (
                <button
                  key={val}
                  className={`flex-1 h-10 rounded-sm font-display font-700 tracking-wide uppercase text-[11px] tap-target transition-all ${
                    type === val
                      ? "bg-[var(--text)] text-[var(--bg)]"
                      : "bg-[var(--elevated)] border border-[var(--border)] text-[var(--text-muted)]"
                  }`}
                  onClick={() => setType(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {type === "advance" && (
            <div>
              <div className="text-[9px] tracking-widest uppercase text-[var(--text-subtle)] mb-2">
                Employee
              </div>
              <div className="flex flex-col gap-1">
                {stylists.map((s) => (
                  <button
                    key={s.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-sm border tap-target ${
                      empId === s.id
                        ? "border-[var(--text)] bg-[var(--elevated)]"
                        : "border-[var(--border-subtle)]"
                    }`}
                    onClick={() => setEmpId(s.id)}
                  >
                    <span className="font-display font-700 text-sm text-[var(--text)]">
                      {s.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-[9px] tracking-widest uppercase text-[var(--text-subtle)] mb-2">
              Description
            </div>
            <input
              className="w-full bg-[var(--surface-soft)] border border-[var(--border)] rounded-sm px-4 py-3 text-[var(--text)] text-sm outline-none focus:border-[#3D6FA8] transition-colors"
              placeholder="What's this for?"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div>
            <div className="text-[9px] tracking-widest uppercase text-[var(--text-subtle)] mb-2">
              Amount
            </div>
            <div className="flex items-center gap-2 bg-[var(--surface-soft)] border border-[var(--border)] rounded-sm px-4 py-3 focus-within:border-[#3D6FA8] transition-colors">
              <span className="font-display font-800 text-xl text-[var(--text-faint)]">
                ₹
              </span>
              <input
                type="number"
                inputMode="numeric"
                className="flex-1 bg-transparent text-[var(--text)] text-xl font-display font-700 outline-none placeholder-[var(--text-faint)]"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="text-[9px] tracking-widest uppercase text-[var(--text-subtle)] mb-2">
              Payment Mode
            </div>
            <div className="flex gap-2">
              {(["cash", "gpay"] as const).map((m) => (
                <button
                  key={m}
                  className={`flex-1 h-11 rounded-sm font-display font-700 tracking-wider uppercase text-xs tap-target transition-all ${
                    mode === m
                      ? "bg-[var(--text)] text-[var(--bg)]"
                      : "bg-[var(--elevated)] border border-[var(--border)] text-[var(--text-muted)]"
                  }`}
                  onClick={() => setMode(m)}
                >
                  {m === "gpay" ? "GPay" : "Cash"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[var(--border-subtle)] flex-shrink-0">
          {error && (
            <div className="text-xs text-[#E06060] tracking-wide mb-3 text-center animate-fade-in">
              {error}
            </div>
          )}
          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={!desc || !amount || saving || (type === "advance" && !empId)}
            onClick={save}
          >
            {saving ? "Saving…" : "Save Expense"}
          </Button>
        </div>
      </div>
    </div>
  )
}
