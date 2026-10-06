export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export const formatDuration = (start: Date): string => {
  const mins = Math.max(0, Math.floor((Date.now() - start.getTime()) / 60000))
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export const formatAmount = (n: number): string => {
  return (
    "₹" +
    n.toLocaleString("en-IN", {
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2,
    })
  )
}

/** "45m", "1h 05m", "—" for zero. Input is whole minutes. */
export const formatMinutes = (mins: number): string => {
  const m = Math.max(0, Math.round(mins))
  if (m === 0) return "—"
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`
}

/** How long a finished session took, from its start to when it was closed. */
export const sessionMinutes = (start: Date, end?: Date): number =>
  end ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)) : 0
