import { useEffect, useState } from "react"
import { Check, X } from "lucide-react"
import { Button, NumberSuggestions, PhoneInput, QuickSteps } from "../../components/ui"
import { useCustomerSuggestions } from "../../hooks/useCustomerSuggestions"
import type { CustomerSuggestion } from "../../lib/api/staff"
import { useBranchData } from "../../context/BranchDataContext"
import { staffApi } from "../../lib/api"
import { capitalizeName, isValidPersonName, sanitizePersonName } from "../../lib/names"
import { isValidPhone } from "../../lib/phone"
import { useKeyboardStable } from "../../hooks/useKeyboardStable"

export interface QuickCustomerDetails {
  name: string
  phone?: string
  /** A returning customer picked from the suggestions: the server uses their saved number. */
  customerId?: string
  stylistId: string
}

/**
 * Step 1 of a quick bill: who the customer is, their number, and who served them.
 * Written for people in a hurry: one screen, big buttons, and a plain sentence saying what is still missing.
 */
export default function QuickCustomer({
  onNext,
  onCancel,
  busy,
  error,
}: {
  onNext: (details: QuickCustomerDetails) => void
  onCancel: () => void
  busy?: boolean
  error?: string | null
}) {
  useKeyboardStable()
  const { stylists } = useBranchData()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [noNumber, setNoNumber] = useState(false)
  const [stylistId, setStylistId] = useState("")
  const [returning, setReturning] = useState<{ visits: number } | null>(null)
  /** A saved number the person tapped in the list (only its masked form is known here). */
  const [picked, setPicked] = useState<CustomerSuggestion | null>(null)
  const suggestions = useCustomerSuggestions(name, phone, !picked && !noNumber && !isValidPhone(phone))

  // A number we already know: fill in the name and say it is a returning customer.
  useEffect(() => {
    setReturning(null)
    if (!isValidPhone(phone)) return
    let live = true
    staffApi
      .lookupCustomer(phone)
      .then((r) => {
        if (!live || !r.found) return
        setReturning({ visits: r.visitCount })
        setName((current) => (current.trim() ? current : sanitizePersonName(r.name ?? "")))
      })
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [phone])

  const nameOk = isValidPersonName(name, 2)
  const phoneOk = isValidPhone(phone) || noNumber || !!picked
  const ready = nameOk && phoneOk && !!stylistId
  const missing = !nameOk
    ? "Type the customer's name."
    : !phoneOk
      ? "Type the 10-digit mobile number, or tap the button below if the customer does not want to give it."
      : !stylistId
        ? "Tap the name of the person who served the customer."
        : ""

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[var(--bg)] animate-slide-up">
      <div className="border-b border-[var(--border-subtle)] px-5 pt-page pb-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-base font-800 uppercase tracking-wider text-[var(--text)]">Quick bill</div>
          <button aria-label="Cancel" className="flex h-9 w-9 items-center justify-center text-[var(--text-muted)]" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <QuickSteps current={1} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto flex max-w-xl flex-col gap-7">
          <h1 className="font-display text-3xl font-800 leading-tight text-[var(--text)]">Who is the customer?</h1>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-600 text-[var(--text)]">Customer name</span>
            <input
              className="h-14 w-full border border-[var(--border)] bg-[var(--surface)] px-4 text-lg text-[var(--text)] outline-none"
              placeholder="e.g. Ravi Kumar"
              autoComplete="off"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(capitalizeName(sanitizePersonName(e.target.value)))
                setPicked(null) // a different name is a different customer: pick the number again
              }}
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-600 text-[var(--text)]">Mobile number</span>
            {picked ? (
              <div className="flex min-h-14 items-center gap-3 border-2 border-[#15803D] bg-[var(--surface)] px-4 py-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#15803D] text-white">
                  <Check size={15} strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-600 tracking-[0.12em] text-[var(--text)]">+91 {picked.maskedPhone}</span>
                  <span className="block text-[11px] text-[var(--text-muted)]">Saved number chosen</span>
                </span>
                <button type="button" className="shrink-0 px-2 py-2 text-sm font-600 text-[var(--link,#7db7f0)] underline" onClick={() => setPicked(null)}>
                  Change
                </button>
              </div>
            ) : (
              <>
                <PhoneInput
                  value={phone}
                  onChange={(v) => {
                    setPhone(v)
                    if (v) setNoNumber(false)
                  }}
                  className="h-14 w-full border border-[var(--border)] bg-[var(--surface)] px-4 text-lg text-[var(--text)] outline-none"
                />
                <NumberSuggestions
                  items={suggestions.items}
                  more={suggestions.more}
                  onPick={(c) => {
                    setPicked(c)
                    setPhone("")
                    setNoNumber(false)
                  }}
                />
              </>
            )}
            <div className="text-xs leading-relaxed text-[var(--text-muted)]">
              The bill is sent to this number on WhatsApp, and it counts the customer's visits towards a free haircut.
            </div>
            {picked && picked.visits > 0 && (
              <div role="status" className="border border-[#4CAF86]/40 bg-[#4CAF86]/10 px-3 py-2 text-sm text-[var(--text)]">
                Welcome back. This customer has visited {picked.visits} time{picked.visits === 1 ? "" : "s"} before.
              </div>
            )}
            {!picked && returning && (
              <div role="status" className="border border-[#4CAF86]/40 bg-[#4CAF86]/10 px-3 py-2 text-sm text-[var(--text)]">
                Welcome back. This customer has visited {returning.visits} time{returning.visits === 1 ? "" : "s"} before.
              </div>
            )}
            <button
              type="button"
              aria-pressed={noNumber}
              className="mt-1 flex min-h-12 items-center justify-center rounded-sm border border-white/25 px-4 py-2 text-center text-sm font-600 text-white shadow-[0_2px_0_rgba(0,0,0,0.35)] active:translate-y-px"
              style={{ background: noNumber ? "#15803D" : "#475569" }}
              onClick={() => {
                setNoNumber((v) => !v)
                setPhone("")
                setPicked(null)
              }}
            >
              {noNumber ? "✓ No mobile number for this customer (tap to undo)" : "Customer does not want to give a number"}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-600 text-[var(--text)]">Who served the customer?</span>
            <div className="grid grid-cols-2 gap-2">
              {stylists
                .filter((s) => s.available)
                .map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={stylistId === s.id}
                    className={`min-h-14 border px-3 py-3 font-display text-base font-700 tracking-wide ${
                      stylistId === s.id ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
                    }`}
                    onClick={() => setStylistId(s.id)}
                  >
                    {s.name}
                  </button>
                ))}
            </div>
            <div className="text-xs text-[var(--text-muted)]">This decides whose commission the bill counts towards.</div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg)] px-5 py-4 safe-bottom">
        <div className="mx-auto max-w-xl">
          {error && <div className="mb-2 text-center text-sm text-[#E06060]">{error}</div>}
          {!ready && !busy && <div className="mb-2 text-center text-xs text-[var(--text-muted)]">{missing}</div>}
          <Button
            fullWidth
            size="lg"
            disabled={!ready || busy}
            onClick={() =>
              onNext({ name: name.trim(), phone: picked ? undefined : phone || undefined, customerId: picked?.id, stylistId })
            }
          >
            {busy ? "Please wait…" : "Next: choose services →"}
          </Button>
        </div>
      </div>
    </div>
  )
}
