import { round2 } from "./money"

export type DiscountMode = "percent" | "amount"

/** A typed discount value ("", "12.5") as a number; anything unreadable is 0. */
export const parseValue = (text: string): number => {
  const n = Number(text)
  return Number.isFinite(n) && n > 0 ? round2(n) : 0
}

/**
 * The rupees a discount takes off `base` (the services total, or the products total): a percentage (at most 100)
 * or an amount, never more than `base`. Same rule as the server, to the paisa.
 */
export function discountOn(mode: DiscountMode, value: number, base: number): number {
  if (!(base > 0) || !(value > 0)) return 0
  const raw = mode === "percent" ? (base * Math.min(value, 100)) / 100 : value
  return Math.min(round2(base), round2(raw))
}

/** Lines with the same name and price become one with a quantity ("Haircut ×3"); a free line stays apart. */
export function groupLines<T extends { name: string; price: number }>(
  lines: T[],
): { name: string; price: number; qty: number; total: number }[] {
  const out: { name: string; price: number; qty: number; total: number }[] = []
  for (const l of lines) {
    const found = out.find((o) => o.name === l.name && o.price === l.price)
    if (found) {
      found.qty += 1
      found.total = round2(found.total + l.price)
    } else out.push({ name: l.name, price: l.price, qty: 1, total: l.price })
  }
  return out
}

export const withQty = (name: string, qty: number) => (qty > 1 ? `${name} ×${qty}` : name)
