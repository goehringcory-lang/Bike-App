import type { Cassette, Crankset, RearDerailleur } from '../../domain/types'
import type { Rule } from '../types'

/**
 * Total capacity = (largest cog − smallest cog) + (largest ring − smallest ring).
 * Overrunning capacity usually still "works" with careful chain length — the
 * chain just goes slack in small-small — so this fails soft, not hard.
 */
export const rdCapacityRule: Rule = {
  id: 'rd-capacity',
  between: ['rearDerailleur', 'crankset'],
  check(a, b, build, catalog) {
    const rd = a as RearDerailleur
    const crank = b as Crankset
    const cassetteId = build.slots.cassette
    const cassette = cassetteId ? (catalog.byId.get(cassetteId) as Cassette | undefined) : undefined
    if (!cassette || cassette.category !== 'cassette') return null

    const cassetteRange = cassette.largestCog - cassette.smallestCog
    const rings = crank.chainringTeeth
    const ringRange = Math.max(...rings) - Math.min(...rings)
    const needed = cassetteRange + ringRange
    const math = `needed capacity = (${cassette.largestCog}−${cassette.smallestCog}) + (${Math.max(...rings)}−${Math.min(...rings)}) = ${needed}t vs. the derailleur's ${rd.totalCapacity}t`

    if (rd.totalCapacity >= needed) {
      return {
        level: 'certified',
        explanation: `Chain-wrap capacity checks out: ${math}.`,
        fixes: [],
      }
    }

    return {
      level: 'works-with-caveats',
      explanation: `Chain-wrap capacity is over spec: ${math}. It can usually be made to work by sizing the chain for big-big and never running small-small, but the chain may hang slack in the smallest combinations.`,
      fixes: [
        {
          action: `For full coverage, use a derailleur with at least ${needed}t total capacity`,
          targetSlot: 'rearDerailleur',
          alternativeQuery: { category: 'rearDerailleur', speeds: rd.speeds },
        },
      ],
    }
  },
}
