import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CATEGORY_LABELS, COMPONENT_CATEGORIES, type CompatLevel, type ComponentCategory } from '../domain/constants'
import type { Part } from '../domain/types'
import { makeCatalog } from '../data'
import { checkBuild, checkSwap } from '../engine/check'
import type { PartFilter, SwapReport } from '../engine/types'
import { matchesSelector } from '../engine/selectors'
import { PartCard } from '../components/PartCard'
import { VerdictBadge } from '../components/VerdictBadge'
import { VerdictPanel } from '../components/VerdictPanel'
import { PartIcon, CategoryIcon } from '../icons'
import { specBadges } from '../components/partInfo'
import { useCustomParts } from '../stores/customParts'
import { useGarage } from '../stores/garage'

const SLOT_TINT: Record<CompatLevel, string> = {
  certified: 'ring-2 ring-verdict-ok bg-verdict-ok-soft',
  verified: 'ring-2 ring-emerald-500 bg-emerald-50',
  'works-with-caveats': 'ring-2 ring-verdict-warn bg-verdict-warn-soft',
  unknown: 'ring-2 ring-slate-400 bg-slate-50',
  incompatible: 'ring-2 ring-verdict-bad bg-verdict-bad-soft',
}

/** Movement below this is a click, not a drag — shared with the pointer sensor below. */
const DRAG_ACTIVATION_DISTANCE = 6

function SlotCard({
  category,
  part,
  hover,
  browsing,
  onClear,
  onClick,
}: {
  category: ComponentCategory
  part?: Part
  hover?: CompatLevel | null
  browsing?: boolean
  onClear?: () => void
  onClick: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${category}` })
  const tint = isOver && hover ? SLOT_TINT[hover] : browsing ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : ''
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Browse ${CATEGORY_LABELS[category]} parts`}
      data-testid={`slot-${category}`}
      data-browsing={browsing ? 'true' : undefined}
      className={`relative cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${tint}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {CATEGORY_LABELS[category]}
        </span>
        {part && onClear && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClear()
            }}
            className="rounded p-0.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
            title="Remove part"
          >
            ✕
          </button>
        )}
      </div>
      {part ? (
        <div className="flex items-center gap-3">
          <PartIcon part={part} className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{part.brand} {part.model}</div>
            <div className="truncate text-xs text-slate-500">{specBadges(part).slice(0, 2).join(' · ')}</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-slate-400">
          <CategoryIcon category={category} className="h-10 w-10 shrink-0 opacity-40" />
          <span className="text-sm">Drop a part here or click to browse</span>
        </div>
      )}
    </div>
  )
}

function DraggableCatalogCard({ part, onPlace }: { part: Part; onPlace: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: part.id })
  // The card is both draggable and clickable. The pointer sensor only promotes a
  // gesture to a drag past DRAG_ACTIVATION_DISTANCE, so anything shorter is a click
  // — but a drag that ends back over this card would still fire one, hence the check.
  const pointerStart = useRef<{ x: number; y: number } | null>(null)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      // Capture phase: recording the origin here leaves dnd-kit's own
      // onPointerDown listener (spread above) intact.
      onPointerDownCapture={(e) => {
        pointerStart.current = { x: e.clientX, y: e.clientY }
      }}
      onClick={(e) => {
        const start = pointerStart.current
        pointerStart.current = null
        if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) >= DRAG_ACTIVATION_DISTANCE) return
        onPlace()
      }}
      className={`cursor-pointer rounded-lg transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isDragging ? 'opacity-40' : ''}`}
      data-testid={`catalog-part-${part.id}`}
      title={`Put ${part.brand} ${part.model} on the bike`}
    >
      <div className="relative">
        <PartCard part={part} />
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPlace()
          }}
          data-testid={`place-${part.id}`}
          className="absolute right-2 top-2 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          title="Put this part on the bike"
        >
          place ↖
        </button>
      </div>
    </div>
  )
}

export function WorkbenchPage() {
  const { id } = useParams()
  const builds = useGarage((s) => s.builds)
  const updateSlots = useGarage((s) => s.updateSlots)
  const renameBuild = useGarage((s) => s.renameBuild)
  const customParts = useCustomParts((s) => s.parts)

  const build = builds.find((b) => b.id === id)
  const catalog = useMemo(() => makeCatalog(customParts), [customParts])

  const [filter, setFilter] = useState<PartFilter | null>(null)
  const [search, setSearch] = useState('')
  const [activePart, setActivePart] = useState<Part | null>(null)
  const [hoverVerdict, setHoverVerdict] = useState<CompatLevel | null>(null)
  const [lastSwap, setLastSwap] = useState<{ part: Part; swap: SwapReport } | null>(null)
  /** The slot the user clicked to browse for, if any — drives the "you're picking X" affordances. */
  const [browsingSlot, setBrowsingSlot] = useState<ComponentCategory | null>(null)
  const partsPanelRef = useRef<HTMLElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  const report = useMemo(() => (build ? checkBuild(build, catalog) : null), [build, catalog])

  if (!build || !report) {
    return (
      <p className="text-slate-500">
        Bike not found — go back <Link to="/" className="text-indigo-600 underline">home</Link> and pick one.
      </p>
    )
  }

  const sidebarParts = catalog.parts.filter((p) => {
    if (filter && !matchesSelector(p, filter)) return false
    if (search) {
      const hay = `${p.brand} ${p.series} ${p.model}`.toLowerCase()
      if (!hay.includes(search.toLowerCase())) return false
    }
    return true
  })

  function placePart(part: Part) {
    const swap = checkSwap(build!, part, catalog)
    updateSlots(build!.id, { [part.category]: part.id })
    setLastSwap({ part, swap })
    setBrowsingSlot(null)
  }

  /** Clicking a slot (or a category chip) points the parts panel at that category. */
  function browseCategory(category: ComponentCategory, scroll = false) {
    setFilter({ category })
    setBrowsingSlot(category)
    // A leftover search would hide every part and make the click look like a no-op.
    setSearch('')
    // On narrow screens the parts panel stacks far below the diagram, so bring it up.
    if (scroll) partsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  function onDragStart(e: DragStartEvent) {
    const part = catalog.byId.get(String(e.active.id)) ?? null
    setActivePart(part)
    setHoverVerdict(null)
  }

  function onDragOver(e: DragOverEvent) {
    if (!activePart || !e.over) {
      setHoverVerdict(null)
      return
    }
    if (e.over.id === `slot-${activePart.category}`) {
      setHoverVerdict(checkSwap(build!, activePart, catalog).verdict)
    } else {
      setHoverVerdict(null)
    }
  }

  function onDragEnd(e: DragEndEvent) {
    if (activePart && e.over?.id === `slot-${activePart.category}`) {
      placePart(activePart)
    }
    setActivePart(null)
    setHoverVerdict(null)
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={build.name}
              onChange={(e) => renameBuild(build.id, e.target.value)}
              className="rounded border border-transparent bg-transparent px-1 text-2xl font-bold hover:border-slate-200 focus:border-slate-300 focus:bg-white"
            />
            <Link to={`/wizard/driver?build=${build.id}`} className="text-sm text-indigo-600 underline">
              Not sure what driver body you have?
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2" data-testid="bike-diagram">
            {COMPONENT_CATEGORIES.map((cat) => (
              <SlotCard
                key={cat}
                category={cat}
                part={build.slots[cat] ? catalog.byId.get(build.slots[cat]!) : undefined}
                hover={hoverVerdict}
                browsing={browsingSlot === cat}
                onClear={cat !== 'rearHub' ? () => updateSlots(build.id, { [cat]: undefined }) : undefined}
                onClick={() => browseCategory(cat, true)}
              />
            ))}
          </div>

          {lastSwap && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm" data-testid="swap-banner">
              <span>
                Swapped in <b>{lastSwap.part.brand} {lastSwap.part.model}</b>:
              </span>
              <VerdictBadge level={lastSwap.swap.verdict} />
              {lastSwap.swap.resolvedProblems.length > 0 && (
                <span className="text-verdict-ok">resolved {lastSwap.swap.resolvedProblems.length} problem{lastSwap.swap.resolvedProblems.length > 1 ? 's' : ''}</span>
              )}
              {lastSwap.swap.newProblems.length > 0 && (
                <span className="text-verdict-bad">introduced {lastSwap.swap.newProblems.length} problem{lastSwap.swap.newProblems.length > 1 ? 's' : ''}</span>
              )}
              <button onClick={() => setLastSwap(null)} className="ml-auto text-slate-400 hover:text-slate-600">✕</button>
            </div>
          )}

          <VerdictPanel
            report={report}
            catalog={catalog}
            onApplyFilter={(f) => {
              setFilter(f)
              setBrowsingSlot(f.category)
            }}
          />
        </div>

        <aside className="space-y-3" ref={partsPanelRef}>
          <h2 className="text-lg font-bold">Parts</h2>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                setFilter(null)
                setBrowsingSlot(null)
              }}
              className={`rounded-full px-2.5 py-1 text-xs ${!filter ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
            >
              All
            </button>
            {COMPONENT_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => browseCategory(c)}
                className={`rounded-full px-2.5 py-1 text-xs ${filter?.category === c ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
          {browsingSlot && (
            <p
              className="flex items-center gap-2 rounded bg-indigo-50 px-2 py-1 text-xs text-indigo-700"
              data-testid="browsing-banner"
            >
              <span>
                Choosing a <b>{CATEGORY_LABELS[browsingSlot].toLowerCase()}</b> — click a part to fit it.
              </span>
              <button
                className="ml-auto shrink-0 underline"
                onClick={() => {
                  setFilter(null)
                  setBrowsingSlot(null)
                }}
              >
                cancel
              </button>
            </p>
          )}
          {filter && Object.keys(filter).length > 1 && (
            <p className="rounded bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
              Filtered to matching alternatives — <button className="underline" onClick={() => setFilter({ category: filter.category })}>clear</button>
            </p>
          )}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parts…"
            className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
          />
          <p className="text-xs text-slate-400">Click a part to put it on the bike, or drag it onto the diagram.</p>
          <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1" data-testid="parts-sidebar">
            {sidebarParts.map((p) => (
              <DraggableCatalogCard key={p.id} part={p} onPlace={() => placePart(p)} />
            ))}
            {sidebarParts.length === 0 && <p className="text-sm text-slate-400">No parts match this filter.</p>}
          </div>
        </aside>
      </div>

      <DragOverlay>
        {activePart && (
          <div className="w-72 rotate-2 opacity-90">
            <PartCard part={activePart} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
