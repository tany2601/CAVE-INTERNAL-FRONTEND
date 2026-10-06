import { API_BASE_URL } from "../../config/env"
import { friendlyMessage } from "../errors"

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

let authToken: string | null = null
let unauthorizedHandler: (() => void) | null = null

export const setAuthToken = (token: string | null) => {
  authToken = token
}

/** Called when an authenticated request is rejected with 401 (expired/invalid token). */
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler
}

interface RequestOptions {
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  /** false for login endpoints, where a 401 means "wrong PIN", not "session expired". */
  auth?: boolean
}

const extractMessage = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === "object" && "message" in payload) {
    const m = (payload as { message: unknown }).message
    if (Array.isArray(m)) return m.join(" ")
    if (typeof m === "string") return m
  }
  return fallback
}

export async function request<T>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  { body, query, auth = true }: RequestOptions = {},
): Promise<T> {
  const qs = query
    ? Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
        )
        .join("&")
    : ""

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}${qs ? `?${qs}` : ""}`, {
      method,
      headers: {
        ...(body !== undefined && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(auth && authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, friendlyMessage(0))
  }

  const text = await res.text()
  let payload: unknown = undefined
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth && unauthorizedHandler) unauthorizedHandler()
    throw new ApiError(res.status, friendlyMessage(res.status, extractMessage(payload, "")))
  }
  return payload as T
}
