import { useState } from "react"
import { useKeyboardStable } from "../../hooks/useKeyboardStable"
import { Button, NumberSuggestions, PhoneInput, ScreenBackdrop, BACKDROPS } from "../../components/ui"
import { useCustomerSuggestions } from "../../hooks/useCustomerSuggestions"
import type { CustomerSuggestion } from "../../lib/api/staff"
import { isValidPhone, phoneError } from "../../lib/phone"
import { Check, MessageCircle } from "lucide-react"

interface Props {
  customerName: string
  /** A typed number, or (for a number picked from the saved list) just the customer's id. */
  onContinue: (phone?: string, customerId?: string) => void
  onBack: () => void
}

export default function CustomerPhone({
  customerName,
  onContinue,
  onBack,
}: Props) {
  useKeyboardStable()
  const [phone, setPhone] = useState("")
  const [skipWarn, setSkipWarn] = useState(false)
  /** A saved number the customer tapped in the list (only its masked form is known here). */
  const [picked, setPicked] = useState<CustomerSuggestion | null>(null)
  const suggestions = useCustomerSuggestions(customerName, phone, !picked && !isValidPhone(phone))

  const handleSkip = () => {
    if (!skipWarn) {
      setSkipWarn(true)
      return
    }
    onContinue(undefined)
  }

  return (
    <div className="relative isolate flex flex-col min-h-full bg-[var(--bg)] animate-slide-up">
      <ScreenBackdrop src={BACKDROPS.phone} />
      {/* Progress */}
      <div className="px-6 pt-page flex-shrink-0">
        <div className="flex items-center gap-2 mb-8">
          <div className="flex-1 h-px bg-[var(--text)]" />
          <div className="flex-1 h-px bg-[var(--text)]" />
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          {/* With the "what are you here for?" step back on: add a 4th segment and show "02 / 04".
          <div className="flex-1 h-px bg-[var(--border-subtle)]" /> */}
          <span className="text-[10px] tracking-[0.2em] text-[var(--text-muted)] ml-2">
            02 / 03
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between px-6 pb-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-display font-800 text-4xl tracking-wider text-[var(--text)] leading-tight">
              Stay
              <br />
              connected
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-2">
              Add your WhatsApp number to receive your bill, keep your visit
              history and get occasional CAVE offers.
            </p>
          </div>

          {/* Phone input */}
          <div className="flex flex-col gap-2">
            {picked ? (
              <div className="flex items-center gap-3 border-b-2 border-[#2E7D58] pb-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2E7D58] text-white">
                  <Check size={15} strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1 font-display text-3xl font-500 tracking-wide text-[var(--text)]">+91 {picked.maskedPhone}</span>
                <button type="button" className="shrink-0 px-2 py-2 text-sm underline text-[var(--text-secondary)]" onClick={() => setPicked(null)}>
                  Change
                </button>
              </div>
            ) : (
            <div className="flex items-end gap-3 border-b-2 border-[var(--border-subtle)] focus-within:border-[var(--text)] transition-colors pb-2">
              <span className="text-[var(--text-muted)] text-xl font-display">
                +91
              </span>
              <PhoneInput
                className="flex-1 min-w-0 bg-transparent text-[var(--text)] text-3xl font-display font-500 tracking-wide outline-none placeholder-[var(--text-faint)]"
                placeholder="00000 00000"
                value={phone}
                onChange={setPhone}
                // autoFocus removed: the keyboard opens only when the customer taps the field.
                // autoFocus
                showError={false}
              />
            </div>
            )}
            {!picked && (
              <div
                className={`text-[10px] ${
                  phoneError(phone) ? "text-[#E06060]" : "text-[var(--text-faint)]"
                }`}
              >
                {phoneError(phone) ?? `${phone.length}/10 digits`}
              </div>
            )}
            {!picked && (
              <NumberSuggestions items={suggestions.items} more={suggestions.more} onPick={(c) => { setPicked(c); setPhone("") }} className="mt-1" />
            )}
          </div>

          {/* WhatsApp indicator (below the field so the field sits higher, clear of the keyboard) */}
          <div className="flex items-center gap-2 text-[#2E7D58]">
            <MessageCircle size={14} strokeWidth={1.5} />
            <span className="text-[11px] tracking-wide">Sent via WhatsApp</span>
          </div>

          {/* Skip warning */}
          {skipWarn && (
            <div className="bg-[var(--elevated)] border border-[var(--border)] rounded-sm p-4 animate-fade-in">
              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                Without a number, we may not be able to send your bill or
                connect future visits to your profile.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={!picked && !isValidPhone(phone)}
            onClick={() => (picked ? onContinue(undefined, picked.id) : onContinue("+91 " + phone))}
          >
            Continue
          </Button>
          <Button variant="ghost" fullWidth size="md" onClick={handleSkip}>
            {skipWarn ? "Continue without number" : "Skip for now"}
          </Button>
          <Button variant="ghost" fullWidth size="sm" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}
