import type { Period } from "../types"

export function PeriodTabs({
  value,
  onChange,
  options = ["Today", "This Week", "This Month", "Custom"],
}: {
  value: Period
  onChange: (period: Period) => void
  options?: string[]
  custom?: boolean
}) {
  return (
    <div className="admin-segment w-fit max-w-full shrink-0 overflow-x-auto sm:overflow-visible">
      {options.map((option) => (
        <button
          key={option}
          className={value === option ? "active" : ""}
          onClick={() => onChange(option as Period)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
