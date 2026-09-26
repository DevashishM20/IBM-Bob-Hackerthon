import { useEffect, useRef } from 'react'
import type { Issue, Severity } from '../types'

interface Props {
  issue: Issue
  sessionId: string
  onClose: () => void
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  medium:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  low:      'bg-blue-100 text-blue-700 border-blue-200',
  info:     'bg-gray-100 text-gray-600 border-gray-200',
}

// ── Priority recommendation — derived purely from severity ────────────────────

interface PriorityInfo {
  label: string
  action: string
  style: string
}

const PRIORITY_MAP: Record<Severity, PriorityInfo> = {
  critical: {
    label:  'Fix immediately',
    action: 'This issue poses an active security or critical risk. It should be resolved before any further code is shipped.',
    style:  'border-l-4 border-red-500 bg-red-50 text-red-800',
  },
  high: {
    label:  'Fix before release',
    action: 'This issue is significant and should be resolved before the next production deployment.',
    style:  'border-l-4 border-orange-500 bg-orange-50 text-orange-800',
  },
  medium: {
    label:  'Fix soon',
    action: 'Address this issue in the current sprint or next planned refactor. It will worsen over time if left unattended.',
    style:  'border-l-4 border-yellow-500 bg-yellow-50 text-yellow-800',
  },
  low: {
    label:  'Fix when convenient',
    action: 'Low urgency. Address during routine maintenance or the next code-quality pass.',
    style:  'border-l-4 border-blue-400 bg-blue-50 text-blue-800',
  },
  info: {
    label:  'Informational',
    action: 'No immediate action required. Review at your discretion.',
    style:  'border-l-4 border-gray-300 bg-gray-50 text-gray-700',
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  code_quality:    'Code Quality',
  security:        'Security',
  testing:         'Testing',
  maintainability: 'Maintainability',
}

const CATEGORY_STYLES: Record<string, string> = {
  code_quality:    'bg-purple-100 text-purple-700',
  security:        'bg-red-100 text-red-700',
  testing:         'bg-green-100 text-green-700',
  maintainability: 'bg-blue-100 text-blue-700',
}

/**
 * IssueDetail — slide-in drawer panel for a selected issue.
 *
 * Displays:
 *   title, severity badge, category badge, priority banner,
 *   file path + line numbers, description, suggested_fix (when present).
 *
 * Closes on: close button, backdrop click (ResultsPage), Escape key.
 */
export default function IssueDetail({ issue, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Focus the panel when it opens so keyboard navigation works
  useEffect(() => {
    panelRef.current?.focus()
  }, [issue.id])

  const locationParts: string[] = []
  if (issue.file_path) locationParts.push(issue.file_path)
  if (issue.line_start != null) {
    const lineRange = issue.line_end != null && issue.line_end !== issue.line_start
      ? `lines ${issue.line_start}–${issue.line_end}`
      : `line ${issue.line_start}`
    locationParts.push(lineRange)
  }
  const location = locationParts.join(' · ')

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      className="flex h-full flex-col outline-none"
    >
      {/* Panel header */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900 leading-snug pr-2">
          {issue.title}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close issue detail"
          className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* Severity + Category badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SEVERITY_STYLES[issue.severity] ?? 'bg-gray-100 text-gray-600'}`}>
            {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLES[issue.category] ?? 'bg-gray-100 text-gray-600'}`}>
            {CATEGORY_LABELS[issue.category] ?? issue.category}
          </span>
        </div>

        {/* Priority banner */}
        {(() => {
          const p = PRIORITY_MAP[issue.severity]
          return (
            <div className={`rounded-md px-3 py-2.5 ${p.style}`}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-0.5">{p.label}</p>
              <p className="text-xs leading-relaxed">{p.action}</p>
            </div>
          )
        })()}

        {/* File location */}
        {location && (
          <div className="flex items-center gap-1.5 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600 font-mono">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{location}</span>
          </div>
        )}

        {/* Description — why it matters */}
        <section>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Why it matters
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">{issue.description}</p>
        </section>

        {/* How to fix it — shown when static analyzer provides a fix hint */}
        {issue.suggested_fix && (
          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
              How to fix it
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">{issue.suggested_fix}</p>
          </section>
        )}

      </div>
    </div>
  )
}
