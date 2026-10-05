/** Calendar-day helpers (YYYY-MM-DD strings, no timezones involved). */

const pad = (n: number) => String(n).padStart(2, "0")

export const toDayKey = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayKey = () => toDayKey(new Date())

export const parseDayKey = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

const SHORT = { day: "numeric", month: "short" } as const

export function formatDayKey(key: string, withYear = false): string {
  return parseDayKey(key).toLocaleDateString("en-IN", withYear ? { ...SHORT, year: "numeric" } : SHORT)
}

/** "5 Oct – 12 Oct 2026" */
export function formatRange(from: string, to: string): string {
  if (from === to) return formatDayKey(from, true)
  const sameYear = from.slice(0, 4) === to.slice(0, 4)
  return `${formatDayKey(from, !sameYear)} – ${formatDayKey(to, true)}`
}
