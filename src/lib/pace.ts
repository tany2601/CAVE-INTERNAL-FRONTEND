import type { Stylist } from "../types"

/** Business hours used to judge pace (IST): the day's target is "due" gradually between these. */
const OPEN_HOUR = 10
const CLOSE_HOUR = 21

export type PaceStatus = "good" | "on-track" | "below"

/** Share of the working day that has passed, between 0.1 (just opened) and 1 (closed). */
export const dayProgress = (now = new Date()): number => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now)
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0)
  const elapsed = hour + minute / 60 - OPEN_HOUR
  return Math.min(1, Math.max(0.1, elapsed / (CLOSE_HOUR - OPEN_HOUR)))
}

/**
 * Compares today's revenue with where the daily target says they should be by now.
 * 110%+ of the pace is "good", 75%+ is "on track", anything slower is "below".
 */
export const paceOf = (stylist: Stylist, now = new Date()): { status: PaceStatus; percent: number } => {
  const target = stylist.dailyTarget ?? 0
  if (target <= 0) return { status: "on-track", percent: 100 }
  const expected = target * dayProgress(now)
  const percent = Math.round((stylist.revenueToday / expected) * 100)
  return { status: percent >= 110 ? "good" : percent >= 75 ? "on-track" : "below", percent }
}

export const PACE_LABEL: Record<PaceStatus, string> = {
  good: "Good",
  "on-track": "On track",
  below: "Below",
}

export const PACE_CLASS: Record<PaceStatus, string> = {
  good: "text-[#4CAF86] border-[rgba(46,125,88,0.3)] bg-[rgba(46,125,88,0.1)]",
  "on-track": "text-[#6B9FD4] border-[rgba(61,111,168,0.3)] bg-[rgba(61,111,168,0.1)]",
  below: "text-[#E06060] border-[rgba(125,46,46,0.35)] bg-[rgba(125,46,46,0.12)]",
}
