import React, { useState } from 'react'
import { analyzeUrl, analyzeUpload } from '../api/client'

interface Props {
  onSessionReady: (sessionId: string) => void
}

type Mode = 'url' | 'zip'

const inputClass = [
  'w-full rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500',
  'bg-navy-800 border border-neon-blue/20 focus:border-neon-blue/60',
  'focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors',
].join(' ')

export default function UploadForm({ onSessionReady }: Props) {
  const [mode, setMode] = useState<Mode>('url')
  const [githubUrl, setGithubUrl] = useState('')
  const [projectName, setProjectName] = useState('')
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      let result
      if (mode === 'url') {
        if (!githubUrl.trim()) throw new Error('Please enter a GitHub URL.')
        result = await analyzeUrl(githubUrl.trim(), projectName.trim() || 'My Project')
      } else {
        if (!zipFile) throw new Error('Please select a ZIP file.')
        result = await analyzeUpload(zipFile)
      }
      onSessionReady(result.session_id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">

      {/* Mode switcher */}
      <div className="flex rounded-lg p-1" style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}>
        {(['url', 'zip'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null) }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all duration-150 ${
              mode === m
                ? 'bg-neon-blue/20 text-neon-blue shadow-sm border border-neon-blue/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {m === 'url' ? '⎇  GitHub URL' : '⬆  ZIP Upload'}
          </button>
        ))}
      </div>

      {/* URL inputs */}
      {mode === 'url' && (
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </span>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              required
              className={`${inputClass} pl-9`}
            />
          </div>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name (optional)"
            className={inputClass}
          />
        </div>
      )}

      {/* ZIP input */}
      {mode === 'zip' && (
        <div
          className="rounded-lg border-2 border-dashed border-neon-blue/20 p-6 text-center cursor-pointer hover:border-neon-blue/40 transition-colors"
          style={{ background: 'rgba(56,189,248,0.03)' }}
        >
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
            className="hidden"
            id="zip-upload"
          />
          <label htmlFor="zip-upload" className="cursor-pointer">
            <svg className="mx-auto h-8 w-8 text-neon-blue/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {zipFile ? (
              <p className="text-sm text-neon-cyan">{zipFile.name}</p>
            ) : (
              <p className="text-sm text-slate-500">Click to select a <span className="text-neon-blue">ZIP file</span></p>
            )}
          </label>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg px-3 py-2 text-sm text-red-400" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="relative w-full rounded-lg py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
        style={{
          background: loading ? 'rgba(56,189,248,0.15)' : 'linear-gradient(135deg, rgba(56,189,248,0.25), rgba(167,139,250,0.25))',
          border: '1px solid rgba(56,189,248,0.35)',
          boxShadow: loading ? 'none' : '0 0 20px rgba(56,189,248,0.15)',
        }}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Cloning &amp; preparing…
            </>
          ) : (
            <>
              <svg className="h-4 w-4 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Analyse Project
            </>
          )}
        </span>
      </button>
    </form>
  )
}
