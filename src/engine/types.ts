import type { CompatLevel, ComponentCategory } from '../domain/constants'
import type { BikeBuild, Part, Selector } from '../domain/types'
import type { Catalog } from '../data'

/** The pattern form of a Selector — usable as a catalog filter in the UI. */
export type PartFilter = Exclude<Selector, { partId: string }>

export interface FixSuggestion {
  /** Imperative, mechanic-readable action: "Swap the hub's driver body to Micro Spline". */
  action: string
  /** Which slot changing would resolve the problem. */
  targetSlot: ComponentCategory
  /** Optional catalog filter the UI renders as "or choose one of these parts". */
  alternativeQuery?: PartFilter
}

export interface RuleResult {
  level: CompatLevel
  explanation: string
  fixes: FixSuggestion[]
}

export interface Rule {
  id: string
  /** The two slots this rule inspects; check() receives parts in this order. */
  between: [ComponentCategory, ComponentCategory]
  /** Return null when the rule has nothing to say (e.g. prerequisites missing). */
  check(a: Part, b: Part, build: BikeBuild, catalog: Catalog): RuleResult | null
}

export interface PairResult extends RuleResult {
  ruleId: string
  partIds: [string, string]
  caveats?: string[]
  /** Id of the override that supplied this verdict, if any. */
  overriddenBy?: string
}

export interface BuildReport {
  overall: CompatLevel
  pairs: PairResult[]
  /** Categories with no part selected — reported informationally. */
  missingSlots: ComponentCategory[]
}

export interface SwapReport {
  /** Verdict for the candidate part specifically (worst level among pairs involving it). */
  verdict: CompatLevel
  report: BuildReport
  newProblems: PairResult[]
  resolvedProblems: PairResult[]
  replacedPartId?: string
}
