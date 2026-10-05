import { useState } from "react"
import { Stylist } from "../../types"
import { ScreenBackdrop, BACKDROPS } from "../../components/ui"
import { useBranchData } from "../../context/BranchDataContext"
import { Check } from "lucide-react"

interface Props {
  onSelect: (stylist: Stylist) => void
  onBack: () => void
  busy?: boolean
  error?: string | null
}

// Cinematic barber photos from Unsplash
const STYLIST_PHOTOS: string[] = [
  "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=400&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=400&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=400&fit=crop&auto=format&q=80",
]

export default function StylistSelection({
  onSelect,
  onBack,
  busy,
  error,
}: Props) {
  const { stylists } = useBranchData()
  const [selected, setSelected] = useState<string | null>(null)
  const available = stylists.filter((s) => s.available)
  const unavailable = stylists.filter((s) => !s.available)

  return (
    <div className="relative isolate flex flex-col h-full bg-[var(--bg)] animate-slide-up">
      <ScreenBackdrop src={BACKDROPS.stylists} />
      {/* Header */}
      <div className="px-5 pt-page pb-5 border-b border-[var(--border-subtle)] flex-shrink-0">
        <button
          className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-4 tap-target"
          onClick={onBack}
        >
          ← Back
        </button>
        <h1
          className="font-display font-800 leading-none text-[var(--text)]"
          style={{ fontSize: "36px", letterSpacing: "-0.01em" }}
        >
          Who's looking
          <br />
          after you?
        </h1>
        <p className="text-[12px] text-[var(--text-subtle)] mt-2 tracking-wide">
          Select your stylist to begin
        </p>
      </div>

      {/* Stylist grid */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* Available */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {available.map((stylist) => {
            const isSelected = selected === stylist.id
            const photo = STYLIST_PHOTOS[stylists.indexOf(stylist) % STYLIST_PHOTOS.length]
            return (
              <button
                key={stylist.id}
                className={`relative flex flex-col overflow-hidden tap-target card-press transition-all text-left ${
                  isSelected ? "ring-1 ring-[var(--text)]" : ""
                }`}
                style={{ borderRadius: "4px", height: "200px" }}
                onClick={() => setSelected(isSelected ? null : stylist.id)}
              >
                {/* Photo */}
                <div className="absolute inset-0 bg-[var(--elevated)]">
                  {photo && (
                    <img
                      src={photo}
                      alt={stylist.name}
                      className="w-full h-full object-cover"
                      style={{ opacity: isSelected ? 0.55 : 0.75 }}
                    />
                  )}
                </div>

                {/* Overlay gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(9,9,9,0.95) 0%, rgba(9,9,9,0.3) 55%, rgba(9,9,9,0.05) 100%)",
                  }}
                />

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-[var(--text)] rounded-full flex items-center justify-center animate-fade-in">
                    <Check
                      size={12}
                      className="text-[var(--bg)]"
                      strokeWidth={2.5}
                    />
                  </div>
                )}

                {/* Status pill */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[rgba(9,9,9,0.6)] px-2 py-1 rounded-full">
                  <div
                    className="dot-active"
                    style={{ width: "5px", height: "5px" }}
                  />
                  <span className="text-[9px] text-[rgba(245,245,245,0.7)] tracking-wider uppercase">
                    Active
                  </span>
                </div>

                {/* Name block */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="font-display font-800 tracking-[0.12em] uppercase text-lg text-[var(--text)] leading-none">
                    {stylist.name}
                  </div>
                  <div className="text-[10px] text-[rgba(245,245,245,0.5)] mt-1 tracking-wide">
                    {stylist.specialty}
                  </div>
                  <div className="text-[9px] text-[rgba(245,245,245,0.35)] mt-0.5">
                    {stylist.activeSessions} active session
                    {stylist.activeSessions !== 1 ? "s" : ""}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Unavailable */}
        {unavailable.length > 0 && (
          <>
            <div className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-faint)] mb-3">
              Unavailable
            </div>
            <div className="flex flex-col gap-2">
              {unavailable.map((stylist) => (
                <div
                  key={stylist.id}
                  className="flex items-center gap-3 px-4 py-3 bg-[var(--surface-soft)] border border-[var(--border-subtle)] rounded-sm opacity-40"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--elevated)] border border-[var(--border)] flex items-center justify-center text-[10px] font-display font-700 text-[var(--text-muted)] flex-shrink-0">
                    {stylist.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-700 tracking-wide uppercase text-sm text-[var(--text-muted)]">
                      {stylist.name}
                    </div>
                    <div className="text-[10px] text-[var(--text-faint)]">
                      {stylist.specialty}
                    </div>
                  </div>
                  <div className="text-[9px] text-[var(--text-faint)] tracking-wider uppercase">
                    Away
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 py-4 border-t border-[var(--border-subtle)] flex-shrink-0 bg-[var(--bg)]">
        {error && (
          <div className="text-xs text-[#E06060] tracking-wide mb-3 text-center animate-fade-in">
            {error}
          </div>
        )}
        <button
          disabled={busy}
          className={`w-full h-14 font-display font-700 tracking-[0.2em] uppercase text-sm flex items-center justify-center gap-3 transition-all tap-target ${
            selected && !busy
              ? "bg-[var(--text)] text-[var(--bg)] active:bg-[var(--text-secondary)]"
              : "bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-faint)] pointer-events-none"
          }`}
          style={{ borderRadius: "2px" }}
          onClick={() => {
            const s = stylists.find((x) => x.id === selected)
            if (s) onSelect(s)
          }}
        >
          {busy ? (
            "Starting…"
          ) : selected ? (
            <>
              Start Session
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </>
          ) : (
            "Select a Stylist"
          )}
        </button>
      </div>
    </div>
  )
}
