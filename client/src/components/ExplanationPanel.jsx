export default function ExplanationPanel({ explanation, validation }) {
  if (!explanation && !validation) return null;

  return (
    <div className="space-y-6">
      {/* Explanation */}
      {explanation && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            How It Works
          </h2>
          <div className="glass-card p-6 rounded-2xl">
            <div className="prose  prose-sm max-w-none">
              {explanation.split('\n').map((line, idx) => {
                if (line.startsWith('## ')) {
                  return <h2 key={idx} className="text-xl font-bold text-ink mt-4 mb-2">{line.replace('## ', '')}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={idx} className="text-base font-semibold text-ink-700 mt-4 mb-2">{line.replace('### ', '')}</h3>;
                }
                if (line.startsWith('- **')) {
                  const match = line.match(/^- \*\*(.*?)\*\*:\s*(.*)$/);
                  if (match) {
                    return (
                      <div key={idx} className="flex gap-3 py-1.5">
                        <span className="text-ink-700 mt-1 flex-shrink-0">•</span>
                        <div>
                          <span className="font-semibold text-ink">{match[1]}</span>
                          <span className="text-ink-500">: {match[2]}</span>
                        </div>
                      </div>
                    );
                  }
                }
                if (line.trim() === '') return <br key={idx} />;
                return <p key={idx} className="text-ink-400 leading-relaxed">{line}</p>;
              })}
            </div>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {validation && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${validation.valid ? 'bg-green-400' : 'bg-red-400'}`}></span>
            Validation Results
          </h2>

          {/* Summary */}
          <div className={`glass-card p-4 rounded-2xl border ${
            validation.valid ? 'border-green-500/20' : 'border-red-500/20'
          }`}>
            <p className="text-sm font-medium">{validation.summary}</p>
          </div>

          {/* Errors */}
          {validation.errors?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-red-400 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Errors ({validation.errors.length})
              </h3>
              {validation.errors.map((err, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                  {err}
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {validation.warnings?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Warnings ({validation.warnings.length})
              </h3>
              {validation.warnings.map((warn, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-ink text-sm">
                  {warn}
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          {validation.info?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Notes ({validation.info.length})
              </h3>
              {validation.info.map((note, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
                  {note}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
