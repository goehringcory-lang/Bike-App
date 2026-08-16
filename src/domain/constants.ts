/** Driver body (freehub) interfaces a cassette can mount to. */
export const DRIVER_INTERFACES = ['hg-splined', 'micro-spline', 'xd', 'xdr'] as const
export type DriverInterface = (typeof DRIVER_INTERFACES)[number]

export const DRIVER_LABELS: Record<DriverInterface, string> = {
  'hg-splined': 'Shimano HG splined',
  'micro-spline': 'Shimano Micro Spline',
  xd: 'SRAM XD',
  xdr: 'SRAM XDR',
}

/**
 * The shifter<->derailleur contract. Matching is categorical, not numeric:
 * comparing real pull ratios with a tolerance would invent false positives
 * (e.g. Shimano 10s and 11s MTB both pull ~1.2:1 but index differently).
 */
export const ACTUATION_STANDARDS = [
  'shimano-dynasys-10',
  'shimano-dynasys-11',
  'shimano-mtb-12',
  'sram-exact-1to1',
  'sram-x-actuation-11',
  'sram-x-actuation-12',
  'sram-axs',
  'shimano-di2',
] as const
export type ActuationStandard = (typeof ACTUATION_STANDARDS)[number]

export const ACTUATION_LABELS: Record<ActuationStandard, string> = {
  'shimano-dynasys-10': 'Shimano Dyna-Sys 10-speed (~1.2:1 cable pull)',
  'shimano-dynasys-11': 'Shimano Dyna-Sys 11-speed (~1.1:1 cable pull)',
  'shimano-mtb-12': 'Shimano 12-speed MTB (Hyperglide+)',
  'sram-exact-1to1': 'SRAM Exact Actuation (1:1 cable pull)',
  'sram-x-actuation-11': 'SRAM X-Actuation 11-speed',
  'sram-x-actuation-12': 'SRAM X-Actuation 12-speed (Eagle)',
  'sram-axs': 'SRAM AXS wireless electronic',
  'shimano-di2': 'Shimano Di2 electronic',
}

export const CHAIN_STANDARDS = ['hg', 'hyperglide-plus', 'sram-11', 'sram-eagle', 'sram-flattop'] as const
export type ChainStandard = (typeof CHAIN_STANDARDS)[number]

export const CHAIN_STANDARD_LABELS: Record<ChainStandard, string> = {
  hg: 'Shimano HG / generic',
  'hyperglide-plus': 'Shimano Hyperglide+ (12s, directional)',
  'sram-11': 'SRAM 11-speed',
  'sram-eagle': 'SRAM Eagle 12-speed',
  'sram-flattop': 'SRAM Flattop (road/AXS)',
}

export const COMPONENT_CATEGORIES = [
  'cassette',
  'rearDerailleur',
  'shifter',
  'chain',
  'crankset',
  'rearHub',
] as const
export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  cassette: 'Cassette',
  rearDerailleur: 'Rear derailleur',
  shifter: 'Shifter',
  chain: 'Chain',
  crankset: 'Crankset',
  rearHub: 'Rear hub / driver body',
}

/**
 * Compatibility verdict tiers, best to worst.
 * certified  – manufacturer designed & tested together
 * verified   – cross-brand combo with strong community/mechanic consensus
 * works-with-caveats – functions, but with tradeoffs worth knowing
 * unknown    – no rule or override speaks to this pairing
 * incompatible – will not work
 */
export const COMPAT_LEVELS = ['certified', 'verified', 'works-with-caveats', 'unknown', 'incompatible'] as const
export type CompatLevel = (typeof COMPAT_LEVELS)[number]

export const COMPAT_LABELS: Record<CompatLevel, string> = {
  certified: 'Manufacturer certified',
  verified: 'Community verified',
  'works-with-caveats': 'Works with caveats',
  unknown: 'Unknown',
  incompatible: 'Incompatible',
}

/** Larger = worse. Used to aggregate an overall verdict. */
export const COMPAT_SEVERITY: Record<CompatLevel, number> = {
  certified: 0,
  verified: 1,
  'works-with-caveats': 2,
  unknown: 3,
  incompatible: 4,
}

export function worstLevel(levels: CompatLevel[]): CompatLevel {
  if (levels.length === 0) return 'unknown'
  return levels.reduce((worst, l) => (COMPAT_SEVERITY[l] > COMPAT_SEVERITY[worst] ? l : worst))
}

/** Approximate chain inner widths by speed count — used in explanation text. */
export const CHAIN_INNER_WIDTH_MM: Record<number, number> = {
  8: 7.1,
  9: 6.6,
  10: 5.9,
  11: 5.5,
  12: 5.25,
}
