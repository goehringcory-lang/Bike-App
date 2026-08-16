import type { z } from 'zod'
import type {
  bikeBuildSchema,
  cassetteSchema,
  chainSchema,
  componentSchema,
  cranksetSchema,
  overrideSchema,
  rearDerailleurSchema,
  rearHubSchema,
  selectorSchema,
  shifterSchema,
} from './schemas'

export type Cassette = z.infer<typeof cassetteSchema>
export type RearDerailleur = z.infer<typeof rearDerailleurSchema>
export type Shifter = z.infer<typeof shifterSchema>
export type Chain = z.infer<typeof chainSchema>
export type Crankset = z.infer<typeof cranksetSchema>
export type RearHub = z.infer<typeof rearHubSchema>
export type Part = z.infer<typeof componentSchema>
export type BikeBuild = z.infer<typeof bikeBuildSchema>
export type Selector = z.infer<typeof selectorSchema>
export type Override = z.infer<typeof overrideSchema>
