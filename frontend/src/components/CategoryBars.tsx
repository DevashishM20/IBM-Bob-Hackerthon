import type { Issue } from '../types'

interface Props {
  issues: Issue[]
}

const CATEGORY_LABELS: Record<string, string> = {
  security:        'Security',
  code_quality:    'Code Quality',
  testing:         'Testing',
  maintainability: 'Maintainability',
}

const CATEGORY_COLOUR: Record<string, string> = {
  security:        '#f87171',
  code_quality:    '#a78bfa',
  testing:         '#34d399',
  maintainability: '#38bdf8',
}

const ORDER = ['security', 'code_quality', 'maintainability', 'testing']

/**
 * CategoryBars — horizontal bar chart for issue count per category.
 * Derived entirely from the passed Issue array.
 */
export default function CategoryBars({ issues }: Props) {
  const counts = ORDER.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = issues.filter((i) => i.category === cat).length
    return acc
  }, {})

  const max = Math.max(...Object.values(counts), 1)

  return (
    <div className="space-y-3">
      {ORDER.map((cat) => {
        const count = counts[cat]
        const pct = (count / max) * 100
        return (
          <div key={cat}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-300">{CATEGORY_LABELS[cat]}</span>
              <span className="text-xs font-mono font-semibold" style={{ color: CATEGORY_COLOUR[cat] }}>
                {count}
              </span>
            </div>
            <div className="h-2 w-full rounded-full" style={{ background: 'rgba(56,189,248,0.08)' }}>
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${CATEGORY_COLOUR[cat]}, ${CATEGORY_COLOUR[cat]}99)`,
                  boxShadow: `0 0 6px ${CATEGORY_COLOUR[cat]}55`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
