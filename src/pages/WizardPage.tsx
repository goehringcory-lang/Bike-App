import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { DRIVER_LABELS, type DriverInterface } from '../domain/constants'
import { DRIVER_TO_HUB_PART, DRIVER_WIZARD, WIZARD_START } from '../data/wizard/driver-id'
import { newBuildId, useGarage } from '../stores/garage'

/** Schematic side-by-side of the three driver bodies for the visual step. */
function DriverPicture({ kind }: { kind: 'hg' | 'ms' | 'xd' }) {
  if (kind === 'hg') {
    return (
      <svg viewBox="0 0 80 80" className="h-24 w-24" aria-hidden>
        <circle cx="40" cy="40" r="30" fill="none" stroke="#334155" strokeWidth="3" />
        {Array.from({ length: 9 }).map((_, i) => {
          const a = (i / 9) * Math.PI * 2
          const w = i === 0 ? 4 : 7
          return (
            <line
              key={i}
              x1={40 + Math.cos(a) * 22}
              y1={40 + Math.sin(a) * 22}
              x2={40 + Math.cos(a) * 30}
              y2={40 + Math.sin(a) * 30}
              stroke="#334155"
              strokeWidth={w}
            />
          )
        })}
        <circle cx="40" cy="40" r="12" fill="none" stroke="#334155" strokeWidth="2" />
      </svg>
    )
  }
  if (kind === 'ms') {
    return (
      <svg viewBox="0 0 80 80" className="h-24 w-24" aria-hidden>
        <circle cx="40" cy="40" r="30" fill="none" stroke="#334155" strokeWidth="3" />
        {Array.from({ length: 23 }).map((_, i) => {
          const a = (i / 23) * Math.PI * 2
          return (
            <line
              key={i}
              x1={40 + Math.cos(a) * 26}
              y1={40 + Math.sin(a) * 26}
              x2={40 + Math.cos(a) * 30}
              y2={40 + Math.sin(a) * 30}
              stroke="#334155"
              strokeWidth="2.5"
            />
          )
        })}
        <circle cx="40" cy="40" r="12" fill="none" stroke="#334155" strokeWidth="2" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24" aria-hidden>
      <circle cx="40" cy="40" r="30" fill="none" stroke="#334155" strokeWidth="3" />
      <circle cx="40" cy="40" r="22" fill="none" stroke="#334155" strokeWidth="2" />
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2
        return (
          <line
            key={i}
            x1={40 + Math.cos(a) * 13}
            y1={40 + Math.sin(a) * 13}
            x2={40 + Math.cos(a) * 16}
            y2={40 + Math.sin(a) * 16}
            stroke="#334155"
            strokeWidth="2"
          />
        )
      })}
      <circle cx="40" cy="40" r="8" fill="none" stroke="#334155" strokeWidth="2" />
    </svg>
  )
}

export function WizardPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const buildId = params.get('build')
  const { builds, addBuild, updateSlots } = useGarage()
  const [stepId, setStepId] = useState(WIZARD_START)
  const [result, setResult] = useState<{ driver: DriverInterface; detail?: string } | null>(null)

  const step = DRIVER_WIZARD[stepId]

  function finish(driver: DriverInterface, detail?: string) {
    setResult({ driver, detail })
  }

  function apply() {
    if (!result) return
    const hubId = DRIVER_TO_HUB_PART[result.driver]
    const target = buildId ? builds.find((b) => b.id === buildId) : undefined
    if (target) {
      updateSlots(target.id, { rearHub: hubId })
      navigate(`/bike/${target.id}`)
    } else {
      const id = newBuildId()
      addBuild({ id, name: 'My bike', slots: { rearHub: hubId } })
      navigate(`/bike/${id}`)
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-xl space-y-4" data-testid="wizard-result">
        <h1 className="text-2xl font-bold">You have a {DRIVER_LABELS[result.driver]} driver</h1>
        {result.detail && <p className="text-slate-600">{result.detail}</p>}
        <div className="flex gap-3">
          <button
            onClick={apply}
            className="rounded bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700"
            data-testid="wizard-apply"
          >
            {buildId ? 'Set it on my bike' : 'Start a bike with this hub'}
          </button>
          <button
            onClick={() => {
              setResult(null)
              setStepId(WIZARD_START)
            }}
            className="rounded border border-slate-300 px-4 py-2 font-semibold text-slate-600"
          >
            Start over
          </button>
        </div>
      </div>
    )
  }

  if (!step) {
    return <Link to="/" className="text-indigo-600 underline">Something went wrong — go home</Link>
  }

  return (
    <div className="mx-auto max-w-xl space-y-4" data-testid="wizard-step">
      <h1 className="text-2xl font-bold">{step.question}</h1>
      {step.help && <p className="text-slate-600">{step.help}</p>}
      {step.showDriverPictures && (
        <div className="flex flex-wrap gap-6 rounded-lg border border-slate-200 bg-white p-4">
          <figure className="text-center">
            <DriverPicture kind="hg" />
            <figcaption className="text-xs text-slate-500">HG splined</figcaption>
          </figure>
          <figure className="text-center">
            <DriverPicture kind="ms" />
            <figcaption className="text-xs text-slate-500">Micro Spline</figcaption>
          </figure>
          <figure className="text-center">
            <DriverPicture kind="xd" />
            <figcaption className="text-xs text-slate-500">XD / XDR</figcaption>
          </figure>
        </div>
      )}
      <div className="space-y-2">
        {step.options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => (opt.result ? finish(opt.result, opt.detail) : setStepId(opt.next!))}
            className="block w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-indigo-300 hover:bg-indigo-50"
          >
            <span className="font-medium">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
