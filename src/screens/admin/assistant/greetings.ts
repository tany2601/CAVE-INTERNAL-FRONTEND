import { dayKeyOf, greeting, timeOfDay } from "../../../lib/greeting"

/** The two people Baron greets. Change the names here. */
export const OWNERS = ["Rahul", "Priyesh"] as const

// Remembered on this device only (localStorage), so each admin's phone keeps its own count.
const SLOT = "cave.assistant.greetedSlot"
const SEEN = "cave.assistant.seen"
const LAST = "cave.assistant.lastGreeting"

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      // ignore
    }
  },
}

export interface Greeting {
  /** Shown on screen ("Rahul & Priyesh"). */
  text: string
  /** Said aloud ("Rahul and Priyesh"). */
  speech: string
}

type Line = [id: string, build: (names: string) => string]

/**
 * The greeting for opening the assistant.
 *
 * "Good morning / afternoon / evening" is said only the first time the assistant is opened in each part of the
 * day on this device (so Rahul's phone and Priyesh's phone each say it once). Later openings in the same part
 * of the day get a short, friendly line without it. The wording changes every time and never repeats the line
 * just before; the very first time ever on a device also introduces Baron.
 */
export function buildGreeting(now: Date = new Date(), rng: () => number = Math.random): Greeting {
  const written = OWNERS.join(" & ")
  const spoken = OWNERS.join(" and ")
  const part = greeting(now) // "Good evening"
  const tod = timeOfDay(now)
  const hour = now.getHours()

  const slot = `${dayKeyOf(now)}-${tod}`
  const firstInSlot = store.get(SLOT) !== slot
  const firstEver = store.get(SEEN) === null
  store.set(SLOT, slot)
  store.set(SEEN, "1")

  // Lines that say good morning / afternoon / evening (or the time of day in another way).
  const withTime: Line[] = [
    ["w1", (n) => `${part}, ${n}!`],
    ["w2", (n) => `${part}, ${n}! What shall we look at?`],
    ["w3", (n) => `${part}, ${n}. Your numbers are behaving, I think. Shall we check?`],
    ["w4", (n) => `${part}, ${n}! Numbers or insights?`],
    ...(hour >= 22 || hour < 5
      ? ([["t1", (n) => `${part}, ${n}. Burning the midnight oil? Let's be quick.`]] as Line[])
      : tod === "morning"
        ? ([["t2", (n) => `${part}, ${n}! Chai first, then numbers?`]] as Line[])
        : tod === "afternoon"
          ? ([["t3", (n) => `${part}, ${n}! Let's see how the day is going.`]] as Line[])
          : ([["t4", (n) => `${part}, ${n}! Let's see how the day went.`]] as Line[])),
  ]
  const intro: Line = ["i1", (n) => `${part}, ${n}! I'm Baron, your CAVE business assistant. What shall we check?`]

  // Later in the same part of the day: no "good morning" again.
  const shortPlain: Line[] = [
    ["p1", (n) => `Hey ${n}! What shall we check?`],
    ["p2", (n) => `Ah, ${n}. Right on time.`],
    ["p3", (n) => `${n}! Numbers or insights?`],
    ["p4", (n) => `Welcome back, ${n}.`],
    ["p5", (n) => `Hello ${n}. Ready when you are.`],
    ["p6", (n) => `Back again, ${n}? I like the dedication.`],
  ]
  const mediumPlain: Line[] = [
    ["q1", (n) => `${n}, good to see you! Reports, insights, or Excel?`],
    ["q2", (n) => `Hello ${n}! The business is waiting to be analysed. Where do we start?`],
  ]

  let pool: Line[]
  if (firstInSlot) pool = firstEver ? [intro] : withTime
  else pool = rng() < 0.7 ? shortPlain : mediumPlain

  const last = store.get(LAST)
  const options = pool.filter(([id]) => id !== last)
  const [id, make] = options[Math.min(options.length - 1, Math.floor(rng() * options.length))] ?? pool[0]
  store.set(LAST, id)
  return { text: make(written), speech: make(spoken) }
}
