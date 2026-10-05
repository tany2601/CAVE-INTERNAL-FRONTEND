import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown } from "lucide-react"

export interface SelectOption {
  value: string
  label: string
  /** Compact text for the closed trigger (e.g. just "%"); the open menu still shows `label`. */
  shortLabel?: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: (string | SelectOption)[]
  ariaLabel?: string
  placeholder?: string
  /** Classes for the trigger button (defaults give a plain bordered field). */
  className?: string
  disabled?: boolean
  /** Icon shown before the value inside the trigger. */
  leading?: React.ReactNode
}

const MENU_MAX_HEIGHT = 288
const GAP = 6

/**
 * Custom dropdown. The menu is rendered in a portal and positioned from the trigger's
 * rectangle, so it always opens right under (or above) the trigger regardless of
 * scroll containers, modals or transforms, instead of wherever the OS decides.
 */
export function Select({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder = "Select",
  className = "",
  disabled,
  leading,
}: SelectProps) {
  const items: SelectOption[] = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  )
  const selected = items.find((i) => i.value === value)

  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [pos, setPos] = useState<{
    left: number
    width: number
    top?: number
    bottom?: number
    maxHeight: number
  } | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLUListElement>(null)
  const listId = useId()

  const place = useCallback(() => {
    const el = trigger.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const below = window.innerHeight - r.bottom - GAP - 8
    const above = r.top - GAP - 8
    const wanted = Math.min(MENU_MAX_HEIGHT, items.length * 40 + 8)
    const openUp = below < Math.min(wanted, 160) && above > below
    const width = Math.max(r.width, 160)
    setPos({
      left: Math.min(Math.max(8, r.left), window.innerWidth - width - 8),
      width,
      maxHeight: Math.min(MENU_MAX_HEIGHT, Math.max(96, openUp ? above : below)),
      ...(openUp
        ? { bottom: window.innerHeight - r.top + GAP }
        : { top: r.bottom + GAP }),
    })
  }, [items.length])

  const close = useCallback((refocus = false) => {
    setOpen(false)
    if (refocus) trigger.current?.focus()
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    place()
    const reposition = () => place()
    window.addEventListener("resize", reposition)
    window.addEventListener("scroll", reposition, true) // any ancestor scrolling
    return () => {
      window.removeEventListener("resize", reposition)
      window.removeEventListener("scroll", reposition, true)
    }
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!trigger.current?.contains(t) && !menu.current?.contains(t)) close()
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [open, close])

  // Keep the highlighted option in view.
  useEffect(() => {
    if (open) menu.current?.children[active]?.scrollIntoView({ block: "nearest" })
  }, [open, active, pos])

  const openMenu = () => {
    if (disabled) return
    setActive(Math.max(0, items.findIndex((i) => i.value === value)))
    setOpen(true)
  }

  const choose = (index: number) => {
    const item = items[index]
    if (item) onChange(item.value)
    close(true)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault()
        openMenu()
      }
      return
    }
    if (e.key === "Escape") {
      e.preventDefault()
      close(true)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(items.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === "Home") {
      e.preventDefault()
      setActive(0)
    } else if (e.key === "End") {
      e.preventDefault()
      setActive(items.length - 1)
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      choose(active)
    } else if (e.key === "Tab") {
      close()
    }
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        className={`select-trigger ${className}`}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
      >
        {leading && <span className="select-leading">{leading}</span>}
        <span className={`select-value ${selected ? "" : "select-placeholder"}`}>
          {selected?.shortLabel ?? selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`select-chevron ${open ? "open" : ""}`}
        />
      </button>
      {open &&
        pos &&
        createPortal(
          <ul
            ref={menu}
            id={listId}
            role="listbox"
            className="select-menu"
            style={{
              left: pos.left,
              width: pos.width,
              top: pos.top,
              bottom: pos.bottom,
              maxHeight: pos.maxHeight,
            }}
          >
            {items.map((item, index) => (
              <li
                key={item.value}
                role="option"
                aria-selected={item.value === value}
                className={`select-option ${index === active ? "active" : ""} ${
                  item.value === value ? "selected" : ""
                }`}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(index)}
              >
                <span className="truncate">{item.label}</span>
                {item.value === value && <Check size={13} strokeWidth={2.2} />}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  )
}
