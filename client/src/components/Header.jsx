export default function Header({ onShowProjects, onReset, hasResult }) {
  return (
    <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-ink-200 bg-white sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-8 h-8 bg-ink-900 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
          </svg>
        </div>
        <h1 className="font-mono text-sm font-bold tracking-wider uppercase">
          CIRCUITRY
        </h1>
        <span className="hidden sm:inline-block text-[11px] font-mono text-ink-400 tracking-wider">
          Rule-Based Generator
        </span>
      </div>

      <nav className="flex items-center gap-1">
        <button
          onClick={() => {
            document.getElementById('root')?.scrollIntoView({ behavior: 'smooth' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Home
        </button>

        <button
          id="btn-projects"
          onClick={onShowProjects}
          className="flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Projects
        </button>

        {hasResult && (
          <button
            id="btn-new-circuit"
            onClick={onReset}
            className="flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider bg-ink-900 text-white hover:bg-ink-700 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New
          </button>
        )}
      </nav>
    </header>
  );
}
