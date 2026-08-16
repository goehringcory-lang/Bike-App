import { useState } from 'react'
import {
  ACTUATION_LABELS,
  ACTUATION_STANDARDS,
  CATEGORY_LABELS,
  CHAIN_STANDARDS,
  CHAIN_STANDARD_LABELS,
  COMPONENT_CATEGORIES,
  DRIVER_INTERFACES,
  DRIVER_LABELS,
  type ComponentCategory,
} from '../domain/constants'
import { componentSchema } from '../domain/schemas'
import type { Part } from '../domain/types'
import { useCustomParts } from '../stores/customParts'

interface Props {
  onDone: (part: Part) => void
  onCancel: () => void
}

const inputCls = 'w-full rounded border border-slate-300 px-2 py-1.5 text-sm'
const labelCls = 'block text-xs font-medium text-slate-500 mt-2'

export function CustomPartForm({ onDone, onCancel }: Props) {
  const addPart = useCustomParts((s) => s.addPart)
  const [category, setCategory] = useState<ComponentCategory>('cassette')
  const [fields, setFields] = useState<Record<string, string>>({ speeds: '12' })
  const [error, setError] = useState<string | null>(null)

  const f = (key: string) => fields[key] ?? ''
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const slug = `custom-${(f('brand') + '-' + f('model')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`
    const base = {
      id: slug,
      category,
      brand: f('brand'),
      series: f('series') || f('brand'),
      model: f('model'),
      speeds: Number(f('speeds')),
      source: 'custom' as const,
      ...(f('imageUrl') ? { imageUrl: f('imageUrl') } : {}),
    }
    const byCategory: Record<ComponentCategory, object> = {
      cassette: {
        driverInterface: f('driverInterface') || 'hg-splined',
        smallestCog: Number(f('smallestCog')),
        largestCog: Number(f('largestCog')),
        chainStandard: f('chainStandard') || 'hg',
      },
      rearDerailleur: {
        actuation: f('actuation') || 'shimano-mtb-12',
        maxCogTeeth: Number(f('maxCogTeeth')),
        totalCapacity: Number(f('totalCapacity')),
        cageLength: f('cageLength') || 'long',
        clutch: f('clutch') !== 'no',
      },
      shifter: { actuation: f('actuation') || 'shimano-mtb-12', type: f('type') || 'trigger' },
      chain: {
        chainStandard: f('chainStandard') || 'hg',
        innerWidthMm: Number(f('innerWidthMm') || 5.25),
        directional: f('directional') === 'yes',
        masterLink: f('masterLink') || 'quicklink',
      },
      crankset: {
        ringCount: Math.min(3, Math.max(1, f('chainringTeeth').split('/').length)),
        chainringTeeth: f('chainringTeeth')
          .split('/')
          .map((t) => Number(t.trim()))
          .filter((n) => !Number.isNaN(n)),
        chainlineMm: Number(f('chainlineMm') || 52),
      },
      rearHub: {
        driverInterface: f('driverInterface') || 'hg-splined',
        swappableTo: f('swappable') === 'yes' ? [...DRIVER_INTERFACES] : [],
      },
    }
    const parsed = componentSchema.safeParse({ ...base, ...byCategory[category] })
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      setError(`${first?.path.join('.') ?? 'form'}: ${first?.message ?? 'invalid'}`)
      return
    }
    addPart(parsed.data)
    onDone(parsed.data)
  }

  const selectField = (key: string, label: string, options: readonly string[], labels?: Record<string, string>) => (
    <div>
      <label className={labelCls}>{label}</label>
      <select className={inputCls} value={f(key) || options[0]} onChange={set(key)} data-testid={`field-${key}`}>
        {options.map((o) => (
          <option key={o} value={o}>
            {labels?.[o] ?? o}
          </option>
        ))}
      </select>
    </div>
  )

  const numField = (key: string, label: string, placeholder = '') => (
    <div>
      <label className={labelCls}>{label}</label>
      <input className={inputCls} inputMode="numeric" value={f(key)} onChange={set(key)} placeholder={placeholder} data-testid={`field-${key}`} />
    </div>
  )

  return (
    <form onSubmit={submit} className="space-y-1 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
      <h3 className="text-lg font-bold">Add a custom part</h3>
      <p className="text-xs text-slate-500">Copy the specs from the manufacturer's page — they're what compatibility is checked against.</p>

      <div>
        <label className={labelCls}>Category</label>
        <select
          className={inputCls}
          value={category}
          onChange={(e) => setCategory(e.target.value as ComponentCategory)}
        >
          {COMPONENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Brand</label>
          <input className={inputCls} value={f('brand')} onChange={set('brand')} placeholder="e.g. Sunrace" data-testid="field-brand" required />
        </div>
        <div>
          <label className={labelCls}>Model</label>
          <input className={inputCls} value={f('model')} onChange={set('model')} placeholder="e.g. CSMX80" data-testid="field-model" required />
        </div>
      </div>
      <div>
        <label className={labelCls}>Series (optional)</label>
        <input className={inputCls} value={f('series')} onChange={set('series')} placeholder="e.g. MX80" />
      </div>
      {numField('speeds', 'Speeds', '11')}

      {category === 'cassette' && (
        <>
          {selectField('driverInterface', 'Driver body', DRIVER_INTERFACES, DRIVER_LABELS)}
          <div className="grid grid-cols-2 gap-2">
            {numField('smallestCog', 'Smallest cog (t)', '11')}
            {numField('largestCog', 'Largest cog (t)', '50')}
          </div>
          {selectField('chainStandard', 'Chain standard', CHAIN_STANDARDS, CHAIN_STANDARD_LABELS)}
        </>
      )}
      {category === 'rearDerailleur' && (
        <>
          {selectField('actuation', 'Actuation', ACTUATION_STANDARDS, ACTUATION_LABELS)}
          <div className="grid grid-cols-2 gap-2">
            {numField('maxCogTeeth', 'Max cog (t)', '51')}
            {numField('totalCapacity', 'Total capacity (t)', '41')}
          </div>
          {selectField('cageLength', 'Cage', ['long', 'medium', 'short'])}
        </>
      )}
      {category === 'shifter' && (
        <>
          {selectField('actuation', 'Actuation', ACTUATION_STANDARDS, ACTUATION_LABELS)}
          {selectField('type', 'Type', ['trigger', 'grip', 'axs-controller', 'di2'])}
        </>
      )}
      {category === 'chain' && (
        <>
          {selectField('chainStandard', 'Chain standard', CHAIN_STANDARDS, CHAIN_STANDARD_LABELS)}
          {numField('innerWidthMm', 'Inner width (mm)', '5.25')}
          {selectField('masterLink', 'Master link', ['quicklink', 'powerlock', 'pin'])}
          {selectField('directional', 'Directional?', ['no', 'yes'])}
        </>
      )}
      {category === 'crankset' && (
        <>
          {numField('chainringTeeth', 'Chainring teeth (e.g. 32 or 36/26)', '32')}
          {numField('chainlineMm', 'Chainline (mm)', '52')}
        </>
      )}
      {category === 'rearHub' && (
        <>
          {selectField('driverInterface', 'Current driver body', DRIVER_INTERFACES, DRIVER_LABELS)}
          {selectField('swappable', 'Driver body swappable?', ['no', 'yes'])}
        </>
      )}

      <div>
        <label className={labelCls}>Image URL (optional)</label>
        <input className={inputCls} value={f('imageUrl')} onChange={set('imageUrl')} placeholder="https://…" />
      </div>

      {error && <p className="text-sm text-verdict-bad">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="submit" className="rounded bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-700">
          Save part
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-slate-300 px-4 py-1.5 text-sm">
          Cancel
        </button>
      </div>
    </form>
  )
}
