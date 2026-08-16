import { CATEGORY_LABELS, type ComponentCategory } from '../../domain/constants'
import type { Rule } from '../types'

function makeSpeedsRule(catA: ComponentCategory, catB: ComponentCategory): Rule {
  return {
    id: `speeds-${catA}-${catB}`,
    between: [catA, catB],
    check(a, b) {
      if (a.speeds === b.speeds) {
        return {
          level: 'certified',
          explanation: `${CATEGORY_LABELS[catA]} and ${CATEGORY_LABELS[catB].toLowerCase()} are both ${a.speeds}-speed.`,
          fixes: [],
        }
      }
      return {
        level: 'incompatible',
        explanation: `${CATEGORY_LABELS[catA]} is ${a.speeds}-speed but the ${CATEGORY_LABELS[catB].toLowerCase()} is ${b.speeds}-speed — cog spacing and indexing won't line up.`,
        fixes: [
          {
            action: `Use a ${a.speeds}-speed ${CATEGORY_LABELS[catB].toLowerCase()}`,
            targetSlot: catB,
            alternativeQuery: { category: catB, speeds: a.speeds },
          },
          {
            action: `Or use a ${b.speeds}-speed ${CATEGORY_LABELS[catA].toLowerCase()}`,
            targetSlot: catA,
            alternativeQuery: { category: catA, speeds: b.speeds },
          },
        ],
      }
    },
  }
}

export const speedsRules: Rule[] = [
  makeSpeedsRule('shifter', 'rearDerailleur'),
  makeSpeedsRule('shifter', 'cassette'),
  makeSpeedsRule('rearDerailleur', 'cassette'),
]
