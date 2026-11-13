import { useEffect, useState } from "react"
import { staffApi } from "../lib/api"
import type { CustomerSuggestion } from "../lib/api/staff"
import { isValidPersonName } from "../lib/names"

/**
 * Returning customers with the name typed, narrowed by the digits of the number typed so far. It waits a moment
 * after each keystroke, and an answer that arrives late for an older entry is thrown away, so the list always
 * matches what is on screen.
 */
export function useCustomerSuggestions(name: string, digits: string, enabled = true) {
  const [items, setItems] = useState<CustomerSuggestion[]>([])
  const [more, setMore] = useState(false)
  const [loading, setLoading] = useState(false)

  const usable = enabled && isValidPersonName(name, 2)
  useEffect(() => {
    if (!usable) {
      setItems([])
      setMore(false)
      setLoading(false)
      return
    }
    let current = true
    setLoading(true)
    const timer = window.setTimeout(() => {
      staffApi
        .suggestCustomers(name.trim(), digits)
        .then((res) => {
          if (!current) return
          setItems(res.data)
          setMore(!!res.more)
        })
        .catch(() => {
          if (current) setItems([]) // a hiccup just means no suggestions; typing the number still works
        })
        .finally(() => current && setLoading(false))
    }, 250)
    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [name, digits, usable])

  return { items: usable ? items : [], more, loading }
}
