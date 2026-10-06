/**
 * Plain-language messages for failed requests. Nothing technical (status codes, stack text,
 * database errors) ever reaches the screen.
 */
export const MESSAGES = {
  offline: "You're offline. Check your internet connection and try again.",
  unreachable: "We can't connect right now. Please check your internet connection and try again.",
  unavailable: "Our service is temporarily unavailable. Please try again in a few minutes.",
  server: "Something went wrong on our end. Please try again in a moment.",
  tooMany: "Too many attempts. Please wait a moment and try again.",
  expired: "Your session has expired. Please sign in again.",
  forbidden: "You don't have permission to do that.",
  notFound: "We couldn't find what you were looking for. It may have been removed.",
  invalid: "That didn't go through. Please check the details and try again.",
}

/** Text that is clearly meant for developers rather than people. */
const TECHNICAL =
  /prisma|invocation|stack|undefined|\bnull\b|ECONN|ETIMEDOUT|SQL|constraint|relation|Unexpected|JSON|\bat \S+\(|Cannot (GET|POST|PUT|PATCH|DELETE)|Request failed|status code|Internal server|Bad Gateway|<html|\[object/i

/** What to show for a failed request: status 0 means the request never reached the server. */
export function friendlyMessage(status: number, serverMessage?: string): string {
  if (status === 0) {
    return typeof navigator !== "undefined" && navigator.onLine === false
      ? MESSAGES.offline
      : MESSAGES.unreachable
  }
  if (status === 401) return MESSAGES.expired
  if (status === 403) return MESSAGES.forbidden
  if (status === 404) return MESSAGES.notFound
  if (status === 429) return MESSAGES.tooMany
  if (status === 502 || status === 503 || status === 504 || status === 408) return MESSAGES.unavailable
  if (status >= 500) return MESSAGES.server
  // Other 4xx: the server's own sentence is usually exactly what the person needs ("Name already exists").
  const text = serverMessage?.trim()
  if (text && text.length <= 200 && !TECHNICAL.test(text)) return text
  return MESSAGES.invalid
}

/** Short heading to go with a message in an error panel. */
export function errorTitle(message: string): string {
  if (message === MESSAGES.offline || message === MESSAGES.unreachable) return "No connection"
  if (message === MESSAGES.unavailable || message === MESSAGES.server) return "We hit a snag"
  if (message === MESSAGES.expired) return "Session expired"
  return "Couldn't load this"
}
