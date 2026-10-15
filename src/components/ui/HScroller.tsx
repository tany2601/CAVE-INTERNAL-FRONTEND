import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

/**
 * A row that slides sideways instead of stacking into a long page: swipe it on a touch screen, or use the
 * left and right arrows (they appear only when there is more to see in that direction). Each child sits in a
 * fixed-width, snapping slot (`itemClass` sets the width).
 */
export function HScroller({
  children,
  itemClass = "w-40",
  label = "items",
}: {
  children: ReactNode[]
  itemClass?: string
  /** What the row holds, for the arrows' screen-reader names ("products", "services"). */
  label?: string
}) {
  const track = useRef<HTMLDivElement | null>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    measure()
    const el = track.current
    if (!el) return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure, children.length])

  const slide = (direction: -1 | 1) => {
    const el = track.current
    if (!el) return
    el.scrollBy({ left: direction * Math.max(160, el.clientWidth * 0.8), behavior: "smooth" })
  }

  const arrow =
    "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] shadow-[0_4px_16px_rgba(0,0,0,0.35)] active:opacity-70"

  return (
    <div className="relative">
      <div
        ref={track}
        onScroll={measure}
        className="hscroller flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth pb-1"
      >
        {children.map((child, i) => (
          <div key={i} className={`shrink-0 snap-start ${itemClass}`}>
            {child}
          </div>
        ))}
      </div>
      {canLeft && (
        <button type="button" aria-label={`Slide ${label} left`} className={`${arrow} -left-2`} onClick={() => slide(-1)}>
          <ChevronLeft size={20} />
        </button>
      )}
      {canRight && (
        <button type="button" aria-label={`Slide ${label} right`} className={`${arrow} -right-2`} onClick={() => slide(1)}>
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  )
}
