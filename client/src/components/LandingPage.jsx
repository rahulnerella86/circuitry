export default function LandingPage() {
  const scrollToApp = () => {
    document.getElementById('main-app')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-white text-ink flex flex-col items-center justify-center">
      {/* Subtle grid background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23000' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main Hero Content */}
      <div className="z-10 flex flex-col items-center text-center animate-fade-in space-y-6 max-w-3xl px-4">
        {/* Logo mark */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-ink-900 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
            </svg>
          </div>
          <span className="font-mono text-sm font-bold tracking-wider uppercase">
            CIRCUITRY
          </span>
        </div>

        <h1 className="font-mono text-4xl md:text-6xl font-bold tracking-tight uppercase leading-[1.1]">
          What do you want<br />to build?
        </h1>

        <p className="text-lg text-ink-500 max-w-xl">
          Design electronic circuits, generate wiring diagrams, bills of materials, and build instructions — all rule-based, no AI required.
        </p>

        {/* Quick action prompt-style bar */}
        <div className="w-full max-w-xl mt-6">
          <div className="border-2 border-ink-200 rounded flex items-center overflow-hidden hover:border-ink-400 transition-colors">
            <input
              type="text"
              placeholder="Describe your circuit project..."
              className="flex-1 px-5 py-4 text-base font-mono bg-transparent outline-none placeholder:text-ink-300"
              onFocus={scrollToApp}
              readOnly
            />
            <button
              onClick={scrollToApp}
              className="px-5 py-4 bg-ink-900 text-white hover:bg-ink-700 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3 mt-3 justify-center">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-400">
              ◉ Domains:
            </span>
            {['MCU', 'Logic', 'Analog', 'DSP', 'Power'].map(tag => (
              <button
                key={tag}
                onClick={scrollToApp}
                className="px-3 py-1 border border-ink-200 text-[11px] font-mono font-bold uppercase tracking-wider text-ink-600 hover:border-ink-900 hover:text-ink-900 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center cursor-pointer" onClick={scrollToApp}>
        <span className="font-mono text-[10px] font-bold text-ink-400 mb-2 tracking-[0.15em] uppercase">
          Start Building
        </span>
        <div className="w-8 h-8 border-2 border-ink-300 rounded-full flex items-center justify-center animate-bounce hover:border-ink-900 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-500">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  );
}
