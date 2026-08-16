import { useMemo, useState } from 'react'
import { CATEGORY_LABELS, COMPONENT_CATEGORIES, type ComponentCategory } from '../domain/constants'
import { makeCatalog } from '../data'
import { PartCard } from '../components/PartCard'
import { CustomPartForm } from '../components/CustomPartForm'
import { useCustomParts } from '../stores/customParts'

export function CatalogPage() {
  const { parts: customParts, removePart } = useCustomParts()
  const catalog = useMemo(() => makeCatalog(customParts), [customParts])
  const [category, setCategory] = useState<ComponentCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const shown = catalog.parts.filter((p) => {
    if (category !== 'all' && p.category !== category) return false
    if (search) {
      const hay = `${p.brand} ${p.series} ${p.model}`.toLowerCase()
      if (!hay.includes(search.toLowerCase())) return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Parts catalog</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
          data-testid="add-custom-part"
        >
          + Add custom part
        </button>
      </div>

      {showForm && (
        <CustomPartForm onDone={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('all')}
          className={`rounded-full px-3 py-1 text-sm ${category === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          All
        </button>
        {COMPONENT_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-sm ${category === c ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="ml-auto rounded border border-slate-300 px-3 py-1 text-sm"
        />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="catalog-grid">
        {shown.map((p) => (
          <li key={p.id}>
            <PartCard part={p} showCategory onDelete={p.source === 'custom' ? () => removePart(p.id) : undefined} />
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="text-slate-500">No parts match.</p>}
    </div>
  )
}
