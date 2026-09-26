import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { AnalysisReport } from '../types'
import { runAnalysis, getResults } from '../api/client'

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [analysing, setAnalysing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    async function fetchReport() {
      setAnalysing(true)
      setError(null)
      try {
        const result = await runAnalysis(sessionId!)
        if (!cancelled) setReport(result)
      } catch {
        try {
          const cached = await getResults(sessionId!)
          if (!cancelled) setReport(cached)
        } catch {
          if (!cancelled) setError('Could not load analysis results. Please try again.')
        }
      } finally {
        if (!cancelled) setAnalysing(false)
      }
    }

    fetchReport()
    return () => { cancelled = true }
  }, [sessionId])

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (analysing) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#060818' }}>
        <div className="text-center space-y-4">
          <div
            className="h-16 w-16 rounded-full mx-auto animate-spin"
            style={{
              background: 'conic-gradient(from 0deg, #38bdf8, #a78bfa, transparent)',
              mask: 'radial-gradient(circle at center, transparent 55%, black 56%)',
              WebkitMask: 'radial-gradient(circle at center, transparent 55%, black 56%)',
            }}
          />
          <p className="text-sm font-semibold text-neon-blue text-glow-blue">Analysing…</p>
          <p className="text-xs text-slate-500">Running static analysis on your project</p>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#060818' }}>
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-3xl">⚠️</div>
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-neon-blue underline hover:no-underline"
          >
            Start a new analysis
          </button>
        </div>
      </div>
    )
  }

  if (!report) return null

  const issues = report.issues

  return (
    <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto" style={{ background: '#060818' }}>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-white mb-1">Code Analysis Results</h1>
      <p className="text-sm text-slate-400 mb-8">
        Problems Found: <span className="text-neon-blue font-semibold">{issues.length}</span>
      </p>

      {/* Issue list */}
      {issues.length === 0 ? (
        <p className="text-sm text-neon-green">No problems found</p>
      ) : (
        <ol className="space-y-5">
          {issues.map((issue, idx) => (
            <li
              key={issue.id}
              className="rounded-xl p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(15,21,53,0.95), rgba(20,26,66,0.98))',
                border: '1px solid rgba(56,189,248,0.12)',
              }}
            >
              <p className="text-sm font-semibold text-white mb-2">
                {idx + 1}. {issue.title}
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                {issue.description}
              </p>
            </li>
          ))}
        </ol>
      )}

      {/* Back button */}
      <div className="mt-10">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg px-4 py-2 text-sm font-medium text-neon-blue transition-all"
          style={{ background: 'rgba(56,189,248,0.10)', border: '1px solid rgba(56,189,248,0.25)' }}
        >
          ← Analyse Another Project
        </button>
      </div>

    </div>
  )
}
