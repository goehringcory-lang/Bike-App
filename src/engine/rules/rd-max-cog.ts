import type { Cassette, RearDerailleur } from '../../domain/types'
import type { Rule } from '../types'

export const rdMaxCogRule: Rule = {
  id: 'rd-max-cog',
  between: ['rearDerailleur', 'cassette'],
  check(a, b) {
    const rd = a as RearDerailleur
    const cassette = b as Cassette

    if (rd.maxCogTeeth >= cassette.largestCog) {
      return {
        level: 'certified',
        explanation: `The derailleur is rated to a ${rd.maxCogTeeth}t cog — the cassette's ${cassette.largestCog}t largest cog is within range.`,
        fixes: [],
      }
    }

    return {
      level: 'incompatible',
      explanation: `The cassette's largest cog is ${cassette.largestCog}t, but this derailleur is only rated to ${rd.maxCogTeeth}t — the upper pulley will jam into the big cog and b-screw adjustment can't compensate.`,
      fixes: [
        {
          action: `Use a derailleur rated for at least a ${cassette.largestCog}t cog`,
          targetSlot: 'rearDerailleur',
          alternativeQuery: { category: 'rearDerailleur', speeds: cassette.speeds },
        },
        {
          action: `Or choose a cassette whose largest cog is ${rd.maxCogTeeth}t or smaller`,
          targetSlot: 'cassette',
          alternativeQuery: { category: 'cassette', speeds: cassette.speeds },
        },
      ],
    }
  },
}
