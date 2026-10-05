/** Session-long store behind useAsyncData (kept separate so auth code can clear it without import cycles). */
export const asyncCache = new Map<string, unknown>()

/** Forget everything (called on sign-in / sign-out so one user never sees another's data). */
export const clearAsyncCache = () => asyncCache.clear()
