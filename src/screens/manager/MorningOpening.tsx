import { useState } from "react"
import { Button, Logo } from "../../components/ui"

interface Props {
  onSave: (cashBalance: number, gpayBalance: number) => Promise<void> | void
  onSkip: () => void
}

export default function MorningOpening({ onSave, onSkip }: Props) {
  const [cash, setCash] = useState("")
  const [gpay, setGpay] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col overflow-y-auto animate-slide-up">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(/images/photos/1585747860715-2ba37e788b70.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.04,
        }}
      />

      <div className="relative z-10 flex flex-col min-h-full gap-8 px-6 pt-page-fluid pb-[max(1.5rem,env(safe-area-inset-bottom))] justify-between">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <Logo size="sm" />
            <div className="text-[10px] text-[var(--text-muted)] tracking-[0.2em] uppercase mt-2">
              {dateStr}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="font-display font-800 text-4xl tracking-wider text-[var(--text)]">
              Good morning
            </h1>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Start the day by confirming your opening balances.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <AmountField
              label="Opening Cash"
              value={cash}
              onChange={setCash}
              placeholder="0"
            />
            <AmountField
              label="Opening GPay Balance"
              value={gpay}
              onChange={setGpay}
              placeholder="0"
            />
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-sm p-4">
            <div className="text-[10px] text-[var(--text-muted)] tracking-wider mb-3">
              Summary
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[var(--text-secondary)]">Cash</span>
              <span className="font-display font-700 text-sm text-[var(--text)]">
                ₹{cash || "0"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[var(--text-secondary)]">GPay</span>
              <span className="font-display font-700 text-sm text-[var(--text)]">
                ₹{gpay || "0"}
              </span>
            </div>
            <div className="border-t border-[var(--border-subtle)] mt-2 pt-2 flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">
                Total
              </span>
              <span className="font-display font-700 text-base text-[var(--text)]">
                ₹{(Number(cash) + Number(gpay)).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {error && (
            <div className="text-xs text-[#E06060] tracking-wide text-center">
              {error}
            </div>
          )}
          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={saving}
            onClick={async () => {
              setSaving(true)
              setError(null)
              try {
                await onSave(Number(cash) || 0, Number(gpay) || 0)
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Could not save the balances.",
                )
                setSaving(false)
              }
            }}
          >
            {saving ? "Saving…" : "Save & Start Day"}
          </Button>
          <Button variant="ghost" fullWidth size="md" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  )
}

function AmountField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)]">
        {label}
      </label>
      <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-sm px-4 py-3 focus-within:border-[#3D6FA8] transition-colors">
        <span className="font-display font-700 text-xl text-[var(--text-faint)]">
          ₹
        </span>
        <input
          type="number"
          inputMode="numeric"
          className="flex-1 bg-transparent text-[var(--text)] text-2xl font-display font-600 outline-none placeholder-[var(--text-faint)]"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
