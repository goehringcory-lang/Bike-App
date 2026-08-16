import { CATEGORY_LABELS } from '../domain/constants'
import type { Part } from '../domain/types'
import { PartIcon } from '../icons'
import { specBadges } from './partInfo'

interface Props {
  part: Part
  showCategory?: boolean
  onDelete?: () => void
}

export function PartCard({ part, showCategory, onDelete }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <PartIcon part={part} className="h-12 w-12 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate font-semibold">{part.brand} {part.series}</span>
          {showCategory && <span className="text-xs text-slate-400">{CATEGORY_LABELS[part.category]}</span>}
        </div>
        <div className="truncate text-sm text-slate-600">{part.model}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {specBadges(part).map((b) => (
            <span key={b} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{b}</span>
          ))}
          {part.source === 'custom' && (
            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700">custom</span>
          )}
        </div>
      </div>
      {onDelete && (
        <button
          onClick={onDelete}
          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
          title="Delete custom part"
        >
          ✕
        </button>
      )}
    </div>
  )
}
