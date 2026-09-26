import { useNavigate } from 'react-router-dom'
import UploadForm from '../components/UploadForm'
import Sidebar from '../components/Sidebar'

export default function HomePage() {
  const navigate = useNavigate()

  function handleSessionReady(sessionId: string) {
    navigate(`/results/${sessionId}`)
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#060818' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(56,189,248,0.10)', background: 'rgba(11,15,42,0.8)' }}
        >
          {/* Left: breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="text-neon-blue font-medium">CodeGuardian</span>
            <span>/</span>
            <span>New Analysis</span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neon-blue transition-all"
              style={{ background: 'rgba(56,189,248,0.10)', border: '1px solid rgba(56,189,248,0.25)' }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Analysis
            </button>
            {/* Avatar */}
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-navy-900"
              style={{ background: 'linear-gradient(135deg, #38bdf8, #a78bfa)' }}>
              U
            </div>
          </div>
        </header>

        {/* Hero */}
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg">
            {/* Title */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 text-xs font-medium text-neon-cyan"
                style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse" />
                Static Code Analysis Engine
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Code<span className="text-neon-blue text-glow-blue">Guardian</span>
              </h1>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                Analyse, Improve, Build Better.
                Paste a GitHub URL or upload a ZIP to get a full project health report.
              </p>
            </div>

            {/* Card wrapper */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(15,21,53,0.95), rgba(20,26,66,0.98))',
                border: '1px solid rgba(56,189,248,0.18)',
                boxShadow: '0 0 40px rgba(56,189,248,0.07)',
              }}
            >
              <UploadForm onSessionReady={handleSessionReady} />
            </div>

            {/* Feature hints */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                { icon: '🔍', label: 'Static Analysis' },
                { icon: '🛡️', label: 'Security Checks' },
                { icon: '📊', label: 'Health Scores' },
              ].map((f) => (
                <div key={f.label}
                  className="rounded-lg py-2.5 px-2 text-xs text-slate-400"
                  style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.10)' }}>
                  <span className="block text-base mb-0.5">{f.icon}</span>
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
