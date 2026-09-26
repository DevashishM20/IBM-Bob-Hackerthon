import type { Issue } from '../types'

interface Props {
  issues: Issue[]
}

/** Neon colour per severity */
const SEV_COLOUR: Record<string, string> = {
  critical: '#f87171',
  high:     '#fb923c',
  medium:   '#fbbf24',
  low:      '#38bdf8',
  info:     '#94a3b8',
}

const SEV_LABEL: Record<string, string> = {
  critical: 'Critical',
  high:     'High',
  medium:   'Medium',
  low:      'Low',
  info:     'Info',
}

/**
 * DonutChart — SVG donut showing issue distribution by severity.
 * Works entirely from the passed Issue array; no hardcoded values.
 */
export default function DonutChart({ issues }: Props) {
  const ORDER = ['critical', 'high', 'medium', 'low', 'info']
  const total = issues.length

  // Count per severity
  const counts = ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = issues.filter((i) => i.severity === s).length
    return acc
  }, {})

  // Only render severities that have at least one issue
  const slices = ORDER.filter((s) => counts[s] > 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-500">
        No issues found
      </div>
    )
  }

  // SVG donut math
  const R = 60
  const STROKE = 18
  const cx = 90
  const cy = 90
  const circumference = 2 * Math.PI * R
  let offset = 0

  const segments = slices.map((s) => {
    const pct = counts[s] / total
    const dash = pct * circumference
    const seg = { sev: s, dash, gap: circumference - dash, offset, pct }
    offset += dash
    return seg
  })

  return (
    <div className="flex items-center gap-6">
      {/* SVG donut */}
      <div className="relative shrink-0">
        <svg width="180" height="180" viewBox="0 0 180 180">
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke="rgba(56,189,248,0.08)"
            strokeWidth={STROKE}
          />
          {segments.map((seg) => (
            <circle
              key={seg.sev}
              cx={cx} cy={cy} r={R}
              fill="none"
              stroke={SEV_COLOUR[seg.sev]}
              strokeWidth={STROKE}
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={-seg.offset + circumference / 4}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-white text-glow-blue">{total}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">Total</span>
        </div>
      </div>

      {/* Legend */}
      <ul className="space-y-2">
        {slices.map((s) => (
          <li key={s} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: SEV_COLOUR[s] }} />
            <span className="text-xs text-slate-300 w-14">{SEV_LABEL[s]}</span>
            <span className="text-xs font-mono font-semibold" style={{ color: SEV_COLOUR[s] }}>
              {counts[s]}
            </span>
            <span className="text-xs text-slate-500">
              ({Math.round((counts[s] / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
