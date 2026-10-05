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
