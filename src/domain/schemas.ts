import { z } from 'zod'
import { ACTUATION_STANDARDS, CHAIN_STANDARDS, COMPAT_LEVELS, COMPONENT_CATEGORIES, DRIVER_INTERFACES } from './constants'

const componentBase = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'id must be a lowercase slug'),
  brand: z.string().min(1),
  series: z.string().min(1),
  model: z.string().min(1),
  speeds: z.number().int().min(1).max(13),
  source: z.enum(['builtin', 'custom']).default('builtin'),
  imageUrl: z.string().url().optional(),
  notes: z.string().optional(),
})

export const cassetteSchema = componentBase.extend({
  category: z.literal('cassette'),
  driverInterface: z.enum(DRIVER_INTERFACES),
  smallestCog: z.number().int().min(9).max(14),
  largestCog: z.number().int().min(11).max(60),
  chainStandard: z.enum(CHAIN_STANDARDS),
})

export const rearDerailleurSchema = componentBase.extend({
  category: z.literal('rearDerailleur'),
  actuation: z.enum(ACTUATION_STANDARDS),
  maxCogTeeth: z.number().int().min(23).max(60),
  minCogTeeth: z.number().int().min(9).max(14).optional(),
  totalCapacity: z.number().int().min(10).max(60),
  cageLength: z.enum(['short', 'medium', 'long']),
  clutch: z.boolean(),
})

export const shifterSchema = componentBase.extend({
  category: z.literal('shifter'),
  actuation: z.enum(ACTUATION_STANDARDS),
  type: z.enum(['trigger', 'grip', 'axs-controller', 'di2']),
})

export const chainSchema = componentBase.extend({
  category: z.literal('chain'),
  chainStandard: z.enum(CHAIN_STANDARDS),
  innerWidthMm: z.number().min(4.5).max(8),
  directional: z.boolean(),
  masterLink: z.enum(['quicklink', 'powerlock', 'pin']),
})

export const cranksetSchema = componentBase.extend({
  category: z.literal('crankset'),
  ringCount: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  /** Descending, e.g. [36, 26] for a 2x. */
  chainringTeeth: z.array(z.number().int().min(20).max(54)).min(1).max(3),
  chainlineMm: z.number().min(40).max(60),
})

/**
 * Represents the rear wheel's driver situation — the thing the wizard identifies.
 * `swappableTo` lists interfaces this hub can be converted to with an
 * aftermarket driver body; empty means the whole hub/wheel must change.
 */
export const rearHubSchema = componentBase.extend({
  category: z.literal('rearHub'),
  driverInterface: z.enum(DRIVER_INTERFACES),
  swappableTo: z.array(z.enum(DRIVER_INTERFACES)),
})

export const componentSchema = z.discriminatedUnion('category', [
  cassetteSchema,
  rearDerailleurSchema,
  shifterSchema,
  chainSchema,
  cranksetSchema,
  rearHubSchema,
])

export const bikeBuildSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slots: z
    .object({
      cassette: z.string().optional(),
      rearDerailleur: z.string().optional(),
      shifter: z.string().optional(),
      chain: z.string().optional(),
      crankset: z.string().optional(),
      rearHub: z.string(),
    })
    .strict(),
  meta: z
    .object({
      year: z.number().int().optional(),
      frameNotes: z.string().optional(),
    })
    .optional(),
})

/**
 * A selector matches parts either exactly by id or by attribute pattern.
 * Every provided attribute must match (AND semantics).
 */
export const selectorSchema = z.union([
  z.object({ partId: z.string() }).strict(),
  z
    .object({
      category: z.enum(COMPONENT_CATEGORIES),
      brand: z.string().optional(),
      series: z.string().optional(),
      speeds: z.number().int().optional(),
      driverInterface: z.enum(DRIVER_INTERFACES).optional(),
      chainStandard: z.enum(CHAIN_STANDARDS).optional(),
      actuation: z.enum(ACTUATION_STANDARDS).optional(),
    })
    .strict(),
])

/**
 * An override replaces the verdict of ONE rule for a matching pair of parts.
 * Scoping to a rule id means a chain-brand override can never accidentally
 * bless a driver-body mismatch.
 */
export const overrideSchema = z.object({
  id: z.string().min(1),
  overridesRule: z.string().min(1),
  level: z.enum(COMPAT_LEVELS),
  match: z.tuple([selectorSchema, selectorSchema]),
  explanation: z.string().min(1),
  caveats: z.array(z.string()).optional(),
  source: z.string().optional(),
})
