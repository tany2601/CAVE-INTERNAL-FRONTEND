import { useState } from "react"
import { Button, PhoneInput, ScreenBackdrop, BACKDROPS } from "../../components/ui"
import { isValidPhone, phoneError } from "../../lib/phone"
import { MessageCircle } from "lucide-react"

interface Props {
  customerName: string
  onContinue: (phone?: string) => void
  onBack: () => void
}

export default function CustomerPhone({
  customerName,
  onContinue,
  onBack,
}: Props) {
  const [phone, setPhone] = useState("")
  const [skipWarn, setSkipWarn] = useState(false)

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
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          <span className="text-[10px] tracking-[0.2em] text-[var(--text-muted)] ml-2">
            02 / 04
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

          {/* WhatsApp indicator */}
          <div className="flex items-center gap-2 text-[#2E7D58]">
            <MessageCircle size={14} strokeWidth={1.5} />
            <span className="text-[11px] tracking-wide">Sent via WhatsApp</span>
          </div>

          {/* Phone input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-3 border-b-2 border-[var(--border-subtle)] focus-within:border-[var(--text)] transition-colors pb-2">
              <span className="text-[var(--text-muted)] text-xl font-display">
                +91
              </span>
              <PhoneInput
                className="flex-1 min-w-0 bg-transparent text-[var(--text)] text-3xl font-display font-500 tracking-wide outline-none placeholder-[var(--text-faint)]"
                placeholder="00000 00000"
                value={phone}
                onChange={setPhone}
                autoFocus
                showError={false}
              />
            </div>
            <div
              className={`text-[10px] ${
                phoneError(phone) ? "text-[#E06060]" : "text-[var(--text-faint)]"
              }`}
            >
              {phoneError(phone) ?? `${phone.length}/10 digits`}
            </div>
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
            disabled={!isValidPhone(phone)}
            onClick={() => onContinue("+91 " + phone)}
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
