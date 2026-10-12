import { useCallback, useEffect, useRef, useState } from "react"
import { adminApi } from "../../../lib/api"

const KEY = "cave.assistant.voice"

/** Known male voices on phones and computers (macOS/iOS, Chrome, Edge/Windows). */
const MALE = /\b(rishi|ravi|prabhat|madhur|daniel|arthur|oliver|aaron|alex|fred|guy|ryan|mark|david|george|james|thomas|google uk english male|male)\b/i
const FEMALE = /\b(female|samantha|karen|moira|tessa|veena|heera|neerja|swara|zira|susan|hazel|libby|sonia|aria|jenny|ava|allison|fiona|kate|serena|victoria|google us english|google uk english female)\b/i
const NICE = /\b(natural|online|neural|enhanced|premium|siri)\b/i

/**
 * Picks the most natural-sounding male English voice the device offers (Indian English first),
 * or null to let the browser use its default.
 */
export function pickMaleVoice(voices: { name: string; lang: string }[]): number {
  let best = -1
  let bestScore = 0
  voices.forEach((v, i) => {
    const lang = v.lang.replace("_", "-").toLowerCase()
    if (!lang.startsWith("en")) return
    let score = lang === "en-in" ? 30 : lang === "en-gb" ? 12 : lang === "en-us" ? 6 : 3
    if (MALE.test(v.name)) score += 60
    if (FEMALE.test(v.name)) score -= 100
    if (NICE.test(v.name)) score += 20
    if (score > bestScore) {
      best = i
      bestScore = score
    }
  })
  return best
}

/** A one-second silent clip: playing it from a tap lets the page play audio later without another tap (iOS/Safari). */
const SILENCE =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="

/** Splits text into sentences: some browsers cut a long utterance off after about 15 seconds. */
const sentences = (text: string) => text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text]

/**
 * The assistant's voice. With a neural voice set up on the server it plays that (natural, expressive);
 * otherwise, or if that fails, it uses the device's own male voice.
 */
export function useVoice(neural: boolean) {
  const [enabled, setEnabledState] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== "off"
    } catch {
      return true
    }
  })
  const [speaking, setSpeaking] = useState(false)
  const audio = useRef<HTMLAudioElement | null>(null)
  const objectUrl = useRef<string | null>(null)
  const run = useRef(0) // bumped to cancel whatever is being said

  const stop = useCallback(() => {
    run.current += 1
    audio.current?.pause()
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current)
      objectUrl.current = null
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  /** Call from a tap: lets later speech play on phones that block sound until the user has touched the page. */
  const unlock = useCallback(() => {
    try {
      if (!audio.current) audio.current = new Audio()
      audio.current.src = SILENCE
      void audio.current.play().catch(() => undefined)
      if ("speechSynthesis" in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(""))
    } catch {
      // not supported: speech simply stays quiet
    }
  }, [])

  const browserSpeak = useCallback((text: string, id: number) => {
    if (!("speechSynthesis" in window)) return
    const synth = window.speechSynthesis
    const voices = synth.getVoices()
    const voice = voices[pickMaleVoice(voices)] ?? null
    const parts = sentences(text)
    setSpeaking(true)
    // Some browsers never report that they finished (no voice installed): don't stay "speaking" forever.
    window.setTimeout(() => id === run.current && setSpeaking(false), 3000 + text.length * 90)
    parts.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part)
      if (voice) {
        u.voice = voice
        u.lang = voice.lang
      } else u.lang = "en-IN"
      // Unhurried, a touch lower, with a little lift at the end of each sentence: less robotic.
      u.rate = 0.96
      u.pitch = voice ? 0.92 : 0.8
      if (i === parts.length - 1) {
        u.onend = () => id === run.current && setSpeaking(false)
        u.onerror = () => id === run.current && setSpeaking(false)
      }
      synth.speak(u)
    })
  }, [])

  const speak = useCallback(
    async (text: string) => {
      if (!enabled || !text.trim()) return
      stop()
      const id = run.current
      if (neural) {
        try {
          const blob = await adminApi.assistantSpeak(text)
          if (id !== run.current) return
          const url = URL.createObjectURL(blob)
          objectUrl.current = url
          if (!audio.current) audio.current = new Audio()
          const el = audio.current
          el.src = url
          el.onended = () => id === run.current && setSpeaking(false)
          el.onerror = () => id === run.current && setSpeaking(false)
          setSpeaking(true)
          await el.play()
          return
        } catch {
          if (id !== run.current) return
          // fall through to the device's voice
        }
      }
      browserSpeak(text, id)
    },
    [enabled, neural, stop, browserSpeak],
  )

  const setEnabled = useCallback(
    (on: boolean) => {
      setEnabledState(on)
      try {
        localStorage.setItem(KEY, on ? "on" : "off")
      } catch {
        // ignore
      }
      if (!on) stop()
    },
    [stop],
  )

  // Voices load a moment after the page does on some browsers.
  useEffect(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices()
    return () => {
      run.current += 1
      audio.current?.pause()
      if ("speechSynthesis" in window) window.speechSynthesis.cancel()
    }
  }, [])

  return { enabled, setEnabled, speaking, speak, stop, unlock }
}
