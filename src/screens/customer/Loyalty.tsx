import { useBranchData } from "../../context/BranchDataContext"
import { Customer } from "../../types"
import { ScreenBackdrop, BACKDROPS, BrandLogo } from "../../components/ui"
import { Gift, Scissors, ArrowRight } from "lucide-react"

interface Props {
  customer: Customer
  onContinue: () => void
  onSkip: () => void
  /** Customer left without a service: abandon check-in and return to the start screen. */
  onCancel: () => void
}

export default function Loyalty({ customer, onContinue, onCancel }: Props) {
  const { branchShort } = useBranchData()
  const visits = Math.min(customer.visitCount, customer.loyaltyTarget)
  const remaining = Math.max(customer.loyaltyTarget - visits, 0)

  return (
    <div className="relative isolate flex flex-col min-h-full bg-[var(--bg)] animate-slide-up">
      <ScreenBackdrop src={BACKDROPS.loyalty} />
      <div className="px-6 pt-page pb-5 flex items-start justify-between">
        <div>
          <BrandLogo height={24} />
          <div className="text-[9px] tracking-[0.35em] uppercase text-[var(--text-muted)] mt-1">
            {branchShort} · Loyalty
          </div>
        </div>
        <button
          className="h-9 px-4 border border-[var(--border)] text-[10px] tracking-[0.2em] uppercase text-[var(--text-secondary)] tap-target"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>

      <button
        className="flex-1 px-6 pb-10 flex flex-col justify-center text-left"
        onClick={onContinue}
      >
        <div className="mb-9">
          <div className="text-[10px] tracking-[0.35em] uppercase text-[var(--text-muted)] mb-3">
            Service confirmed
          </div>
          <div className="font-display font-700 text-4xl leading-tight text-[var(--text)]">
            Enjoy your service,
            <br />
            {customer.name}.
          </div>
          <div className="text-sm text-[var(--text-secondary)] mt-3">
            Your stylist will be with you shortly.
          </div>
        </div>

        <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-muted)]">
                Your loyalty journey
              </div>
              <div className="font-display font-700 text-xl text-[var(--text)] mt-1">
                {visits} of {customer.loyaltyTarget} visits
              </div>
            </div>
            <div className="w-11 h-11 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text)]">
              <Scissors size={18} strokeWidth={1.5} />
            </div>
          </div>

          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${customer.loyaltyTarget}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: customer.loyaltyTarget }).map((_, index) => {
              const complete = index < visits
              const reward = index === customer.loyaltyTarget - 1
              return (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 min-w-0"
                >
                  <div
                    className={`aspect-square w-full rounded-full border flex items-center justify-center ${
                      complete
                        ? "bg-[var(--text)] border-[var(--text)] text-[var(--bg)]"
                        : "bg-[var(--surface-soft)] border-[var(--border-subtle)] text-[var(--text-faint)]"
                    }`}
                  >
                    {reward ? (
                      <Gift size={15} strokeWidth={1.5} />
                    ) : (
                      <Scissors size={14} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="text-[8px] font-600 uppercase tracking-wide text-[var(--text-muted)]">
                    {reward ? "Free" : `#${index + 1}`}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-[var(--border-subtle)] mt-5 pt-4 text-center text-xs text-[var(--text-secondary)]">
            {customer.rewardReady
              ? "Your free haircut is ready to redeem."
              : `${visits}/${customer.loyaltyTarget} — ${remaining} more visit${
                  remaining === 1 ? "" : "s"
                } for a free haircut.`}
          </div>
        </div>

        <div className="w-full flex items-center justify-center gap-2 mt-8 text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)]">
          Tap to choose your stylist
          <ArrowRight size={13} />
        </div>
      </button>
    </div>
  )
}
