/** One phone rule for the whole app: a 10-digit Indian mobile number starting with 6-9. */
export const PHONE_LENGTH = 10

const MOBILE = /^[6-9]\d{9}$/

/**
 * Keeps only digits, drops a pasted +91 / 91 / 0 prefix and caps the length, so whatever
 * is typed or pasted ends up as at most 10 digits.
 */
export function sanitizePhone(value: string): string {
  let digits = value.replace(/\D/g, "")
  if (digits.length > PHONE_LENGTH && digits.startsWith("91")) digits = digits.slice(2)
  else if (digits.length > PHONE_LENGTH && digits.startsWith("0")) digits = digits.slice(1)
  return digits.slice(0, PHONE_LENGTH)
}

export const isValidPhone = (value: string): boolean => MOBILE.test(value)

/** Inline message for a partly typed number; null when it's valid (or still empty). */
export function phoneError(value: string): string | null {
  if (value.length === 0) return null
  if (!/^[6-9]/.test(value)) return "Mobile numbers start with 6, 7, 8 or 9."
  if (value.length < PHONE_LENGTH) return `Enter all 10 digits (${value.length}/10).`
  return null
}
