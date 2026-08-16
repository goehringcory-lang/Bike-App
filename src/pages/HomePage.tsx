import { Link, useNavigate } from 'react-router-dom'
import { BIKE_PRESETS } from '../data'
import { newBuildId, useGarage } from '../stores/garage'
import type { BikeBuild } from '../domain/types'

export function HomePage() {
  const navigate = useNavigate()
  const { builds, addBuild, removeBuild } = useGarage()

  function startFromPreset(preset: BikeBuild) {
    const id = newBuildId()
    addBuild({ ...preset, id, slots: { ...preset.slots } })
    navigate(`/bike/${id}`)
  }

  function startFromScratch() {
    const id = newBuildId()
    addBuild({
      id,
      name: 'My bike',
      slots: { rearHub: 'generic-hub-hg' },
    })
    navigate(`/bike/${id}`)
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold">Will it fit?</h1>
        <p className="mt-1 max-w-2xl text-slate-600">
          Set up your bike, then drag parts onto it — from any brand — and see instantly whether they'll
          work together, and what it would take to make them work.
        </p>
      </section>

      {builds.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">My garage</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {builds.map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <Link to={`/bike/${b.id}`} className="font-semibold text-slate-800 hover:text-indigo-700">
                  {b.name}
                </Link>
                <button
                  onClick={() => removeBuild(b.id)}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Remove from garage"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-bold">Start with a stock bike</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {BIKE_PRESETS.map((p) => (
            <li key={p.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="font-semibold">{p.name}</div>
              {p.meta?.frameNotes && <div className="mt-1 text-sm text-slate-500">{p.meta.frameNotes}</div>}
              <button
                onClick={() => startFromPreset(p)}
                className="mt-3 rounded bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
                data-testid={`preset-${p.id}`}
              >
                Open on the workbench
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          onClick={startFromScratch}
          className="rounded border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Build from scratch
        </button>
        <Link
          to="/wizard/driver"
          className="rounded border border-indigo-200 bg-indigo-50 px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-100"
        >
          Help me identify my driver body
        </Link>
      </section>
    </div>
  )
}
