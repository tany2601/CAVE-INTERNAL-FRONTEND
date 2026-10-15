/**
 * Services are always listed Hair, Beard, Skin, Combo, then anything else. A service's category is the one saved
 * with it, or (for older services added without one) a guess from its name. Same rule as the server.
 */
export const CATEGORY_ORDER = ["Hair", "Beard", "Skin", "Combo"]

export function inferCategory(name: string): string | null {
  const n = name.toLowerCase()
  if (/\(|combo|package|\bthe \w+/.test(n)) return "Combo"
  if (/beard|moustache|mustache|shave/.test(n)) return "Beard"
  if (/facial|clean-?up|de-?tan|skin|bleach|wax|scrub|face/.test(n)) return "Skin"
  if (/hair|head|colour|color|spa|massage|straighten|smooth|perm|styl/.test(n)) return "Hair"
  return null
}

/** Hair / Beard / Skin / Combo (any capitalisation), the custom name it has, or "Other". */
export function categoryOf(name: string, category: string | null | undefined): string {
  const c = (category ?? "").trim() || inferCategory(name) || ""
  return CATEGORY_ORDER.find((x) => x.toLowerCase() === c.toLowerCase()) ?? (c || "Other")
}

const rank = (category: string) => {
  const i = CATEGORY_ORDER.indexOf(category)
  return i >= 0 ? i : CATEGORY_ORDER.length + (category === "Other" ? 1 : 0)
}

/** Puts services in menu order. Services in the same category keep the order they came in. */
export function sortByCategory<T extends { name: string; category: string | null }>(rows: T[]): T[] {
  return rows
    .map((row, i) => ({ row, i, r: rank(categoryOf(row.name, row.category)) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.row)
}
