import type { CategoryScore } from '../types'

interface Props {
  scores: CategoryScore[]
}

const CATEGORY_LABELS: Record<string, string> = {
  code_quality:    'Code Quality',
  security:        'Security',
  testing:         'Testing',
  maintainability: 'Maintainability',
}

const CATEGORY_ICONS: Record<string, string> = {
  code_quality:    '{}',
  security:        '🔒',
  testing:         '✓',
  maintainability: '⚙',
}

/** Return a Tailwind bg colour class based on the 0–100 score. */
function scoreColour(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-400'
  return 'bg-red-500'
}

/** Return a muted text colour for the score number itself. */
function scoreTextColour(score: number): string {
  if (score >= 80) return 'text-green-700'
  if (score >= 60) return 'text-yellow-700'
  return 'text-red-700'
}

/**
 * HealthDashboard — displays one score card per category with a
 * coloured progress bar indicating health at a glance.
 */
export default function HealthDashboard({ scores }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {scores.map((s) => (
        <div key={s.category} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {CATEGORY_ICONS[s.category]} {CATEGORY_LABELS[s.category] ?? s.category}
          </p>
          <p className={`mt-1 text-4xl font-bold ${scoreTextColour(s.score)}`}>
            {s.score}
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${scoreColour(s.score)}`}
              style={{ width: `${s.score}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {s.issue_count === 0 ? 'No issues' : `${s.issue_count} issue${s.issue_count > 1 ? 's' : ''}`}
          </p>
        </div>
      ))}
    </div>
  )
}
