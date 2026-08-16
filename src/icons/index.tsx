import type { ComponentCategory } from '../domain/constants'
import type { Part } from '../domain/types'

export function brandColor(brand: string): string {
  const b = brand.toLowerCase()
  if (b === 'shimano') return 'var(--color-shimano)'
  if (b === 'sram') return 'var(--color-sram)'
  return '#475569'
}

interface IconProps {
  color: string
  className?: string
}

function CassetteIcon({ color, className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      {[26, 21, 16, 11].map((r, i) => (
        <circle key={r} cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth={i === 0 ? 3 : 2} strokeDasharray={`${r * 0.9} ${r * 0.28}`} />
      ))}
      <circle cx="32" cy="32" r="5" fill={color} />
    </svg>
  )
}

function DerailleurIcon({ color, className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="20" y="6" width="18" height="12" rx="3" fill={color} />
      <path d="M29 18 L29 30 L24 44" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="24" cy="46" r="8" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="38" cy="56" r="6" fill="none" stroke={color} strokeWidth="3" />
      <path d="M30 50 L34 53" stroke={color} strokeWidth="3" />
    </svg>
  )
}

function ShifterIcon({ color, className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="8" y="26" width="48" height="10" rx="5" fill="none" stroke={color} strokeWidth="3" />
      <rect x="22" y="30" width="16" height="14" rx="3" fill={color} />
      <path d="M30 44 L22 58 L40 58 Z" fill={color} opacity="0.75" />
    </svg>
  )
}

function ChainIcon({ color, className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      {[8, 24, 40].map((x, i) => (
        <rect key={x} x={x} y={i % 2 ? 30 : 24} width="18" height="12" rx="6" fill="none" stroke={color} strokeWidth="3" />
      ))}
    </svg>
  )
}

function CrankIcon({ color, className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="26" cy="34" r="20" fill="none" stroke={color} strokeWidth="3" strokeDasharray="4 3" />
      <circle cx="26" cy="34" r="6" fill={color} />
      <path d="M26 34 L52 12" stroke={color} strokeWidth="6" strokeLinecap="round" />
      <circle cx="52" cy="12" r="4" fill={color} />
    </svg>
  )
}

function HubIcon({ color, className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="10" y="24" width="28" height="16" rx="4" fill="none" stroke={color} strokeWidth="3" />
      {[14, 19, 24, 29, 34].map((x) => (
        <line key={x} x1={x} y1="24" x2={x} y2="40" stroke={color} strokeWidth="1.5" />
      ))}
      <rect x="40" y="20" width="14" height="24" rx="3" fill={color} opacity="0.85" />
    </svg>
  )
}

const ICONS: Record<ComponentCategory, (p: IconProps) => React.JSX.Element> = {
  cassette: CassetteIcon,
  rearDerailleur: DerailleurIcon,
  shifter: ShifterIcon,
  chain: ChainIcon,
  crankset: CrankIcon,
  rearHub: HubIcon,
}

export function PartIcon({ part, className }: { part: Pick<Part, 'category' | 'brand' | 'imageUrl'>; className?: string }) {
  if (part.imageUrl) {
    return <img src={part.imageUrl} alt="" className={`${className ?? ''} object-contain`} />
  }
  const Icon = ICONS[part.category]
  return <Icon color={brandColor(part.brand)} className={className} />
}

export function CategoryIcon({ category, className }: { category: ComponentCategory; className?: string }) {
  const Icon = ICONS[category]
  return <Icon color="#94a3b8" className={className} />
}
