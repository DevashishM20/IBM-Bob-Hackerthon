import type { Issue } from '../types'

interface Props {
  issues: Issue[]
  selectedId: string | null
  onSelect: (id: string) => void
  /** Message shown when the issues array is empty. */
  emptyMessage?: string
}

const SEVERITY_COLOURS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-yellow-100 text-yellow-700',
  low:      'bg-blue-100 text-blue-700',
  info:     'bg-gray-100 text-gray-600',
}

/**
 * IssueList — scrollable sidebar listing flagged issues.
 * Clicking an issue raises onSelect so ResultsPage can update IssueDetail.
 * When the list is empty, renders an emptyMessage paragraph instead.
 */
export default function IssueList({ issues, selectedId, onSelect, emptyMessage }: Props) {
  if (issues.length === 0) {
    return (
      <p className="p-4 text-sm text-gray-400">
        {emptyMessage ?? 'No issues.'}
      </p>
    )
  }

  return (
    <ul className="divide-y divide-gray-100 overflow-y-auto max-h-[60vh]">
      {issues.map((issue) => (
        <li
          key={issue.id}
          onClick={() => onSelect(issue.id)}
          className={`cursor-pointer p-3 hover:bg-gray-50 ${
            issue.id === selectedId ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-gray-800 truncate">{issue.title}</span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                SEVERITY_COLOURS[issue.severity] ?? ''
              }`}
            >
              {issue.severity}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-400 truncate">{issue.file_path ?? 'unknown file'}</p>
        </li>
      ))}
    </ul>
  )
}
