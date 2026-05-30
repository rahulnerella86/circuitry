import { useState } from 'react';

export default function NetlistViewer({ netlist }) {
  const [copied, setCopied] = useState(false);

  if (!netlist) return null;

  const jsonStr = JSON.stringify(netlist, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'netlist.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            Netlist (JSON)
          </h2>
          <p className="text-xs text-ink-400 mt-0.5">
            {netlist.statistics?.totalNets || 0} nets · {netlist.statistics?.totalConnections || 0} connections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-copy-netlist"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-ink-50 border border-white/10 text-ink-500 hover:text-ink hover:bg-white/10 transition-all"
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button
            id="btn-download-netlist"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-ink-50 border border-white/10 text-ink-500 hover:text-ink hover:bg-white/10 transition-all"
          >
            💾 Export JSON
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Nets', value: netlist.statistics?.totalNets || 0, color: 'text-purple-400' },
          { label: 'Connections', value: netlist.statistics?.totalConnections || 0, color: 'text-blue-400' },
          { label: 'Nodes', value: netlist.statistics?.totalNodes || 0, color: 'text-emerald-400' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-ink-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* JSON Viewer */}
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-ink-200 bg-ink-50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
          </div>
          <span className="text-xs text-ink-400 ml-2 font-mono">netlist.json</span>
        </div>
        <pre className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto">
          <code className="text-xs font-mono leading-5 text-ink-400">
            {jsonStr}
          </code>
        </pre>
      </div>
    </div>
  );
}
