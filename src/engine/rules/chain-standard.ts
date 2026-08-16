import { CHAIN_STANDARD_LABELS } from '../../domain/constants'
import type { Cassette, Chain } from '../../domain/types'
import type { Rule } from '../types'

/**
 * Same standard → manufacturer-certified. Different standards → the base rule
 * stays neutral ('unknown') and the override list (known-combos.json) supplies
 * the community verdict for cross-brand pairings like HG+ chains on Eagle.
 */
export const chainStandardRule: Rule = {
  id: 'chain-standard',
  between: ['chain', 'cassette'],
  check(a, b) {
    const chain = a as Chain
    const cassette = b as Cassette

    if (chain.chainStandard === cassette.chainStandard) {
      return {
        level: 'certified',
        explanation: `Chain and cassette share the same standard (${CHAIN_STANDARD_LABELS[chain.chainStandard]}).`,
        fixes: [],
      }
    }

    return {
      level: 'unknown',
      explanation: `No manufacturer guidance for a ${CHAIN_STANDARD_LABELS[chain.chainStandard]} chain on a ${CHAIN_STANDARD_LABELS[cassette.chainStandard]} cassette. It may work, but we have no verified record of this combination.`,
      fixes: [
        {
          action: `To be safe, use a chain matching the cassette's standard`,
          targetSlot: 'chain',
          alternativeQuery: { category: 'chain', chainStandard: cassette.chainStandard },
        },
      ],
    }
  },
}
