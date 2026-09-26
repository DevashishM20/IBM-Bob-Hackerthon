import type { Issue } from '../types'

interface Props {
  issues: Issue[]
}

/**
 * FilesRanking — top files by issue count, derived from the Issue array.
 */
export default function FilesRanking({ issues }: Props) {
  // Count issues per file
  const counts: Record<string, number> = {}
  for (const issue of issues) {
    const f = issue.file_path ?? '(unknown)'
    counts[f] = (counts[f] ?? 0) + 1
  }

  const ranked = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  if (ranked.length === 0) {
    return <p className="text-sm text-slate-500">No file data available.</p>
  }

  const max = ranked[0][1]

  return (
    <ol className="space-y-2.5">
      {ranked.map(([file, count], idx) => {
        const pct = (count / max) * 100
        const shortName = file.split('/').pop() ?? file
        return (
          <li key={file} className="flex items-center gap-3">
            {/* Rank */}
            <span className="text-[10px] font-mono text-slate-600 w-4 shrink-0 text-right">
              {idx + 1}
            </span>
            {/* File + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-slate-300 font-mono truncate" title={file}>
                  {shortName}
                </span>
                <span className="text-xs font-semibold text-neon-cyan ml-2 shrink-0">{count}</span>
              </div>
              <div className="h-1.5 w-full rounded-full" style={{ background: 'rgba(56,189,248,0.08)' }}>
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #22d3ee, #38bdf8)',
                    boxShadow: '0 0 4px rgba(34,211,238,0.4)',
                    transition: 'width 0.7s ease',
                  }}
                />
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
