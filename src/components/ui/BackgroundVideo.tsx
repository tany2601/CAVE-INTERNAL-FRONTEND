import { useEffect, useRef, useState } from "react"

/**
 * A silent, looping video behind a screen. The still picture shows first and stays as the fallback: the video fades in
 * only once it is really playing, so a slow connection, a phone in low-power mode (which blocks autoplay), a visitor
 * who asked for less motion, or a device saving data all simply keep the picture.
 */
export function BackgroundVideo({ src, poster, className = "" }: { src: string; poster: string; className?: string }) {
  const video = useRef<HTMLVideoElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [allowed] = useState(() => {
    try {
      const saving = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
      return !saving && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    } catch {
      return true
    }
  })

  useEffect(() => {
    const el = video.current
    if (!el || !allowed) return
    // Browsers only autoplay a video that is muted; React does not always set the attribute itself.
    el.muted = true
    el.defaultMuted = true
    el.play().catch(() => undefined)
  }, [allowed])

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${poster})` }} />
      {allowed && (
        <video
          ref={video}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${playing ? "opacity-100" : "opacity-0"}`}
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
          onPlaying={() => setPlaying(true)}
          onError={() => setPlaying(false)}
        />
      )}
    </div>
  )
}
