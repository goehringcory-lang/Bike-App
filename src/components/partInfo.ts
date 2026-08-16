import { ACTUATION_LABELS, DRIVER_LABELS } from '../domain/constants'
import type { Part } from '../domain/types'

/** Short spec chips shown on part cards. */
export function specBadges(part: Part): string[] {
  switch (part.category) {
    case 'cassette':
      return [`${part.speeds}s`, `${part.smallestCog}-${part.largestCog}t`, DRIVER_LABELS[part.driverInterface]]
    case 'rearDerailleur':
      return [`${part.speeds}s`, `max ${part.maxCogTeeth}t`, ACTUATION_LABELS[part.actuation].split(' (')[0]!]
    case 'shifter':
      return [`${part.speeds}s`, ACTUATION_LABELS[part.actuation].split(' (')[0]!]
    case 'chain':
      return [`${part.speeds}s`, `${part.innerWidthMm}mm`, part.masterLink]
    case 'crankset':
      return [`${part.chainringTeeth.join('/')}t`, `${part.chainlineMm}mm chainline`]
    case 'rearHub':
      return [
        DRIVER_LABELS[part.driverInterface],
        part.swappableTo.length > 0 ? 'swappable driver' : 'fixed driver',
      ]
  }
}
