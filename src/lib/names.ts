/** People's names: letters (any language), spaces, and . ' - only. No digits or symbols. */

/** Strips anything that can't be in a name as it's typed or pasted. */
export function sanitizePersonName(value: string): string {
  return value
    .replace(/[^\p{L}\p{M}\s.'’-]/gu, "")
    .replace(/^\s+/, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 100)
}

/** True when the name has at least `min` letters and starts with a letter. */
export function isValidPersonName(value: string, min = 3): boolean {
  const name = value.trim()
  return /^\p{L}/u.test(name) && (name.match(/\p{L}/gu)?.length ?? 0) >= min
}
