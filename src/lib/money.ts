/** Rounds to paise. Use after adding or subtracting amounts so float noise (0.1 + 0.2) never shows up. */
export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100

/** Sum of money values, rounded to paise. */
export const sumMoney = (values: number[]): number => round2(values.reduce((a, v) => a + v, 0))
