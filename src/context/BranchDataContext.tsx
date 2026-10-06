import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { staffApi } from "../lib/api"
import {
  mapExpense,
  mapService,
  mapSession,
  mapStylist,
} from "../lib/mappers"
import { useAuth } from "./AuthContext"
import { MESSAGES } from "../lib/errors"
import type { Expense, Service, Session, Stylist } from "../types"
import type { ApiCheckoutProduct, ApiDay, ApiPayout } from "../types/api"

const POLL_MS = 30_000
const CATALOGUE_TTL_MS = 5 * 60_000

interface BranchData {
  /** True once the first load after sign-in has finished (successfully or not). */
  ready: boolean
  error: string | null
  branchName: string
  /** Branch name without the leading "CAVE", e.g. "Karkala". */
  branchShort: string
  stylists: Stylist[]
  services: Service[]
  /** Retail products offered at checkout. */
  products: ApiCheckoutProduct[]
  activeSessions: Session[]
  closedSessions: Session[]
  expenses: Expense[]
  /** Commission payouts / tip withdrawals recorded today (managers only). */
  payouts: ApiPayout[]
  /** Today's opening / closing balance state. */
  day: ApiDay | null
  getStylist: (id: string) => Stylist | undefined
  refresh: () => Promise<void>
  /** Show a just-created session straight away, before the next refresh confirms it. */
  addActiveSession: (session: Session) => void
}

const BranchDataContext = createContext<BranchData | null>(null)

const EMPTY: Omit<
  BranchData,
  "getStylist" | "refresh" | "addActiveSession" | "ready" | "error" | "branchShort"
> = {
  branchName: "",
  stylists: [],
  services: [],
  products: [],
  activeSessions: [],
  closedSessions: [],
  expenses: [],
  payouts: [],
  day: null,
}

/** Loads and keeps fresh the branch-scoped data the stylist/manager screens render. */
export function BranchDataProvider({ children }: { children: ReactNode }) {
  const { auth } = useAuth()
  const isBranchUser = auth?.role === "STYLIST" || auth?.role === "MANAGER"
  const token = isBranchUser ? auth.token : null

  const [data, setData] = useState(EMPTY)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeToken = useRef<string | null>(null)
  const catalogueAt = useRef(0)

  const refresh = useCallback(async () => {
    const forToken = activeToken.current
    if (!forToken) return
    try {
      // Today's numbers change constantly; the menu and product catalogue rarely do, so they
      // are re-fetched every few minutes rather than on every poll.
      const staleCatalogue = Date.now() - catalogueAt.current > CATALOGUE_TTL_MS
      const [today, catalogue] = await Promise.all([
        staffApi.getToday(),
        staleCatalogue
          ? Promise.all([staffApi.getMenu(), staffApi.getProducts()])
          : Promise.resolve(null),
      ])
      if (activeToken.current !== forToken) return // signed out / switched meanwhile
      if (catalogue) catalogueAt.current = Date.now()
      setData((prev) => ({
        branchName: today.branch.name,
        stylists: today.stylists.map(mapStylist),
        services: catalogue ? catalogue[0].map(mapService) : prev.services,
        products: catalogue ? catalogue[1] : prev.products,
        activeSessions: today.activeSessions.map(mapSession),
        closedSessions: today.closedSessions.map(mapSession),
        expenses: today.expenses.map(mapExpense),
        payouts: today.payouts,
        day: today.day,
      }))
      setError(null)
    } catch (e) {
      if (activeToken.current !== forToken) return
      setError(e instanceof Error ? e.message : MESSAGES.server)
    } finally {
      if (activeToken.current === forToken) setReady(true)
    }
  }, [])

  useEffect(() => {
    activeToken.current = token
    catalogueAt.current = 0
    setReady(false)
    setError(null)
    setData(EMPTY)
    if (!token) return
    void refresh()
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh()
    }, POLL_MS)
    // Coming back to the app (tablet woken, tab re-opened, connection restored) catches up straight away.
    const onWake = () => {
      if (document.visibilityState === "visible") void refresh()
    }
    document.addEventListener("visibilitychange", onWake)
    window.addEventListener("online", onWake)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onWake)
      window.removeEventListener("online", onWake)
    }
  }, [token, refresh])

  const value = useMemo<BranchData>(
    () => ({
      ...data,
      branchShort: data.branchName.replace(/^CAVE\s+/i, ""),
      ready,
      error,
      refresh,
      addActiveSession: (session) =>
        setData((prev) => ({
          ...prev,
          activeSessions: [session, ...prev.activeSessions.filter((s) => s.id !== session.id)],
        })),
      getStylist: (id) => data.stylists.find((s) => s.id === id),
    }),
    [data, ready, error, refresh],
  )

  return (
    <BranchDataContext.Provider value={value}>
      {children}
    </BranchDataContext.Provider>
  )
}

export function useBranchData() {
  const ctx = useContext(BranchDataContext)
  if (!ctx) throw new Error("useBranchData must be used inside <BranchDataProvider>")
  return ctx
}
