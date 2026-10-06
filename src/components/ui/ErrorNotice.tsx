import { AlertCircle, WifiOff } from "lucide-react"
import type { ReactNode } from "react"
import { errorTitle } from "../../lib/errors"

/** Friendly error panel: heading, one calm sentence, and a comfortably wide Try again button. */
export function ErrorNotice({
  message,
  onRetry,
  extra,
  className = "",
}: {
  message: string
  onRetry?: () => void
  /** Additional actions shown next to Try again (e.g. Log out). */
  extra?: ReactNode
  className?: string
}) {
  const title = errorTitle(message)
  const Icon = title === "No connection" ? WifiOff : AlertCircle
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-6 py-8 text-center ${className}`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(224,96,96,0.12)] text-[#E06060]">
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <div className="font-display text-base font-700 uppercase tracking-wider text-[var(--text)]">{title}</div>
      <p className="max-w-xs text-xs leading-relaxed text-[var(--text-muted)]">{message}</p>
      {(onRetry || extra) && (
        <div className="mt-1 flex w-full max-w-xs flex-col gap-2 sm:max-w-md sm:flex-row sm:justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-[var(--text)] px-6 font-display text-sm font-700 uppercase tracking-wider text-[var(--bg)] active:opacity-80 sm:w-auto sm:min-w-[9rem]"
            >
              Try again
            </button>
          )}
          {extra}
        </div>
      )}
    </div>
  )
}
