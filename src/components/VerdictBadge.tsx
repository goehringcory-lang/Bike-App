import { COMPAT_LABELS, type CompatLevel } from '../domain/constants'

const STYLES: Record<CompatLevel, string> = {
  certified: 'bg-verdict-ok-soft text-verdict-ok',
  verified: 'bg-emerald-50 text-emerald-700',
  'works-with-caveats': 'bg-verdict-warn-soft text-verdict-warn',
  unknown: 'bg-slate-100 text-slate-500',
  incompatible: 'bg-verdict-bad-soft text-verdict-bad',
}

const MARKS: Record<CompatLevel, string> = {
  certified: '✓',
  verified: '✓',
  'works-with-caveats': '!',
  unknown: '?',
  incompatible: '✗',
}

export function VerdictBadge({ level, large }: { level: CompatLevel; large?: boolean }) {
  return (
    <span
      data-testid="verdict-badge"
      data-level={level}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${STYLES[level]} ${large ? 'px-4 py-1.5 text-base' : 'px-2.5 py-0.5 text-xs'}`}
    >
      <span aria-hidden>{MARKS[level]}</span>
      {COMPAT_LABELS[level]}
    </span>
  )
}
