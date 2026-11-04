/**
 * Every service gets its own colour so staff learn "blue is the haircut, red is the facial" and can tap without
 * reading. The colour comes from the service's name, so it is the same on every phone and every day; two services
 * that would land on the same colour are moved to the next free one (in alphabetical order, so it is steady).
 * All are dark enough for white lettering.
 */
export const SERVICE_PALETTE = [
  "#2563EB", // blue
  "#DC2626", // red
  "#15803D", // green
  "#C2410C", // orange
  "#7C3AED", // violet
  "#BE185D", // pink
  "#0E7490", // teal
  "#A16207", // gold
  "#4338CA", // indigo
  "#0F766E", // sea green
  "#B91C1C", // crimson
  "#0369A1", // sky
  "#A21CAF", // magenta
  "#4D7C0F", // lime
  "#9A3412", // rust
  "#475569", // slate
] as const

const hash = (text: string): number => {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** service name -> colour, for the whole menu. */
export function assignServiceColors(names: string[]): Map<string, string> {
  const out = new Map<string, string>()
  const taken = new Set<number>()
  const n = SERVICE_PALETTE.length
  for (const name of [...names].sort((a, b) => a.localeCompare(b))) {
    let i = hash(name.trim().toLowerCase()) % n
    if (taken.size < n) while (taken.has(i)) i = (i + 1) % n
    taken.add(i)
    out.set(name, SERVICE_PALETTE[i])
  }
  return out
}
