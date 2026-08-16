import type { Override, Part, Selector } from '../domain/types'

export function matchesSelector(part: Part, sel: Selector): boolean {
  if ('partId' in sel) return part.id === sel.partId
  if (part.category !== sel.category) return false
  if (sel.brand !== undefined && part.brand.toLowerCase() !== sel.brand.toLowerCase()) return false
  if (sel.series !== undefined && part.series.toLowerCase() !== sel.series.toLowerCase()) return false
  if (sel.speeds !== undefined && part.speeds !== sel.speeds) return false
  if (sel.driverInterface !== undefined) {
    if (!('driverInterface' in part) || part.driverInterface !== sel.driverInterface) return false
  }
  if (sel.chainStandard !== undefined) {
    if (!('chainStandard' in part) || part.chainStandard !== sel.chainStandard) return false
  }
  if (sel.actuation !== undefined) {
    if (!('actuation' in part) || part.actuation !== sel.actuation) return false
  }
  return true
}

/** Order-free: [a, b] matches [s1, s2] if either assignment works. */
export function matchesPair(parts: [Part, Part], match: [Selector, Selector]): boolean {
  const [a, b] = parts
  const [s1, s2] = match
  return (
    (matchesSelector(a, s1) && matchesSelector(b, s2)) ||
    (matchesSelector(a, s2) && matchesSelector(b, s1))
  )
}

function selectorSpecificity(sel: Selector): number {
  if ('partId' in sel) return 100
  // count constrained attributes beyond the category itself
  return Object.keys(sel).length - 1
}

/** Higher = more specific; exact part-id pairs always beat pattern overrides. */
export function overrideSpecificity(o: Override): number {
  return selectorSpecificity(o.match[0]) + selectorSpecificity(o.match[1])
}

export function pickMostSpecific(overrides: Override[]): Override | undefined {
  return [...overrides].sort((x, y) => overrideSpecificity(y) - overrideSpecificity(x))[0]
}
