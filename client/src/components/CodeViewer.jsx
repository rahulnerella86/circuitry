import { useState, useMemo } from 'react';

const KEYWORD_RE = /\b(void|int|float|double|long|bool|char|byte|String|const|if|else|while|for|return|true|false|HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|nullptr|struct)\b/g;
const TYPE_RE = /\b(int16_t|uint8_t|uint16_t|uint32_t|size_t|unsigned)\b/g;
const KEYWORD_SET = new Set(['void', 'int', 'float', 'if', 'while', 'for', 'return', 'else']);

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightLine(line) {
  const slots = [];

  const wrap = (cls, text) => {
    const id = `\uE000${slots.length}\uE001`;
    slots.push(`<span class="${cls}">${text}</span>`);
    return id;
  };

  let s = escapeHtml(line);

  s = s.replace(/(\/\/.*$)/, (m) => wrap('comment', m));
  s = s.replace(/(\/\*|\*\/)/g, (m) => wrap('comment', m));
  s = s.replace(/("(?:[^"\\]|\\.)*")/g, (m) => wrap('string', m));
  s = s.replace(
    /(#include\s+&lt;[^&]*&gt;|#include\s+"[^"]*"|#define\s+\w+(?:\s+\S+)?)/g,
    (m) => wrap('preprocessor', m),
  );
  s = s.replace(KEYWORD_RE, (m) => wrap('keyword', m));
  s = s.replace(TYPE_RE, (m) => wrap('type', m));
  s = s.replace(/\b(\w+)(\s*)(?=\()/g, (m, fn, sp) => {
    if (KEYWORD_SET.has(fn)) return m;
    return wrap('function', fn) + sp;
  });
  s = s.replace(/\b(\d+\.?\d*)\b/g, (m) => wrap('number', m));

  slots.forEach((html, i) => {
    s = s.replace(`\uE000${i}\uE001`, html);
  });

  return s;
}

/**
 * Syntax-highlight Arduino/C++ code into per-line HTML.
 * Uses placeholders so later passes cannot re-match inside earlier span tags.
 */
function highlightCode(code) {
  if (!code) return [];

  const lines = code.split('\n');
  let inBlockComment = false;

  return lines.map((line) => {
    if (inBlockComment) {
      const html = `<span class="comment">${escapeHtml(line)}</span>`;
      if (line.includes('*/')) inBlockComment = false;
      return html;
    }

    const trimmed = line.trim();

    if (trimmed.startsWith('/*')) {
      const closeIdx = trimmed.indexOf('*/', 2);
      if (closeIdx === -1) inBlockComment = true;
      return `<span class="comment">${escapeHtml(line)}</span>`;
    }

    if (trimmed.startsWith('*') && !trimmed.startsWith('*/')) {
      return `<span class="comment">${escapeHtml(line)}</span>`;
    }

    return highlightLine(line);
  });
}

export default function CodeViewer({ code, platform }) {
  const [copied, setCopied] = useState(false);

  const highlightedLines = useMemo(() => highlightCode(code), [code]);
  const lineCount = highlightedLines.length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLogic = platform === 'logic';
  // platform may be a string (NLM/filter domains) or an object (MCU domain)
  const platformId = typeof platform === 'string' ? platform : (platform?.id || 'code');
  const platformName = typeof platform === 'string' ? platform.toUpperCase() : (platform?.name || 'Arduino');
  const isNLM = platform === 'power' || platform === 'analog' || platform === 'mixed-signal' || platform === 'fpga';

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isLogic ? 'truth_table.txt' : isNLM ? `nlm_${platformId}.txt` : `circuit_${platformId}.ino`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            {isLogic ? 'Truth Table' : 'Generated Code'}
          </h2>
          <p className="text-xs text-ink-400 mt-0.5">
            {lineCount} lines · {isLogic ? 'Logic Gates' : isNLM ? `NLM (${platformName})` : platformName} · {isLogic ? '.txt' : isNLM ? '.txt' : '.ino'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-copy-code"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-ink-50 border border-white/10 text-ink-500 hover:text-ink hover:bg-white/10 transition-all"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            id="btn-download-code"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-ink-50 border border-white/10 text-ink-500 hover:text-ink hover:bg-white/10 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {isLogic ? 'Download .txt' : isNLM ? 'Download .txt' : 'Download .ino'}
          </button>
        </div>
      </div>

      {/* Code Block */}
      <div className="glass-card overflow-hidden rounded-2xl">
        {/* File tab */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-ink-200 bg-ink-50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
          </div>
          <span className="text-xs text-ink-400 ml-2 font-mono">
            {isLogic ? 'truth_table.txt' : isNLM ? `nlm_${platformId}.txt` : `circuit_${platformId}.ino`}
          </span>
        </div>

        {/* Code content — one row per line so gutter and code stay aligned */}
        <div className="code-viewer overflow-x-auto">
          {highlightedLines.map((lineHtml, i) => (
            <div key={i} className="code-line">
              <span className="code-gutter">{i + 1}</span>
              <code
                className="code-line-content"
                dangerouslySetInnerHTML={{ __html: lineHtml || '\u00a0' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
