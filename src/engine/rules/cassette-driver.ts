import { DRIVER_LABELS } from '../../domain/constants'
import type { Cassette, RearHub } from '../../domain/types'
import type { FixSuggestion, Rule } from '../types'

/**
 * A cassette only mounts to the driver body it was made for. This is the #1
 * "why doesn't my new cassette fit" question at the shop counter.
 */
export const cassetteDriverRule: Rule = {
  id: 'cassette-driver',
  between: ['cassette', 'rearHub'],
  check(a, b) {
    const cassette = a as Cassette
    const hub = b as RearHub
    const need = cassette.driverInterface
    const have = hub.driverInterface

    if (need === have) {
      return {
        level: 'certified',
        explanation: `The cassette's ${DRIVER_LABELS[need]} interface matches your hub's driver body.`,
        fixes: [],
      }
    }

    if (need === 'xd' && have === 'xdr') {
      return {
        level: 'works-with-caveats',
        explanation: `An XD cassette mounts on an XDR driver body with a 1.85mm spacer behind it (XDR is 1.85mm longer than XD).`,
        fixes: [],
      }
    }

    const fixes: FixSuggestion[] = []
    if (hub.swappableTo.includes(need)) {
      fixes.push({
        action: `Swap the hub's driver body to ${DRIVER_LABELS[need]} — your ${hub.brand} ${hub.series} hub accepts one (typically a $40–80 part you can fit by hand)`,
        targetSlot: 'rearHub',
      })
    } else {
      fixes.push({
        action: `Replace the rear hub or wheel with one that has a ${DRIVER_LABELS[need]} driver body`,
        targetSlot: 'rearHub',
        alternativeQuery: { category: 'rearHub', driverInterface: need },
      })
    }
    fixes.push({
      action: `Or pick a cassette made for your ${DRIVER_LABELS[have]} driver instead`,
      targetSlot: 'cassette',
      alternativeQuery: { category: 'cassette', driverInterface: have, speeds: cassette.speeds },
    })

    return {
      level: 'incompatible',
      explanation: `This cassette needs a ${DRIVER_LABELS[need]} driver body, but your hub has a ${DRIVER_LABELS[have]} driver — it physically will not mount.`,
      fixes,
    }
  },
}
