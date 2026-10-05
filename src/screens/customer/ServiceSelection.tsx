import { Button, ScreenBackdrop, ServiceTile, BACKDROPS } from "../../components/ui"
import { useBranchData } from "../../context/BranchDataContext"

interface Props {
  selected: string[]
  onChange: (ids: string[]) => void
  onContinue: () => void
  onSkip: () => void
  onBack: () => void
}

/** Optional step: pick services up front. They're pre-selected when the session is billed. */
export default function ServiceSelection({
  selected,
  onChange,
  onContinue,
  onSkip,
  onBack,
}: Props) {
  const { services } = useBranchData()
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])

  return (
    <div className="relative isolate flex flex-col h-full bg-[var(--bg)] animate-slide-up">
      <ScreenBackdrop src={BACKDROPS.services} />

      <div className="px-6 pt-page flex-shrink-0">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-px bg-[var(--text)]" />
          <div className="flex-1 h-px bg-[var(--text)]" />
          <div className="flex-1 h-px bg-[var(--text)]" />
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          <span className="text-[10px] tracking-[0.2em] text-[var(--text-muted)] ml-2">
            03 / 04
          </span>
        </div>
        <h1 className="font-display font-800 text-4xl tracking-wider text-[var(--text)] leading-tight">
          What are you
          <br />
          here for?
        </h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-2">
          Pick your services now, or skip and decide with your stylist.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {services.length === 0 ? (
          <div className="py-10 text-center text-xs text-[var(--text-muted)]">
            No services on the menu yet. You can continue and add them at billing.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {services.map((service, index) => (
              <ServiceTile
                key={service.id}
                name={service.name}
                price={service.price}
                index={index}
                selected={selected.includes(service.id)}
                onToggle={() => toggle(service.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t border-[var(--border-subtle)] flex flex-col gap-2 bg-[var(--bg)]">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          disabled={selected.length === 0}
          onClick={onContinue}
        >
          {selected.length === 0
            ? "Select services"
            : `Continue · ${selected.length} selected`}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" fullWidth size="md" onClick={onSkip}>
            Skip for now
          </Button>
          <Button variant="ghost" fullWidth size="md" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}
