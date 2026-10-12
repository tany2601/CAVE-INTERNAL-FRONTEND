import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, Download, Send, Volume2, VolumeX, X } from "lucide-react"
import { adminApi } from "../../../lib/api"
import type { AssistantContext, AssistantReply } from "../../../lib/api/admin"
import { dayKeyOf } from "../../../lib/greeting"
import { buildGreeting } from "./greetings"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { useVoice } from "./voice"

const NAME = "Baron"
const START_CHIPS = ["Today's report", "This week", "This month", "Insights", "Download Excel"]

interface Message {
  id: number
  from: "bot" | "me"
  text: string
  /** What is read aloud, so a message can be replayed. */
  speech?: string
  card?: AssistantReply["card"]
  action?: AssistantReply["action"]
}

const TONE: Record<"good" | "warn" | "info", string> = {
  good: "bg-[#4CAF86]",
  warn: "bg-[#E5A93D]",
  info: "bg-[var(--text-muted)]",
}

const fileSave = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** The small round "B" that stands for Baron. */
function Avatar({ speaking, size = 36 }: { speaking?: boolean; size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={`relative flex shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--text)] font-display text-sm font-800 text-[var(--bg)] ${
        speaking ? "assistant-speaking" : ""
      }`}
    >
      B
    </span>
  )
}

function DownloadButton({ action, label }: { action: NonNullable<Message["action"]>; label: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle")
  return (
    <button
      type="button"
      className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--elevated)] px-4 text-xs font-600 uppercase tracking-wider text-[var(--text)] active:opacity-70 disabled:opacity-60"
      disabled={state === "busy"}
      onClick={async () => {
        setState("busy")
        try {
          const blob = await adminApi.downloadAssistantReport(action.from, action.to, action.branchId)
          fileSave(blob, `CAVE-report-${action.from}${action.from === action.to ? "" : `-to-${action.to}`}.xlsx`)
          setState("done")
        } catch {
          setState("error")
        }
      }}
    >
      <Download size={15} />
      {state === "busy" ? "Preparing…" : state === "done" ? "Downloaded · tap to save again" : state === "error" ? "Couldn't make it · try again" : label}
    </button>
  )
}

function Card({ card }: { card: NonNullable<Message["card"]> }) {
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]">
      <div className="border-b border-[var(--border-subtle)] px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
        {card.title}
      </div>
      {card.stats.length > 0 && (
        <div className="grid grid-cols-3 gap-px bg-[var(--border-subtle)]">
          {card.stats.map((s) => (
            <div key={s.label} className="min-w-0 bg-[var(--surface)] px-2.5 py-2">
              <div className="truncate text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{s.label}</div>
              <div className="truncate font-display text-[0.95rem] font-700 text-[var(--text)]">{s.value}</div>
            </div>
          ))}
        </div>
      )}
      {card.insights.length > 0 && (
        <ul className="flex flex-col gap-2 px-3 py-3">
          {card.insights.map((i, n) => (
            <li key={n} className="flex gap-2 text-[12px] leading-snug text-[var(--text-secondary)]">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE[i.tone]}`} />
              <span className="min-w-0">{i.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Baron: the admin's business assistant. A small arrow on the right edge opens a floating chat on any
 * admin page; asking for a branch's report (daily, weekly, monthly or custom dates), insights, or an
 * Excel sheet gets a short answer, spoken in a male voice. Only mounted for the admin.
 */
export function AssistantDock() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [chips, setChips] = useState<string[]>([])
  const [ctx, setCtx] = useState<AssistantContext>({})
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState("")
  const [from, setFrom] = useState(() => dayKeyOf())
  const [to, setTo] = useState(() => dayKeyOf())
  const next = useRef(1)
  const scroller = useRef<HTMLDivElement | null>(null)
  const closeButton = useRef<HTMLButtonElement | null>(null)

  const status = useAsyncData(() => adminApi.assistantStatus())
  const voice = useVoice(!!status.data?.neuralVoice)

  const add = useCallback((m: Omit<Message, "id">) => {
    setMessages((cur) => [...cur, { ...m, id: next.current++ }])
  }, [])

  // The page behind must not scroll while the chat is open (see .assistant-open in index.css).
  useEffect(() => {
    if (!open) return
    document.documentElement.classList.add("assistant-open")
    return () => document.documentElement.classList.remove("assistant-open")
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" })
  }, [messages, busy, open])

  const openChat = () => {
    voice.unlock() // this tap is what allows sound on phones
    const hello = buildGreeting()
    next.current = 1
    setMessages([{ id: next.current++, from: "bot", text: hello.text, speech: hello.speech }])
    setChips(START_CHIPS)
    setCtx({})
    setDraft("")
    setOpen(true)
    void voice.speak(hello.speech)
  }

  function close() {
    voice.stop()
    setOpen(false)
  }

  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || busy) return
    voice.unlock()
    voice.stop()
    setDraft("")
    setChips([])
    add({ from: "me", text })
    setBusy(true)
    try {
      const r = await adminApi.assistantChat(text, ctx)
      add({ from: "bot", text: r.text, speech: r.speech, card: r.card, action: r.action })
      setChips(r.chips)
      setCtx(r.context)
      void voice.speak(r.speech)
    } catch (e) {
      const msg = e instanceof Error && e.message ? e.message : "I couldn't reach the server."
      add({ from: "bot", text: `${msg} Please try again.` })
      setChips(START_CHIPS)
    } finally {
      setBusy(false)
    }
  }

  const askingDates = open && !busy && ctx.awaiting === "dates"

  return (
    <>
      {/* The little arrow attached to the right edge, on every admin page */}
      {!open && (
        <button
          type="button"
          aria-label={`Open ${NAME}, your business assistant`}
          title={`${NAME} · business assistant`}
          onClick={openChat}
          className="assistant-tab fixed right-0 z-[70] flex h-14 w-8 items-center justify-center rounded-l-2xl border border-r-0 border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[0_6px_24px_rgba(0,0,0,0.35)] active:opacity-80"
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
      )}

      {open && (
        <div className="assistant-layer fixed inset-0 z-[80] flex items-end justify-end p-3 sm:p-5" role="presentation">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-hidden />
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`${NAME}, your business assistant`}
            className="assistant-panel relative flex h-[42rem] max-h-full w-full max-w-[26rem] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
          >
            <header className="flex shrink-0 items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface-soft)] px-4 py-3">
              <Avatar speaking={voice.speaking} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-800 uppercase leading-none tracking-wider">{NAME}</div>
                <div className="mt-1 truncate text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  {voice.speaking ? "Speaking…" : "CAVE business assistant"}
                </div>
              </div>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] active:opacity-70"
                aria-label={voice.enabled ? "Mute the voice" : "Turn the voice on"}
                aria-pressed={voice.enabled}
                title={voice.enabled ? "Voice on" : "Voice off"}
                onClick={() => voice.setEnabled(!voice.enabled)}
              >
                {voice.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                ref={closeButton}
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] active:opacity-70"
                aria-label={`Close ${NAME}`}
                onClick={close}
                autoFocus
              >
                <X size={16} />
              </button>
            </header>

            <div ref={scroller} className="assistant-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4">
              <div className="flex flex-col gap-3">
                {messages.map((m) =>
                  m.from === "me" ? (
                    <div key={m.id} className="ml-10 self-end rounded-2xl rounded-br-md bg-[var(--text)] px-3.5 py-2 text-sm text-[var(--bg)]">
                      {m.text}
                    </div>
                  ) : (
                    <div key={m.id} className="flex items-start gap-2">
                      <Avatar size={28} />
                      <div className="min-w-0 max-w-[88%] rounded-2xl rounded-tl-md border border-[var(--border-subtle)] bg-[var(--surface)] px-3.5 py-2.5">
                        <div className="text-sm leading-snug text-[var(--text)]">{m.text}</div>
                        {m.card && <Card card={m.card} />}
                        {m.action && <DownloadButton action={m.action} label={m.action.label} />}
                        {m.speech && voice.enabled && (
                          <button
                            type="button"
                            className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[var(--text-muted)] active:opacity-60"
                            onClick={() => {
                              voice.unlock()
                              void voice.speak(m.speech!)
                            }}
                          >
                            <Volume2 size={12} /> Listen
                          </button>
                        )}
                      </div>
                    </div>
                  ),
                )}
                {busy && (
                  <div className="flex items-center gap-2" aria-live="polite">
                    <Avatar size={28} />
                    <div className="flex gap-1 rounded-2xl rounded-tl-md border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3" aria-label={`${NAME} is working it out`}>
                      <span className="assistant-dot" />
                      <span className="assistant-dot" style={{ animationDelay: "0.15s" }} />
                      <span className="assistant-dot" style={{ animationDelay: "0.3s" }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <footer className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 pb-3 pt-2">
              {askingDates && (
                <div className="mb-2 grid grid-cols-2 gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-2.5">
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[9px] uppercase tracking-widest text-[var(--text-muted)]">From</span>
                    <input
                      type="date"
                      value={from}
                      max={dayKeyOf()}
                      onChange={(e) => {
                        setFrom(e.target.value)
                        if (e.target.value > to) setTo(e.target.value)
                      }}
                      className="admin-input h-10 w-full min-w-0 text-[16px]"
                    />
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[9px] uppercase tracking-widest text-[var(--text-muted)]">To</span>
                    <input
                      type="date"
                      value={to}
                      min={from}
                      max={dayKeyOf()}
                      onChange={(e) => setTo(e.target.value)}
                      className="admin-input h-10 w-full min-w-0 text-[16px]"
                    />
                  </label>
                  <button
                    type="button"
                    className="col-span-2 h-10 rounded-xl bg-[var(--text)] text-xs font-700 uppercase tracking-wider text-[var(--bg)] active:opacity-80 disabled:opacity-50"
                    disabled={!from || !to || from > to}
                    onClick={() => void send(`${from} to ${to}`)}
                  >
                    Get report for these dates
                  </button>
                </div>
              )}
              {chips.length > 0 && !busy && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {chips.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[12px] text-[var(--text-secondary)] active:opacity-70"
                      onClick={() => void send(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  void send(draft)
                }}
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 300))}
                  placeholder="Ask for a report or insights…"
                  aria-label={`Message ${NAME}`}
                  enterKeyHint="send"
                  autoComplete="off"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 text-[16px] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--text-muted)]"
                />
                <button
                  type="submit"
                  aria-label="Send"
                  disabled={busy || !draft.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--text)] text-[var(--bg)] active:opacity-80 disabled:opacity-40"
                >
                  <Send size={17} />
                </button>
              </form>
            </footer>
          </section>
        </div>
      )}
    </>
  )
}
