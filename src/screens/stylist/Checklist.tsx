import { useState } from "react"
import { StylistNav } from "../../components/layout"
import { SectionLabel, CheckItem, ProgressBar } from "../../components/ui"
import { staffApi } from "../../lib/api"
import { useAsyncData } from "../../hooks/useAsyncData"

interface Props {
  onNav: (screen: string) => void
  navTab: string
}

export default function Checklist({ onNav, navTab }: Props) {
  const { data, loading, error } = useAsyncData(() => staffApi.getChecklist())
  // Ticks are saved immediately; `local` holds the latest server state.
  const [local, setLocal] = useState<typeof data>()
  const [saveError, setSaveError] = useState<string | null>(null)
  const items = local ?? data ?? []
  const completed = items.filter((i) => i.done).length
  const pct = items.length ? Math.round((completed / items.length) * 100) : 0

  const toggle = async (id: string) => {
    const current = items.find((i) => i.id === id)
    if (!current) return
    setLocal(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
    setSaveError(null)
    try {
      setLocal(await staffApi.setChecklistItem(id, !current.done))
    } catch (e) {
      setLocal(items) // roll back the optimistic tick
      setSaveError(e instanceof Error ? e.message : "Could not save the tick.")
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <div className="flex-1 overflow-y-auto pb-nav">
        {/* Header */}
        <div className="px-5 pt-page pb-5 border-b border-[var(--border-subtle)]">
          <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-subtle)]">
            Daily
          </div>
          <div className="font-display font-800 text-2xl tracking-wider text-[var(--text)] mt-0.5">
            Today's Tasks
          </div>

          {/* Progress */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[var(--text-secondary)]">
                {completed} of {items.length} complete
              </span>
              <span className="font-display font-800 text-lg text-[var(--text)]">
                {pct}%
              </span>
            </div>
            <ProgressBar value={completed} max={items.length} />
          </div>
        </div>

        <div className="px-5">
          {(loading && !data) && (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              Loading tasks…
            </div>
          )}
          {error && (
            <div className="py-8 text-center text-xs text-[#E06060]">{error}</div>
          )}
          {saveError && (
            <div className="pt-4 text-xs text-[#E06060]">{saveError}</div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              No tasks assigned yet.
            </div>
          )}
          {/* Pending */}
          {items.filter((i) => !i.done).length > 0 && (
            <div className="py-4">
              <SectionLabel>
                Pending ({items.filter((i) => !i.done).length})
              </SectionLabel>
              <div className="divide-y divide-[var(--border-subtle)]">
                {items
                  .filter((i) => !i.done)
                  .map((item) => (
                    <CheckItem
                      key={item.id}
                      task={item.task}
                      description={item.description}
                      done={item.done}
                      onToggle={() => void toggle(item.id)}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Done */}
          {completed > 0 && (
            <div className="pb-4">
              <SectionLabel>Done ({completed})</SectionLabel>
              <div className="divide-y divide-[var(--border-subtle)]">
                {items
                  .filter((i) => i.done)
                  .map((item) => (
                    <CheckItem
                      key={item.id}
                      task={item.task}
                      description={item.description}
                      done={item.done}
                      onToggle={() => void toggle(item.id)}
                    />
                  ))}
              </div>
            </div>
          )}

          <div className="py-3 text-[10px] text-[var(--border)] tracking-wider">
            Tasks are set by the admin.
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <StylistNav active={navTab} onSelect={onNav} />
    </div>
  )
}
