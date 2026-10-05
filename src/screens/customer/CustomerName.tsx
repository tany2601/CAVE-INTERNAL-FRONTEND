import { useState } from "react"
import { Button, ScreenBackdrop, BACKDROPS } from "../../components/ui"
import { isValidPersonName, sanitizePersonName } from "../../lib/names"

const MIN_NAME_LENGTH = 3

interface Props {
  onContinue: (name: string) => void
  onBack: () => void
}

export default function CustomerName({ onContinue, onBack }: Props) {
  const [name, setName] = useState("")
  const [showError, setShowError] = useState(false)
  const tooShort = !isValidPersonName(name, MIN_NAME_LENGTH)

  const submit = () => {
    if (tooShort) {
      setShowError(true)
      return
    }
    onContinue(name.trim())
  }

  return (
    <div className="relative isolate flex flex-col min-h-full bg-[var(--bg)] animate-slide-up">
      <ScreenBackdrop src={BACKDROPS.name} />
      {/* Progress */}
      <div className="px-6 pt-page flex-shrink-0">
        <div className="flex items-center gap-2 mb-8">
          <div className="flex-1 h-px bg-[var(--text)]" />
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          <span className="text-[10px] tracking-[0.2em] text-[var(--text-muted)] ml-2">
            01 / 04
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between px-6 pb-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-display font-800 text-4xl tracking-wider text-[var(--text)] leading-tight">
              What's your
              <br />
              name?
            </h1>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              We'll use this to keep your visits together.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <input
              className="w-full bg-transparent border-b-2 border-[var(--border-subtle)] focus:border-[var(--text)] text-[var(--text)] text-3xl font-display font-500 tracking-wide pb-2 outline-none transition-colors placeholder-[var(--text-faint)]"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => {
                const next = sanitizePersonName(e.target.value)
                setName(next)
                if (isValidPersonName(next, MIN_NAME_LENGTH)) setShowError(false)
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              aria-invalid={showError}
              autoFocus
              autoComplete="off"
              style={{ caretColor: "var(--text)" }}
            />
            {showError && (
              <p role="alert" className="text-sm text-[#E06060] animate-fade-in">
                Please enter your real name 😉
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={!name.trim()}
            onClick={submit}
          >
            Continue
          </Button>
          <Button variant="ghost" fullWidth size="md" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}
