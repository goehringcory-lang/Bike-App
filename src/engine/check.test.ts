import { describe, expect, it } from 'vitest'
import { BIKE_PRESETS, makeCatalog } from '../data'
import type { BikeBuild, Part } from '../domain/types'
import { checkBuild, checkSwap } from './check'
import type { PairResult } from './types'

const catalog = makeCatalog()

function preset(id: string): BikeBuild {
  const p = BIKE_PRESETS.find((b) => b.id === id)
  if (!p) throw new Error(`no preset ${id}`)
  return p
}

function part(id: string): Part {
  const p = catalog.byId.get(id)
  if (!p) throw new Error(`no part ${id}`)
  return p
}

function pairFor(pairs: PairResult[], ruleId: string): PairResult {
  const pair = pairs.find((p) => p.ruleId === ruleId)
  if (!pair) throw new Error(`no pair result for rule ${ruleId}`)
  return pair
}

describe('stock presets', () => {
  it.each(BIKE_PRESETS.map((b) => [b.id] as const))('%s reports no problems', (id) => {
    const report = checkBuild(preset(id), catalog)
    const bad = report.pairs.filter((p) => p.level === 'incompatible' || p.level === 'unknown')
    expect(bad, JSON.stringify(bad, null, 2)).toEqual([])
  })

  it('a full in-brand build is manufacturer certified overall', () => {
    expect(checkBuild(preset('fuel-ex-xt-m8100'), catalog).overall).toBe('certified')
  })
})

describe('cassette vs driver body', () => {
  it('Micro Spline cassette on a plain HG hub is incompatible, fix = new wheel or different cassette', () => {
    const swap = checkSwap(preset('surly-lht-disc-gx11'), part('shimano-cs-m8100-10-51'), catalog)
    expect(swap.verdict).toBe('incompatible')
    const pair = pairFor(swap.report.pairs, 'cassette-driver')
    expect(pair.level).toBe('incompatible')
    expect(pair.explanation).toMatch(/Micro Spline/)
    // generic hub has no swappable driver → fix escalates to hub/wheel replacement
    expect(pair.fixes.some((f) => /Replace the rear hub or wheel/i.test(f.action))).toBe(true)
    expect(pair.fixes.some((f) => f.targetSlot === 'cassette')).toBe(true)
  })

  it('same cassette on a DT Swiss hub instead suggests swapping the driver body', () => {
    const swap = checkSwap(preset('honzo-deore-m5100'), part('shimano-cs-m8100-10-51'), catalog)
    const pair = pairFor(swap.report.pairs, 'cassette-driver')
    expect(pair.level).toBe('incompatible')
    expect(pair.fixes[0]!.action).toMatch(/Swap the hub's driver body to Shimano Micro Spline/)
  })

  it('XD Eagle cassette on a Micro Spline hub is incompatible', () => {
    const swap = checkSwap(preset('fuel-ex-xt-m8100'), part('sram-xg-1275-10-52'), catalog)
    const pair = pairFor(swap.report.pairs, 'cassette-driver')
    expect(pair.level).toBe('incompatible')
    expect(pair.explanation).toMatch(/SRAM XD/)
  })

  it('NX Eagle PG-1230 mounts on a plain HG driver (the famous exception)', () => {
    const build: BikeBuild = {
      id: 't',
      name: 't',
      slots: { cassette: 'sram-pg-1230-11-50', rearHub: 'generic-hub-hg' },
    }
    expect(pairFor(checkBuild(build, catalog).pairs, 'cassette-driver').level).toBe('certified')
  })

  it('XD cassette on an XDR driver works with a 1.85mm spacer', () => {
    const build: BikeBuild = {
      id: 't',
      name: 't',
      slots: {
        cassette: 'sram-xg-1275-10-52',
        rearHub: 'custom-xdr-hub',
      },
    }
    const xdrHub: Part = {
      id: 'custom-xdr-hub',
      category: 'rearHub',
      brand: 'Generic',
      series: 'Road wheel',
      model: 'XDR driver',
      speeds: 12,
      source: 'builtin',
      driverInterface: 'xdr',
      swappableTo: [],
    }
    const cat = makeCatalog([xdrHub])
    const pair = pairFor(checkBuild(build, cat).pairs, 'cassette-driver')
    expect(pair.level).toBe('works-with-caveats')
    expect(pair.explanation).toMatch(/1\.85mm spacer/)
  })
})

describe('shifter vs derailleur actuation', () => {
  it('Shimano 11s shifter + SRAM 11s RD is incompatible with a pull-ratio explanation', () => {
    const build: BikeBuild = {
      id: 't',
      name: 't',
      slots: { shifter: 'shimano-sl-m8000', rearDerailleur: 'sram-rd-gx-11', rearHub: 'generic-hub-hg' },
    }
    const pair = pairFor(checkBuild(build, catalog).pairs, 'shifter-rd-actuation')
    expect(pair.level).toBe('incompatible')
    // the override supplies the richer mechanic-grade text
    expect(pair.overriddenBy).toBe('shimano11-shifter-sram11-rd-blocked')
    expect(pair.explanation).toMatch(/pull/i)
  })

  it('AXS derailleur with a mechanical Eagle shifter is incompatible; fix offers AXS controller', () => {
    const swap = checkSwap(preset('hightower-gx-eagle'), part('sram-rd-gx-eagle-axs'), catalog)
    const pair = pairFor(swap.report.pairs, 'shifter-rd-actuation')
    expect(pair.level).toBe('incompatible')
    expect(pair.fixes.some((f) => f.targetSlot === 'shifter' && f.alternativeQuery?.actuation === 'sram-axs')).toBe(true)
  })
})

describe('derailleur limits', () => {
  it('10-52 cassette on the 10-50-rated GX Eagle RD fails max-cog', () => {
    const swap = checkSwap(preset('hightower-gx-eagle'), part('sram-xg-1275-10-52'), catalog)
    const pair = pairFor(swap.report.pairs, 'rd-max-cog')
    expect(pair.level).toBe('incompatible')
    expect(pair.explanation).toMatch(/52t.*50t/)
    expect(swap.verdict).toBe('incompatible')
  })

  it('the 52t-rated GX RD resolves that same problem (checkSwap diff shows it)', () => {
    const brokenBuild: BikeBuild = {
      ...preset('hightower-gx-eagle'),
      slots: { ...preset('hightower-gx-eagle').slots, cassette: 'sram-xg-1275-10-52' },
    }
    const swap = checkSwap(brokenBuild, part('sram-rd-gx-eagle-10-52'), catalog)
    expect(swap.verdict).not.toBe('incompatible')
    expect(swap.resolvedProblems.some((p) => p.ruleId === 'rd-max-cog')).toBe(true)
  })

  it('2x crank overruns a medium-cage RD capacity as works-with-caveats, math shown', () => {
    const build: BikeBuild = {
      id: 't',
      name: 't',
      slots: {
        cassette: 'shimano-cs-m8000-11-42',
        rearDerailleur: 'shimano-rd-m8000-gs',
        shifter: 'shimano-sl-m8000',
        crankset: 'shimano-fc-m8000-36-26',
        rearHub: 'generic-hub-hg',
      },
    }
    const pair = pairFor(checkBuild(build, catalog).pairs, 'rd-capacity')
    // needed = (42-11) + (36-26) = 41 > 39
    expect(pair.level).toBe('works-with-caveats')
    expect(pair.explanation).toMatch(/41t/)
    expect(pair.explanation).toMatch(/39t/)
  })
})

describe('chains', () => {
  it('11s chain on a 12s Eagle build is incompatible with widths in the text', () => {
    const swap = checkSwap(preset('hightower-gx-eagle'), part('shimano-cn-hg601'), catalog)
    const pair = pairFor(swap.report.pairs, 'chain-speed')
    expect(pair.level).toBe('incompatible')
    expect(pair.explanation).toMatch(/5\.5/)
  })

  it('Shimano HG+ 12s chain on a SRAM Eagle build works with caveats via override', () => {
    const swap = checkSwap(preset('hightower-gx-eagle'), part('shimano-cn-m8100'), catalog)
    const pair = pairFor(swap.report.pairs, 'chain-standard')
    expect(pair.level).toBe('works-with-caveats')
    expect(pair.overriddenBy).toBe('hgplus-chain-on-eagle-cassette')
    expect(pair.caveats?.length).toBeGreaterThan(0)
  })

  it('KMC X12 on a Shimano 12s build is community verified', () => {
    const swap = checkSwap(preset('fuel-ex-xt-m8100'), part('kmc-x12'), catalog)
    const pair = pairFor(swap.report.pairs, 'chain-standard')
    expect(pair.level).toBe('verified')
    expect(pair.overriddenBy).toBe('kmc-x12-on-any-12s-cassette')
  })
})

describe('the classic 11-speed mullet build', () => {
  it('SRAM 11s shifter+RD with a Shimano HG 11-42 cassette and KMC chain is verified overall', () => {
    const build: BikeBuild = {
      id: 'mullet',
      name: 'mullet',
      slots: {
        cassette: 'shimano-cs-m7000-11-42',
        rearDerailleur: 'sram-rd-gx-11',
        shifter: 'sram-sl-gx-11',
        chain: 'kmc-x11',
        crankset: 'sram-fc-gx-1400-32',
        rearHub: 'generic-hub-hg',
      },
    }
    const report = checkBuild(build, catalog)
    expect(report.pairs.every((p) => p.level !== 'incompatible' && p.level !== 'unknown')).toBe(true)
    expect(report.overall).toBe('verified')
    expect(pairFor(report.pairs, 'chain-standard').overriddenBy).toBe('eleven-speed-chains-interchange')
  })
})

describe('override precedence', () => {
  it('an exact part-id pair override beats a pattern override on the same rule', () => {
    const build: BikeBuild = {
      id: 't',
      name: 't',
      slots: { chain: 'kmc-x11', cassette: 'shimano-cs-m7000-11-42', rearHub: 'generic-hub-hg' },
    }
    const specific = {
      id: 'test-specific',
      overridesRule: 'chain-standard',
      level: 'incompatible' as const,
      match: [{ partId: 'kmc-x11' }, { partId: 'shimano-cs-m7000-11-42' }] as [
        { partId: string },
        { partId: string },
      ],
      explanation: 'specific wins',
    }
    const pattern = {
      id: 'test-pattern',
      overridesRule: 'chain-standard',
      level: 'verified' as const,
      match: [
        { category: 'chain' as const, speeds: 11 },
        { category: 'cassette' as const, speeds: 11 },
      ] as [object, object],
      explanation: 'pattern',
    }
    const report = checkBuild(build, catalog, [pattern, specific] as never)
    const pair = pairFor(report.pairs, 'chain-standard')
    expect(pair.overriddenBy).toBe('test-specific')
    expect(pair.level).toBe('incompatible')
  })
})

describe('missing slots', () => {
  it('an empty chain slot is reported informationally, not as a failure', () => {
    const build: BikeBuild = {
      id: 't',
      name: 't',
      slots: { ...preset('fuel-ex-xt-m8100').slots, chain: undefined },
    }
    const report = checkBuild(build, catalog)
    expect(report.missingSlots).toContain('chain')
    expect(report.overall).toBe('certified')
  })
})
