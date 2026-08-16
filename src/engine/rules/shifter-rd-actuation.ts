import { ACTUATION_LABELS } from '../../domain/constants'
import type { RearDerailleur, Shifter } from '../../domain/types'
import type { Rule } from '../types'

/**
 * One categorical check covers cable-pull ratio (Shimano ~1.1-1.2:1 vs SRAM 1:1),
 * SRAM 11 vs 12-speed X-Actuation, and mechanical vs AXS vs Di2.
 */
export const shifterRdActuationRule: Rule = {
  id: 'shifter-rd-actuation',
  between: ['shifter', 'rearDerailleur'],
  check(a, b) {
    const shifter = a as Shifter
    const rd = b as RearDerailleur

    if (shifter.actuation === rd.actuation) {
      return {
        level: 'certified',
        explanation: `Shifter and derailleur both use ${ACTUATION_LABELS[shifter.actuation]} — they index together.`,
        fixes: [],
      }
    }

    return {
      level: 'incompatible',
      explanation: `The shifter uses ${ACTUATION_LABELS[shifter.actuation]} but the derailleur expects ${ACTUATION_LABELS[rd.actuation]}. The derailleur will move the wrong amount per click and will not index.`,
      fixes: [
        {
          action: `Use a shifter that matches the derailleur (${ACTUATION_LABELS[rd.actuation]})`,
          targetSlot: 'shifter',
          alternativeQuery: { category: 'shifter', actuation: rd.actuation },
        },
        {
          action: `Or use a derailleur that matches the shifter (${ACTUATION_LABELS[shifter.actuation]})`,
          targetSlot: 'rearDerailleur',
          alternativeQuery: { category: 'rearDerailleur', actuation: shifter.actuation },
        },
      ],
    }
  },
}
