import { useEffect, useState } from "react"
import { Logo } from "../../components/ui"
import { Delete } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { ApiError } from "../../lib/api"

interface Props {
  role: "stylist" | "manager"
  onSuccess: () => void
  onAdminSuccess?: () => void
  onBack: () => void
}

const BRANCH_PIN_LENGTH = 4
const ADMIN_PIN_LENGTH = 6

export default function PINEntry({
  role,
  onSuccess,
  onAdminSuccess,
  onBack,
}: Props) {
  const { signInBranch, signInAdmin, signOut } = useAuth()
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("Incorrect PIN. Try again.")
  const [shake, setShake] = useState(false)
  const [busy, setBusy] = useState(false)
  const [adminMode, setAdminMode] = useState(false)
  const PIN_LENGTH = adminMode ? ADMIN_PIN_LENGTH : BRANCH_PIN_LENGTH

  // Download the admin workspace while the PIN is being typed, so it opens the moment sign-in succeeds.
  useEffect(() => {
    if (adminMode) void import("../admin/AdminDashboardEntry")
  }, [adminMode])

  const fail = (message: string) => {
    setErrorMessage(message)
    setError(true)
    setShake(true)
    setPin("")
    setTimeout(() => setShake(false), 500)
  }

  const submit = async (value: string) => {
    setBusy(true)
    try {
      if (adminMode) {
        await signInAdmin(value)
        onAdminSuccess?.()
        return
      }
      const granted = await signInBranch(value)
      if (granted !== role.toUpperCase()) {
        // PIN is valid but belongs to a different role than the one selected.
        signOut()
        fail("Incorrect PIN. Try again.")
        return
      }
      onSuccess()
    } catch (e) {
      const wrongPin =
        e instanceof ApiError &&
        (e.status === 401 || e.status === 400) &&
        !/too many/i.test(e.message)
      fail(
        wrongPin || !(e instanceof Error)
          ? "Incorrect PIN. Try again."
          : e.message,
      )
    } finally {
      setBusy(false)
    }
  }

  const handleKey = (key: string) => {
    if (busy || pin.length >= PIN_LENGTH) return
    const newPin = pin + key
    setPin(newPin)
    setError(false)
    if (newPin.length === PIN_LENGTH) {
      setTimeout(() => void submit(newPin), 60)
    }
  }

  const toggleAdminMode = () => {
    setAdminMode((current) => !current)
    setPin("")
    setError(false)
  }

  const handleBack = () => {
    setPin((prev) => prev.slice(0, -1))
    setError(false)
  }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"]

  return (
    <div className="relative flex flex-col min-h-full bg-[var(--bg)] animate-fade-in">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(/images/photos/1621605815971-fbc98d665033.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.05,
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Back button */}
        <div className="px-5 pt-page-fluid">
          <button
            className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] tap-target"
            onClick={onBack}
          >
            ← Back
          </button>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-[clamp(1rem,4dvh,2.5rem)] py-3">
          <div className="flex flex-col items-center gap-[clamp(0.75rem,2.5dvh,1.5rem)]">
            <Logo size="md" subtitle={adminMode ? "Admin" : undefined} />
            <div className="flex flex-col items-center gap-1">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)]">
                {role === "stylist"
                  ? "Stylist Access"
                  : adminMode
                    ? "Admin Access"
                    : "Manager Access"}
              </div>
            </div>
            <div className="text-sm font-display font-600 tracking-wider text-[var(--text-secondary)] uppercase">
              Enter your PIN
            </div>
          </div>

          {/* PIN dots */}
          <div
            className={`flex gap-5 ${shake ? "animate-[shake_0.4s_ease]" : ""}`}
            style={shake ? { animation: "shake 0.4s ease" } : {}}
          >
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-150 ${
                  i < pin.length
                    ? error
                      ? "bg-[#E06060] pin-filled"
                      : "bg-[var(--text)] pin-filled"
                    : "border border-[var(--text-faint)]"
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="text-xs text-[#E06060] tracking-wider animate-fade-in">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Keypad */}
        <div className="pb-[clamp(1rem,4dvh,3rem)] px-8">
          <div
            className="grid grid-cols-3 gap-[clamp(0.5rem,1.5dvh,0.75rem)] justify-items-center mx-auto"
            style={{ maxWidth: "280px" }}
          >
            {keys.map((key, i) => {
              if (key === "") return <div key={i} />
              if (key === "⌫") {
                return (
                  <button
                    key={i}
                    className="keypad-key destructive"
                    onClick={handleBack}
                    disabled={pin.length === 0}
                  >
                    <Delete size={20} strokeWidth={1.5} />
                  </button>
                )
              }
              return (
                <button
                  key={i}
                  className="keypad-key"
                  onClick={() => handleKey(key)}
                >
                  {key}
                </button>
              )
            })}
          </div>

          <div className="text-center mt-6">
            <button className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-faint)] tap-target">
              Forgot PIN? Contact manager
            </button>
            {role === "manager" && onAdminSuccess && (
              <div className="mt-3">
                <button
                  className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-faint)] tap-target"
                  onClick={toggleAdminMode}
                >
                  {adminMode ? "Manager login" : "Admin login"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
