import { useState, useCallback, useEffect, lazy, Suspense } from "react"
import { Screen, Stylist, Customer, Session } from "../types"
import { staffApi } from "../lib/api"
import { mapSession, toApiMode } from "../lib/mappers"
import { storageKeys, useAuth } from "../context/AuthContext"
import { useBranchData } from "../context/BranchDataContext"
import { Button } from "../components/ui"
import type { CloseSessionPayload } from "../types/api"

// Auth
import RoleSelection from "../screens/auth/RoleSelection"
import PINEntry from "../screens/auth/PINEntry"

// Customer
import Welcome from "../screens/customer/Welcome"
import CustomerName from "../screens/customer/CustomerName"
import CustomerPhone from "../screens/customer/CustomerPhone"
import Loyalty from "../screens/customer/Loyalty"
import StylistSelection from "../screens/customer/StylistSelection"
import ServiceSelection from "../screens/customer/ServiceSelection"

// Stylist
import StylistHome from "../screens/stylist/StylistHome"
import CloseSession from "../screens/stylist/CloseSession"
import SessionSuccess from "../screens/stylist/SessionSuccess"
import Performance from "../screens/stylist/Performance"
import Checklist from "../screens/stylist/Checklist"
import StylistMenu from "../screens/stylist/StylistMenu"

// Manager
import MorningOpening from "../screens/manager/MorningOpening"
import ManagerHome from "../screens/manager/ManagerHome"
import Sessions from "../screens/manager/Sessions"
import Commission from "../screens/manager/Commission"
import Cash from "../screens/manager/Cash"
import Expenses from "../screens/manager/Expenses"
import ManagerMenu from "../screens/manager/ManagerMenu"

const AdminDashboard = lazy(
  () => import("../screens/admin/AdminDashboardEntry"),
)

type AppScreen =
  | Screen
  | "stylist-pin-entry"
  | "manager-pin-entry"
  | "session-ready"
  | "admin-dashboard"
  | "manager-entry"
  | "customer-services"
  | "edit-session"

interface SuccessData {
  total: number
  paymentMode: "cash" | "gpay"
}

const PRE_LOGIN_SCREENS: AppScreen[] = [
  "role-selection",
  "stylist-pin-entry",
  "manager-pin-entry",
]

type CloseData = Parameters<
  React.ComponentProps<typeof CloseSession>["onComplete"]
>[0]

/** Maps the bill the user built on screen to the backend's close/edit payload. */
const buildBillPayload = (
  data: CloseData,
  menuIds: Set<string>,
): CloseSessionPayload => {
  const payload: CloseSessionPayload = {
    // Menu items bill from branch pricing; anything else is a custom service.
    services: data.services
      .filter((s) => menuIds.has(s.id))
      .map((s) => ({ servicePricingId: s.id })),
    customServices: data.services
      .filter((s) => !menuIds.has(s.id))
      .map((s) => ({ name: s.name, price: s.price })),
    // The backend bills products per line, so expand quantities.
    productSales: data.products.flatMap((p) =>
      Array.from({ length: p.qty }, () => ({
        productName: p.name,
        price: p.price,
        paymentMode: toApiMode(data.paymentMode),
      })),
    ),
    tipAmount: data.tip,
    paymentMode: toApiMode(data.paymentMode),
  }
  if (data.discountValue > 0) {
    payload.discountType = data.discountType === "percent" ? "PERCENTAGE" : "FIXED"
    payload.discountValue =
      data.discountType === "percent"
        ? Math.min(data.discountValue, 100)
        : data.discount
  }
  return payload
}

/** Screens that make sense to come back to after a reload (the rest need in-flight state). */
const RESTORABLE: AppScreen[] = [
  "welcome",
  "stylist-home",
  "stylist-performance",
  "stylist-checklist",
  "stylist-menu",
  "manager-home",
  "manager-sessions",
  "commission",
  "cash",
  "expenses",
  "manager-menu",
  "admin-dashboard",
]

const SHOWS_BEFORE_DATA: AppScreen[] = ["welcome", "customer-name", "customer-phone"]

const initialScreen = (role: string | undefined): AppScreen => {
  if (!role) return "role-selection"
  if (role === "ADMIN") return "admin-dashboard"
  let saved: string | null = null
  try {
    saved = sessionStorage.getItem(storageKeys.screen)
  } catch {
    // ignore
  }
  const manager = role === "MANAGER"
  if (saved && RESTORABLE.includes(saved as AppScreen)) {
    const managerScreen = !saved.startsWith("stylist") && saved !== "welcome"
    // A saved screen from the other role (e.g. after signing in as someone else) is stale.
    if (saved === "welcome" || managerScreen === manager) return saved as AppScreen
  }
  // Managers re-enter through the opening-balance check, stylists land on the start screen.
  return manager ? "manager-entry" : "welcome"
}

export default function AppRouter() {
  const { auth, signOut } = useAuth()
  const { ready, error: dataError, refresh, stylists, day, services, addActiveSession } =
    useBranchData()

  const [screen, setScreen] = useState<AppScreen>(() => initialScreen(auth?.role))
  const [role, setRole] = useState<"stylist" | "manager">(
    auth?.role === "MANAGER" ? "manager" : "stylist",
  )
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState<string | undefined>()
  const [pickedServices, setPickedServices] = useState<string[]>([])
  const [closingSession, setClosingSession] = useState<Session | null>(null)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [sessionSuccess, setSessionSuccess] = useState<SuccessData | null>(null)
  const [startingSession, setStartingSession] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const openingBalanceDone = !!day?.openingSet
  const openingCash = day?.openingCash ?? 0
  const openingGpay = day?.openingGpay ?? 0
  const [stylistNavTab, setStylistNavTab] = useState(() => {
    const s = initialScreen(auth?.role)
    return s.startsWith("stylist-") && s !== "stylist-home" ? s : "home"
  })
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    localStorage.getItem("cave-theme") === "light" ? "light" : "dark",
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem("cave-theme", theme)
    // Status bar / browser chrome colour of the installed app follows the theme.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#090909" : "#f7f7f5")
  }, [theme])

  // The admin area uses the full screen; every other screen sits in the phone-width frame.
  useEffect(() => {
    document.body.dataset.shell = screen === "admin-dashboard" ? "admin" : "app"
  }, [screen])

  const toggleTheme = () =>
    setTheme((current) => (current === "dark" ? "light" : "dark"))

  const nav = useCallback((s: AppScreen) => setScreen(s), [])

  // Remember where the user was so a reload (or the tablet waking up) returns here.
  useEffect(() => {
    if (!auth || !RESTORABLE.includes(screen)) return
    try {
      sessionStorage.setItem(storageKeys.screen, screen)
    } catch {
      // ignore
    }
  }, [auth, screen])

  // After a manager signs in, wait for today's data, then ask for the opening
  // balance only if it has not been recorded yet.
  useEffect(() => {
    if (screen === "manager-entry" && ready) {
      setScreen(day?.openingSet || day?.closed ? "welcome" : "morning-opening")
    }
  }, [screen, ready, day])

  // Session expired (401) or signed out elsewhere: fall back to the role picker.
  useEffect(() => {
    if (!auth && !PRE_LOGIN_SCREENS.includes(screen)) setScreen("role-selection")
  }, [auth, screen])

  const logout = () => {
    signOut()
    nav("role-selection")
  }

  // The branch PIN identifies the branch role, not a person, so the "logged in"
  // stylist is just a label; individual stylists are picked per customer.
  const loggedInStylist: Stylist = stylists[0] ?? {
    id: "",
    name: role === "manager" ? "Manager" : "Stylist",
    specialty: "",
    available: true,
    activeSessions: 0,
    completedToday: 0,
    revenueToday: 0,
    commission: 0,
    tips: 0,
    commissionPaid: false,
  }

  const handleStylistNav = (tab: string) => {
    setStylistNavTab(tab)
    if (tab === "home") nav("stylist-home")
    else if (tab === "stylist-performance") nav("stylist-performance")
    else if (tab === "stylist-checklist") nav("stylist-checklist")
    else if (tab === "stylist-menu") nav("stylist-menu")
  }

  const handleManagerNav = (tab: string) => {
    nav(tab as AppScreen)
  }

  const handleCloseSession = (session: Session) => {
    setClosingSession(session)
    nav("close-session")
  }

  const lookupLoyalty = async (name: string, phone?: string): Promise<Customer> => {
    const blank: Customer = {
      name,
      phone,
      visitCount: 0,
      loyaltyTarget: 6,
      rewardReady: false,
    }
    if (!phone) return blank
    try {
      const res = await staffApi.lookupCustomer(phone.replace(/\s+/g, ""))
      return {
        ...blank,
        visitCount: res.visitCount,
        loyaltyTarget: res.loyaltyTarget,
        rewardReady: res.rewardReady,
      }
    } catch {
      // Loyalty is a nicety; never block a customer from starting a session.
      return blank
    }
  }

  const startSession = async (stylist: Stylist) => {
    setStartingSession(true)
    setStartError(null)
    try {
      // One request creates the session and starts its timer. We then move on straight away:
      // the new session is shown locally and the dashboards catch up in the background.
      const created = await staffApi.createSession({
        customerName,
        customerMobile: customerPhone?.replace(/\s+/g, ""),
        stylistId: stylist.id,
        serviceIds: pickedServices.length ? pickedServices : undefined,
        startNow: true,
      })
      addActiveSession(mapSession(created))
      void refresh()
      setStylistNavTab("home")
      nav("welcome")
    } catch (e) {
      setStartError(
        e instanceof Error ? e.message : "Could not start the session.",
      )
    } finally {
      setStartingSession(false)
    }
  }

  // ── Pre-login ──────────────────────────────────────────────────────
  if (screen === "role-selection") {
    return (
      <RoleSelection
        onSelect={(r) => {
          setRole(r)
          nav(r === "stylist" ? "stylist-pin-entry" : "manager-pin-entry")
        }}
      />
    )
  }

  if (screen === "stylist-pin-entry") {
    return (
      <PINEntry
        role="stylist"
        onSuccess={() => nav("welcome")}
        onBack={() => nav("role-selection")}
      />
    )
  }

  if (screen === "manager-pin-entry") {
    return (
      <PINEntry
        role="manager"
        onAdminSuccess={() => nav("admin-dashboard")}
        onSuccess={() => nav("manager-entry")}
        onBack={() => nav("role-selection")}
      />
    )
  }

  if (screen === "admin-dashboard") {
    return (
      <Suspense
        fallback={
          <div className="h-full bg-[var(--bg)] flex items-center justify-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)]">
              Loading admin workspace
            </div>
          </div>
        }
      >
        <AdminDashboard onLogout={logout} />
      </Suspense>
    )
  }

  // ── Branch data gate ───────────────────────────────────────────────
  // The landing and check-in screens need no branch data to draw, so they open instantly after
  // sign-in while the data loads behind them. Everything else waits for it.
  if (!ready && !SHOWS_BEFORE_DATA.includes(screen)) {
    return (
      <div className="flex flex-col h-full bg-[var(--bg)] items-center justify-center">
        <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)]">
          Loading branch data
        </div>
      </div>
    )
  }

  if (ready && dataError && stylists.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[var(--bg)] items-center justify-center gap-5 px-8 text-center">
        <div className="text-sm text-[#E06060]">{dataError}</div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => void refresh()}>
            Retry
          </Button>
          <Button variant="secondary" onClick={logout}>
            Log out
          </Button>
        </div>
      </div>
    )
  }

  if (screen === "morning-opening") {
    return (
      <MorningOpening
        onSave={async (cash, gpay) => {
          await staffApi.setOpeningBalance(cash, gpay)
          await refresh()
          nav("welcome")
        }}
        onSkip={() => nav("welcome")}
      />
    )
  }

  if (screen === "welcome") {
    return (
      <WelcomeScreen
        role={role}
        onStart={() => {
          setPickedServices([])
          nav("customer-name")
        }}
        onMenu={() =>
          role === "manager"
            ? handleManagerNav("manager-home")
            : handleStylistNav("home")
        }
        onQuickBill={handleCloseSession}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
    )
  }

  if (screen === "customer-name") {
    return (
      <CustomerName
        onContinue={(name) => {
          setCustomerName(name)
          nav("customer-phone")
        }}
        onBack={() => nav("welcome")}
      />
    )
  }

  if (screen === "customer-phone") {
    return (
      <CustomerPhone
        customerName={customerName}
        onContinue={async (phone) => {
          setCustomerPhone(phone)
          setStartError(null)
          setCurrentCustomer(await lookupLoyalty(customerName, phone))
          nav("customer-services")
        }}
        onBack={() => nav("customer-name")}
      />
    )
  }

  if (screen === "customer-services") {
    return (
      <ServiceSelection
        selected={pickedServices}
        onChange={setPickedServices}
        onContinue={() => nav("loyalty")}
        onSkip={() => {
          setPickedServices([])
          nav("loyalty")
        }}
        onBack={() => nav("customer-phone")}
      />
    )
  }

  if (screen === "loyalty" && currentCustomer) {
    return (
      <Loyalty
        customer={currentCustomer}
        onContinue={() => nav("stylist-selection")}
        onSkip={() => nav("stylist-selection")}
        onCancel={() => {
          // Nothing has been saved yet (the session starts at stylist selection), so just reset.
          setCustomerName("")
          setCustomerPhone(undefined)
          setCurrentCustomer(null)
          setPickedServices([])
          nav("welcome")
        }}
      />
    )
  }

  if (screen === "stylist-selection") {
    return (
      <StylistSelection
        busy={startingSession}
        error={startError}
        onSelect={(stylist) => void startSession(stylist)}
        onBack={() => nav("loyalty")}
      />
    )
  }

  if (screen === "edit-session" && editingSession) {
    return (
      <CloseSession
        session={editingSession}
        onComplete={async (data) => {
          await staffApi.editSession(
            editingSession.id,
            buildBillPayload(data, new Set(services.map((s) => s.id))),
          )
          await refresh()
          setEditingSession(null)
          nav("manager-sessions")
        }}
        onCancel={() => {
          setEditingSession(null)
          nav("manager-sessions")
        }}
      />
    )
  }

  if (screen === "close-session" && closingSession) {
    return (
      <CloseSession
        session={closingSession}
        onComplete={async (data) => {
          const payload = buildBillPayload(
            data,
            new Set(services.map((s) => s.id)),
          )
          const closed = await staffApi.closeSession(closingSession.id, payload)
          setSessionSuccess({
            total: closed.totalAmount,
            paymentMode: data.paymentMode,
          })
          setClosingSession(mapSession(closed))
          void refresh()
          nav("session-success" as AppScreen)
        }}
        onCancel={() =>
          nav(role === "manager" ? "manager-sessions" : "stylist-home")
        }
      />
    )
  }

  if (
    screen === ("session-success" as AppScreen) &&
    closingSession &&
    sessionSuccess
  ) {
    return (
      <SessionSuccess
        session={{ ...closingSession, services: closingSession.services || [] }}
        total={sessionSuccess.total}
        paymentMode={sessionSuccess.paymentMode}
        onDone={() => {
          setClosingSession(null)
          setSessionSuccess(null)
          nav(role === "manager" ? "manager-sessions" : "stylist-home")
        }}
      />
    )
  }

  // Stylist screens
  if (screen === "stylist-home") {
    return (
      <StylistHome
        stylist={loggedInStylist}
        onCloseSession={handleCloseSession}
        onStartCustomer={() => nav("welcome")}
        onNav={handleStylistNav}
        navTab={stylistNavTab}
        onLogout={logout}
        onGoBack={() => nav("welcome")}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
    )
  }

  if (screen === "stylist-performance") {
    return (
      <Performance
        stylist={loggedInStylist}
        onNav={handleStylistNav}
        navTab="stylist-performance"
      />
    )
  }

  if (screen === "stylist-checklist") {
    return <Checklist onNav={handleStylistNav} navTab="stylist-checklist" />
  }

  if (screen === "stylist-menu") {
    return (
      <StylistMenu
        stylist={loggedInStylist}
        onNav={handleStylistNav}
        navTab="stylist-menu"
        onLogout={logout}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
    )
  }

  // Manager screens
  if (screen === "manager-home") {
    return (
      <ManagerHome
        onNav={handleManagerNav}
        navTab="manager-home"
        onCloseSession={handleCloseSession}
        openingBalanceDone={openingBalanceDone}
        onAddOpeningBalance={() => nav("morning-opening")}
        onLogout={logout}
        onGoBack={() => nav("welcome")}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
    )
  }

  if (screen === "manager-sessions") {
    return (
      <Sessions
        onNav={handleManagerNav}
        navTab="manager-sessions"
        onCloseSession={handleCloseSession}
        onEditSession={(session) => {
          setEditingSession(session)
          nav("edit-session")
        }}
      />
    )
  }

  if (screen === "commission") {
    return <Commission onNav={handleManagerNav} navTab="commission" />
  }

  if (screen === "cash") {
    return (
      <Cash
        onNav={handleManagerNav}
        navTab="cash"
        openingCash={openingCash}
        openingGpay={openingGpay}
      />
    )
  }

  if (screen === "expenses") {
    return <Expenses onNav={handleManagerNav} navTab="expenses" />
  }

  if (screen === "manager-menu") {
    return (
      <ManagerMenu
        onNav={handleManagerNav}
        navTab="manager-menu"
        onLogout={logout}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
    )
  }

  // Fallback
  return (
    <div className="flex flex-col h-full bg-[var(--bg)] items-center justify-center">
      <div className="text-[var(--text-muted)] text-sm">Loading...</div>
    </div>
  )
}

/** Welcome needs the live active-session list from the branch data context. */
function WelcomeScreen(
  props: Omit<React.ComponentProps<typeof Welcome>, "activeSessions">,
) {
  const { activeSessions } = useBranchData()
  return <Welcome {...props} activeSessions={activeSessions} />
}
