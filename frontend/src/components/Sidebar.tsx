import { useNavigate } from 'react-router-dom'

interface Props {
  projectName?: string
  repoLabel?: string
  analyzed?: boolean
}

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Repositories',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
  {
    label: 'Analysis History',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
]

export default function Sidebar({ projectName, repoLabel, analyzed }: Props) {
  const navigate = useNavigate()

  return (
    <aside
      className="hidden md:flex flex-col w-60 shrink-0 min-h-screen"
      style={{
        background: 'linear-gradient(180deg, #0b0f2a 0%, #060818 100%)',
        borderRight: '1px solid rgba(56,189,248,0.10)',
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          {/* Shield icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-blue/10 border border-neon-blue/30">
            <svg className="h-4 w-4 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">CodeGuardian</p>
            <p className="text-[10px] text-neon-blue/70 leading-tight tracking-wide">Analyze · Improve · Build</p>
          </div>
        </div>
      </div>

      {/* Repo pill */}
      {repoLabel && (
        <div className="mx-4 mb-4 rounded-lg px-3 py-2.5" style={{ background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.18)' }}>
          <div className="flex items-center gap-2">
            {/* GitHub icon */}
            <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span className="text-xs text-slate-300 truncate font-mono">{repoLabel}</span>
          </div>
          {analyzed && (
            <div className="mt-1.5 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
              <span className="text-[10px] text-neon-green font-medium">Analyzed</span>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 mb-3 h-px" style={{ background: 'rgba(56,189,248,0.10)' }} />

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item, i) => (
          <button
            key={item.label}
            onClick={() => { if (item.label === 'Dashboard' || item.label === 'Repositories') navigate('/') }}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 group ${
              i === 0
                ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span className={i === 0 ? 'text-neon-blue' : 'text-slate-500 group-hover:text-slate-300'}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom — project name */}
      {projectName && (
        <div className="mx-4 mb-5 rounded-lg px-3 py-2.5" style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.15)' }}>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">Active Project</p>
          <p className="text-xs text-neon-purple truncate font-medium">{projectName}</p>
        </div>
      )}
    </aside>
  )
}
