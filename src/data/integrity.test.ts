import { describe, expect, it } from 'vitest'
import { BIKE_PRESETS, BUILTIN_PARTS, OVERRIDES, makeCatalog } from './index'
import { RULES } from '../engine/rules'
import { matchesSelector } from '../engine/selectors'

// These tests are what make hand-curated JSON safe: any typo'd id, dangling
// preset reference, or override that matches nothing fails the build.
describe('seed data integrity', () => {
  const catalog = makeCatalog()

  it('has parts and unique ids', () => {
    expect(BUILTIN_PARTS.length).toBeGreaterThan(40)
    const ids = BUILTIN_PARTS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every preset slot resolves to a real part of the right category', () => {
    for (const preset of BIKE_PRESETS) {
      for (const [category, id] of Object.entries(preset.slots)) {
        if (!id) continue
        const part = catalog.byId.get(id)
        expect(part, `${preset.id}: slot ${category} references unknown part "${id}"`).toBeDefined()
        expect(part!.category, `${preset.id}: slot ${category} filled with a ${part!.category}`).toBe(category)
      }
    }
  })

  it('every override references a registered rule id', () => {
    const ruleIds = new Set(RULES.map((r) => r.id))
    for (const o of OVERRIDES) {
      expect(ruleIds.has(o.overridesRule), `override ${o.id} references unknown rule "${o.overridesRule}"`).toBe(true)
    }
  })

  it('every override selector matches at least one builtin part', () => {
    for (const o of OVERRIDES) {
      for (const sel of o.match) {
        const hits = BUILTIN_PARTS.filter((p) => matchesSelector(p, sel))
        expect(hits.length, `override ${o.id} has a selector matching no parts: ${JSON.stringify(sel)}`).toBeGreaterThan(0)
      }
    }
  })

  it('ships at least one preset', () => {
    expect(BIKE_PRESETS.length).toBeGreaterThan(0)
  })
})
