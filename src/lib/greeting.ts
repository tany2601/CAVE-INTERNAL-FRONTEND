/** Morning until 12:00, afternoon until 17:00, evening after that (the device's local time). */
export type TimeOfDay = "morning" | "afternoon" | "evening"

export const timeOfDay = (now: Date = new Date()): TimeOfDay => {
  const hour = now.getHours()
  return hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"
}

/** "Good morning" / "Good afternoon" / "Good evening" for the current time. */
export const greeting = (now: Date = new Date()): string => `Good ${timeOfDay(now)}`

/** The closing-books prompt appears between 8:45 PM and 9:15 PM. */
export const CLOSING_WINDOW = { from: 20 * 60 + 45, to: 21 * 60 + 15 }

export const inClosingWindow = (now: Date = new Date()): boolean => {
  const minutes = now.getHours() * 60 + now.getMinutes()
  return minutes >= CLOSING_WINDOW.from && minutes <= CLOSING_WINDOW.to
}

/** Local calendar day as YYYY-MM-DD (what the books API expects). */
export const dayKeyOf = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

export const addDays = (key: string, days: number): string => {
  const d = new Date(`${key}T12:00:00`)
  d.setDate(d.getDate() + days)
  return dayKeyOf(d)
}

/** "Tuesday, 6 October" for a YYYY-MM-DD key. */
export const longDate = (key: string): string =>
  new Date(`${key}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
