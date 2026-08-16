import { z } from 'zod'
import { bikeBuildSchema, componentSchema, overrideSchema } from '../domain/schemas'
import type { BikeBuild, Override, Part } from '../domain/types'
import shimano12s from './components/shimano-12s.json'
import shimano11s from './components/shimano-11s.json'
import sramEagle from './components/sram-eagle.json'
import sram11s from './components/sram-11s.json'
import hubs from './components/hubs.json'
import thirdPartyChains from './components/chains-3rd-party.json'
import presets from './presets/bikes.json'
import knownCombos from './overrides/known-combos.json'

const partsSchema = z.array(componentSchema)

/** All hand-curated parts, validated at module load (fails loudly on bad data). */
export const BUILTIN_PARTS: Part[] = partsSchema.parse([
  ...shimano12s,
  ...shimano11s,
  ...sramEagle,
  ...sram11s,
  ...hubs,
  ...thirdPartyChains,
])

export const BIKE_PRESETS: BikeBuild[] = z.array(bikeBuildSchema).parse(presets)

export const OVERRIDES: Override[] = z.array(overrideSchema).parse(knownCombos)

/** A resolved lookup over a set of parts (builtin + any custom parts). */
export interface Catalog {
  parts: Part[]
  byId: Map<string, Part>
}

export function makeCatalog(extraParts: Part[] = []): Catalog {
  const parts = [...BUILTIN_PARTS, ...extraParts]
  return { parts, byId: new Map(parts.map((p) => [p.id, p])) }
}
