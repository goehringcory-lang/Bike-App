import { COMPAT_SEVERITY, COMPONENT_CATEGORIES, worstLevel, type ComponentCategory } from '../domain/constants'
import type { BikeBuild, Override, Part } from '../domain/types'
import { OVERRIDES, type Catalog } from '../data'
import { matchesPair, pickMostSpecific } from './selectors'
import { RULES } from './rules'
import type { BuildReport, PairResult, SwapReport } from './types'

export function checkBuild(build: BikeBuild, catalog: Catalog, overrides: Override[] = OVERRIDES): BuildReport {
  const slotPart = (cat: ComponentCategory): Part | undefined => {
    const id = build.slots[cat]
    return id ? catalog.byId.get(id) : undefined
  }

  const missingSlots = COMPONENT_CATEGORIES.filter((cat) => !build.slots[cat])
  const pairs: PairResult[] = []

  for (const rule of RULES) {
    const a = slotPart(rule.between[0])
    const b = slotPart(rule.between[1])
    if (!a || !b) continue
    const result = rule.check(a, b, build, catalog)
    if (!result) continue

    let pair: PairResult = { ...result, ruleId: rule.id, partIds: [a.id, b.id] }

    const applicable = overrides.filter((o) => o.overridesRule === rule.id && matchesPair([a, b], o.match))
    const winner = pickMostSpecific(applicable)
    if (winner) {
      pair = {
        ...pair,
        level: winner.level,
        explanation: winner.explanation,
        caveats: winner.caveats,
        overriddenBy: winner.id,
        // keep the base rule's fix suggestions only if the pairing still has a problem
        fixes: COMPAT_SEVERITY[winner.level] >= COMPAT_SEVERITY['works-with-caveats'] ? pair.fixes : [],
      }
    }
    pairs.push(pair)
  }

  return {
    overall: pairs.length ? worstLevel(pairs.map((p) => p.level)) : 'unknown',
    pairs,
    missingSlots,
  }
}

/**
 * Evaluate dropping `candidate` into its category slot: full re-check of the
 * build with the candidate substituted, diffed against the current state.
 * Pure and fast enough to run on every drag-over event.
 */
export function checkSwap(
  build: BikeBuild,
  candidate: Part,
  catalog: Catalog,
  overrides: Override[] = OVERRIDES,
): SwapReport {
  const catalogWith: Catalog = catalog.byId.has(candidate.id)
    ? catalog
    : { parts: [...catalog.parts, candidate], byId: new Map(catalog.byId).set(candidate.id, candidate) }

  const before = checkBuild(build, catalogWith, overrides)
  const replacedPartId = build.slots[candidate.category]
  const after = checkBuild(
    { ...build, slots: { ...build.slots, [candidate.category]: candidate.id } },
    catalogWith,
    overrides,
  )

  const isProblem = (p: PairResult) => COMPAT_SEVERITY[p.level] >= COMPAT_SEVERITY['works-with-caveats']
  const key = (p: PairResult) => `${p.ruleId}|${p.partIds.join('|')}|${p.level}`
  const beforeKeys = new Set(before.pairs.filter(isProblem).map(key))
  const afterKeys = new Set(after.pairs.filter(isProblem).map(key))

  const involving = after.pairs.filter((p) => p.partIds.includes(candidate.id))

  return {
    verdict: involving.length ? worstLevel(involving.map((p) => p.level)) : 'unknown',
    report: after,
    newProblems: after.pairs.filter((p) => isProblem(p) && !beforeKeys.has(key(p))),
    resolvedProblems: before.pairs.filter((p) => isProblem(p) && !afterKeys.has(key(p))),
    replacedPartId,
  }
}
