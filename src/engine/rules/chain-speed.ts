import { CHAIN_INNER_WIDTH_MM } from '../../domain/constants'
import type { Cassette, Chain } from '../../domain/types'
import type { Rule } from '../types'

export const chainSpeedRule: Rule = {
  id: 'chain-speed',
  between: ['chain', 'cassette'],
  check(a, b) {
    const chain = a as Chain
    const cassette = b as Cassette

    if (chain.speeds === cassette.speeds) {
      return {
        level: 'certified',
        explanation: `Chain and cassette are both ${chain.speeds}-speed.`,
        fixes: [],
      }
    }

    const chainW = CHAIN_INNER_WIDTH_MM[chain.speeds]
    const casW = CHAIN_INNER_WIDTH_MM[cassette.speeds]
    const widths = chainW && casW ? ` A ${chain.speeds}s chain is ~${chainW}mm wide inside vs. the ~${casW}mm a ${cassette.speeds}-speed cassette expects.` : ''

    return {
      level: 'incompatible',
      explanation: `This is a ${chain.speeds}-speed chain on a ${cassette.speeds}-speed cassette — the width is wrong for the cog spacing.${widths}`,
      fixes: [
        {
          action: `Use a ${cassette.speeds}-speed chain`,
          targetSlot: 'chain',
          alternativeQuery: { category: 'chain', speeds: cassette.speeds },
        },
      ],
    }
  },
}
