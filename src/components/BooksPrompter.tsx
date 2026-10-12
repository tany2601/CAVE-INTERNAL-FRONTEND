import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useBranchData } from "../context/BranchDataContext"
import MorningOpening from "../screens/manager/MorningOpening"
import EveningClosing from "../screens/manager/EveningClosing"
import { staffApi } from "../lib/api"
import { dayKeyOf, inClosingWindow } from "../lib/greeting"

type Kind = "opening" | "closing"
interface Item {
  date: string
  kind: Kind
}
interface PendingDay {
  date: string
  openingMissing: boolean
  closingMissing: boolean
}

/** Screens where a manager can be interrupted; never in the middle of a customer's check-in or bill. */
const CALM_SCREENS = [
  "welcome",
  "manager-home",
  "manager-sessions",
  "commission",
  "cash",
  "expenses",
  "manager-menu",
]
const SKIP_KEY = "cave-books-skip"
const keyOf = (i: Item) => `${i.date}:${i.kind}`

const readSkips = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem(SKIP_KEY) ?? "[]")
  } catch {
    return []
  }
}

/**
 * Asks the manager for the day's books at the right moments:
 *  · opening balance, when today's isn't recorded yet (any time, mainly the morning);
 *  · closing balance, between 8:45 PM and 9:15 PM while today isn't closed;
 *  · anything from the last week that was forgotten (opening or closing), the next time they sign in.
 * Every prompt can be skipped; a skip lasts until the app is closed. Nothing is lost by skipping:
 * missed entries come back the next day and can always be added from Cash.
 */
export function BooksPrompter({ screen }: { screen: string }) {
  const { auth } = useAuth()
  const { ready, day, refresh } = useBranchData()
  const manager = auth?.role === "MANAGER"
  const [pending, setPending] = useState<PendingDay[]>([])
  const [skipped, setSkipped] = useState<string[]>(readSkips)
  const [, setTick] = useState(0)

  const loadPending = useCallback(async () => {
    try {
      setPending(await staffApi.getPendingDays())
    } catch {
      // The prompts are a convenience; never block the app if this fails.
    }
  }, [])

  useEffect(() => {
    if (manager && ready) void loadPending()
  }, [manager, ready, loadPending])

  // Re-check the clock so the closing prompt appears at 8:45 PM without anyone touching the app.
  useEffect(() => {
    if (!manager) return
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000)
    const onVisible = () => document.visibilityState === "visible" && setTick((t) => t + 1)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [manager])

  const today = dayKeyOf()
  const queue = useMemo<Item[]>(() => {
    const items: Item[] = []
    // Oldest forgotten day first, opening before closing.
    for (const p of [...pending].sort((a, b) => a.date.localeCompare(b.date))) {
      if (p.openingMissing) items.push({ date: p.date, kind: "opening" })
      if (p.closingMissing) items.push({ date: p.date, kind: "closing" })
    }
    if (day && !day.closed && !day.openingSet) items.push({ date: today, kind: "opening" })
    if (day && !day.closed && inClosingWindow()) items.push({ date: today, kind: "closing" })
    return items
    // inClosingWindow() reads the clock, which the 30-second tick re-renders for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, day, today, Math.floor(Date.now() / 30_000)])

  const item = manager && ready && CALM_SCREENS.includes(screen) ? queue.find((i) => !skipped.includes(keyOf(i))) : undefined
  if (!item) return null

  const skip = () => {
    const next = [...skipped, keyOf(item)]
    setSkipped(next)
    try {
      sessionStorage.setItem(SKIP_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }
  const forDate = item.date === today ? undefined : item.date
  const saved = async () => {
    await refresh()
    await loadPending()
  }

  return item.kind === "opening" ? (
    <MorningOpening
      key={keyOf(item)}
      date={item.date}
      onSkip={skip}
      onSave={async (cash, gpay) => {
        await staffApi.setOpeningBalance(cash, gpay, forDate)
        await saved()
      }}
    />
  ) : (
    <EveningClosing
      key={keyOf(item)}
      date={item.date}
      onSkip={skip}
      onSave={async (cash, gpay) => {
        await staffApi.closeDay(cash, gpay, forDate)
        await saved()
      }}
    />
  )
}
