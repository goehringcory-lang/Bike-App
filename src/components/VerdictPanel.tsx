import { CATEGORY_LABELS } from '../domain/constants'
import type { Catalog } from '../data'
import type { BuildReport, FixSuggestion, PairResult, PartFilter } from '../engine/types'
import { VerdictBadge } from './VerdictBadge'

interface Props {
  report: BuildReport
  catalog: Catalog
  /** Called when the user clicks a "show me alternatives" fix — applies a catalog filter. */
  onApplyFilter?: (filter: PartFilter) => void
}

function partName(catalog: Catalog, id: string): string {
  const p = catalog.byId.get(id)
  return p ? `${p.brand} ${p.model}` : id
}

function FixRow({ fix, onApplyFilter }: { fix: FixSuggestion; onApplyFilter?: (f: PartFilter) => void }) {
  return (
    <li className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate-700">→ {fix.action}</span>
      {fix.alternativeQuery && onApplyFilter && (
        <button
          onClick={() => onApplyFilter(fix.alternativeQuery!)}
          className="rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
        >
          show options
        </button>
      )}
    </li>
  )
}

function PairRow({ pair, catalog, onApplyFilter }: { pair: PairResult; catalog: Catalog; onApplyFilter?: (f: PartFilter) => void }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3" data-testid="pair-row" data-rule={pair.ruleId} data-level={pair.level}>
      <div className="flex flex-wrap items-center gap-2">
        <VerdictBadge level={pair.level} />
        <span className="text-xs text-slate-400">
          {partName(catalog, pair.partIds[0])} + {partName(catalog, pair.partIds[1])}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-700">{pair.explanation}</p>
      {pair.caveats && pair.caveats.length > 0 && (
        <ul className="mt-1 list-inside list-disc text-sm text-verdict-warn">
          {pair.caveats.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
      {pair.fixes.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
          {pair.fixes.map((f) => (
            <FixRow key={f.action} fix={f} onApplyFilter={onApplyFilter} />
          ))}
        </ul>
      )}
      {pair.overriddenBy && (
        <p className="mt-2 text-xs text-slate-400">Based on cross-brand knowledge, not manufacturer spec.</p>
      )}
    </div>
  )
}

const severityRank = { incompatible: 0, unknown: 1, 'works-with-caveats': 2, verified: 3, certified: 4 }

export function VerdictPanel({ report, catalog, onApplyFilter }: Props) {
  const sorted = [...report.pairs].sort((a, b) => severityRank[a.level] - severityRank[b.level])
  const problems = sorted.filter((p) => p.level !== 'certified' && p.level !== 'verified')
  const fine = sorted.filter((p) => p.level === 'certified' || p.level === 'verified')

  return (
    <div className="space-y-3" data-testid="verdict-panel">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold">Compatibility</h2>
        <VerdictBadge level={report.overall} large />
      </div>
      {report.missingSlots.length > 0 && (
        <p className="text-sm text-slate-500">
          Not selected yet: {report.missingSlots.map((s) => CATEGORY_LABELS[s].toLowerCase()).join(', ')}.
        </p>
      )}
      {problems.length > 0 && (
        <div className="space-y-2">
          {problems.map((p) => (
            <PairRow key={p.ruleId + p.partIds.join()} pair={p} catalog={catalog} onApplyFilter={onApplyFilter} />
          ))}
        </div>
      )}
      {fine.length > 0 && (
        <details className="text-sm" open={problems.length === 0}>
          <summary className="cursor-pointer text-slate-500">
            {fine.length} check{fine.length === 1 ? '' : 's'} passing
          </summary>
          <div className="mt-2 space-y-2">
            {fine.map((p) => (
              <PairRow key={p.ruleId + p.partIds.join()} pair={p} catalog={catalog} onApplyFilter={onApplyFilter} />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
