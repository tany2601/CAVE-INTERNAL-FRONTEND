import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  loginAdmin,
  loginBranch,
  refreshSession,
  setAuthToken,
  setUnauthorizedHandler,
} from "../lib/api"
import { clearAsyncCache } from "../lib/asyncCache"
import type { ApiRole } from "../types/api"

interface AuthState {
  token: string
  role: ApiRole
  branch?: { id: string; name: string; code: string }
}

interface AuthContextValue {
  auth: AuthState | null
  /** Resolves with the role the PIN belongs to. */
  signInBranch: (pin: string) => Promise<ApiRole>
  signInAdmin: (pin: string) => Promise<void>
  signOut: () => void
}

const STORAGE_KEY = "cave-auth"
const SCREEN_KEY = "cave-screen"
const ADMIN_SECTION_KEY = "cave-admin-section"
/** Renew once less than this much of the 24 h token lifetime is left. */
const RENEW_BELOW_MS = 12 * 60 * 60 * 1000
const CHECK_EVERY_MS = 15 * 60 * 1000

const AuthContext = createContext<AuthContextValue | null>(null)

/** Expiry (ms since epoch) from the JWT payload, or 0 if it can't be read. */
const expiryOf = (token: string): number => {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    )
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0
  } catch {
    return 0
  }
}

const readStored = (): AuthState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthState
    if (!parsed?.token || !parsed.role || expiryOf(parsed.token) <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const store = (state: AuthState | null) => {
  try {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    else {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(SCREEN_KEY)
      localStorage.removeItem(ADMIN_SECTION_KEY)
    }
  } catch {
    // Storage unavailable (private mode): the session just won't survive a reload.
  }
}

/**
 * Keeps the signed-in session across reloads (localStorage) and renews the token in the
 * background, so the user stays signed in until they press Log out.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const stored = readStored()
    setAuthToken(stored?.token ?? null) // before any child fires a request
    return stored
  })

  const signOut = useCallback(() => {
    setAuthToken(null)
    clearAsyncCache()
    store(null)
    setAuth(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(signOut)
    return () => setUnauthorizedHandler(null)
  }, [signOut])

  const begin = useCallback((state: AuthState) => {
    clearAsyncCache()
    setAuthToken(state.token)
    store(state)
    setAuth(state)
  }, [])

  // Sliding renewal: while the app is open the token never reaches its expiry.
  const token = auth?.token
  useEffect(() => {
    if (!token) return
    const renew = async () => {
      if (expiryOf(token) - Date.now() > RENEW_BELOW_MS) return
      try {
        const { accessToken } = await refreshSession()
        setAuth((current) => {
          if (!current) return current
          const next = { ...current, token: accessToken }
          setAuthToken(accessToken)
          store(next)
          return next
        })
      } catch {
        // Network blips are retried on the next tick; a 401 signs out via the handler.
      }
    }
    void renew()
    const id = window.setInterval(() => void renew(), CHECK_EVERY_MS)
    return () => window.clearInterval(id)
  }, [token])

  const signInBranch = useCallback(
    async (pin: string) => {
      const res = await loginBranch(pin)
      begin({ token: res.accessToken, role: res.role, branch: res.branch })
      return res.role
    },
    [begin],
  )

  const signInAdmin = useCallback(
    async (pin: string) => {
      const res = await loginAdmin(pin)
      begin({ token: res.accessToken, role: "ADMIN" })
    },
    [begin],
  )

  const value = useMemo(
    () => ({ auth, signInBranch, signInAdmin, signOut }),
    [auth, signInBranch, signInAdmin, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}

export const storageKeys = { screen: SCREEN_KEY, adminSection: ADMIN_SECTION_KEY }
