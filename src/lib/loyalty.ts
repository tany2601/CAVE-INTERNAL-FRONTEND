/** "Haircut", "Haircut + Hair Wash & Style"; combo packages ("The Basic (Haircut + …)") are not a haircut. */
export const isHaircutName = (name: string) => /^hair\s*cut\b/i.test(name.trim())

/**
 * Which line is the free haircut on a customer's free (6th) visit: the cheapest haircut, the first one
 * when prices tie, or -1. Same rule as the server, so the bill on screen is the bill that gets saved.
 */
export function freeHaircutIndex(lines: { name: string; price: number }[]): number {
  let best = -1
  lines.forEach((line, index) => {
    if (isHaircutName(line.name) && (best === -1 || line.price < lines[best].price)) best = index
  })
  return best
}
