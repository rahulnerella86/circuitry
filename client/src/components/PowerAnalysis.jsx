/**
 * PowerAnalysis — Displays power budget, current draw, efficiency, and battery life.
 */
export default function PowerAnalysis({ result }) {
  if (!result) return null;

  const components = result.components || [];
  const powerAnalysis = result.powerAnalysis || {};
  const platform = result.platform || {};

  // Calculate power budget from component current data
  const currentItems = components
    .filter(c => c.current || c.category === 'sensor' || c.category === 'actuator' || c.category === 'display' || c.category === 'communication')
    .map(c => ({
      name: c.name,
      category: c.category,
      typical: c.current?.typical || estimateCurrent(c),
      max: c.current?.max || estimateCurrent(c) * 1.5,
    }));

  const totalTypical = currentItems.reduce((s, i) => s + i.typical, 0);
  const totalMax = currentItems.reduce((s, i) => s + i.max, 0);
  const voltage = platform.operatingVoltage || 5;
  const powerTypical = (voltage * totalTypical / 1000);
  const powerMax = (voltage * totalMax / 1000);

  // Battery life estimates
  const batteries = [
    { name: '9V Alkaline (500mAh)', capacity: 500, voltage: 9 },
    { name: 'LiPo 3.7V (2000mAh)', capacity: 2000, voltage: 3.7 },
    { name: '4×AA (2500mAh)', capacity: 2500, voltage: 6 },
    { name: 'USB Power (∞)', capacity: Infinity, voltage: 5 },
  ];

  function estimateCurrent(comp) {
    const defaults = {
      sensor: 5, actuator: 50, display: 30, communication: 25,
      discrete: 0.1, power: 5, passive: 0,
    };
    return defaults[comp.category] || 1;
  }

  const getCategoryColor = (cat) => {
    const colors = {
      sensor: '#3b82f6', actuator: '#ef4444', display: '#f59e0b',
      communication: '#10b981', power: '#8b5cf6', discrete: '#6b7280',
    };
    return colors[cat] || '#6b7280';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-800/60 border border-ink-200 rounded-xl p-5">
          <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">Total Current (typical)</div>
          <div className="text-2xl font-bold text-ink-700">{totalTypical.toFixed(1)} mA</div>
          <div className="text-xs text-surface-500 mt-1">Max: {totalMax.toFixed(1)} mA</div>
        </div>
        <div className="bg-surface-800/60 border border-ink-200 rounded-xl p-5">
          <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">Power Consumption</div>
          <div className="text-2xl font-bold text-accent-300">{(powerTypical * 1000).toFixed(0)} mW</div>
          <div className="text-xs text-surface-500 mt-1">{powerTypical.toFixed(3)} W at {voltage}V</div>
        </div>
        <div className="bg-surface-800/60 border border-ink-200 rounded-xl p-5">
          <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">Components</div>
          <div className="text-2xl font-bold text-ink">{currentItems.length}</div>
          <div className="text-xs text-surface-500 mt-1">active power consumers</div>
        </div>
      </div>

      {/* Power Analysis from builder (if present) */}
      {powerAnalysis.totalCurrent && (
        <div className="bg-surface-800/40 border border-ink-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">⚡ Builder Analysis</h3>
          <div className="space-y-2 text-sm text-ink-400">
            {powerAnalysis.totalCurrent && <div><span className="text-surface-500">Current: </span>{powerAnalysis.totalCurrent}</div>}
            {powerAnalysis.powerDissipation && <div><span className="text-surface-500">Dissipation: </span>{powerAnalysis.powerDissipation}</div>}
            {powerAnalysis.efficiency && <div><span className="text-surface-500">Efficiency: </span>{powerAnalysis.efficiency}</div>}
            {powerAnalysis.thermalNotes && <div className="mt-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-300 text-xs">{powerAnalysis.thermalNotes}</div>}
            {powerAnalysis.notes && <div className="mt-2 text-xs text-surface-400">{powerAnalysis.notes}</div>}
          </div>
        </div>
      )}

      {/* Current Breakdown Table */}
      {currentItems.length > 0 && (
        <div className="bg-surface-800/40 border border-ink-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-ink-200">
            <h3 className="text-sm font-semibold text-ink">Current Budget Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-surface-400 text-xs uppercase border-b border-ink-200">
                  <th className="text-left px-5 py-2">Component</th>
                  <th className="text-left px-3 py-2">Category</th>
                  <th className="text-right px-3 py-2">Typical (mA)</th>
                  <th className="text-right px-3 py-2">Max (mA)</th>
                  <th className="text-right px-5 py-2">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, i) => (
                  <tr key={i} className="border-b border-ink-200 hover:bg-white/[0.02]">
                    <td className="px-5 py-2.5 text-ink">{item.name}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: getCategoryColor(item.category) + '22', color: getCategoryColor(item.category) }}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-ink-400 font-mono text-xs">{item.typical.toFixed(1)}</td>
                    <td className="px-3 py-2.5 text-right text-ink-400 font-mono text-xs">{item.max.toFixed(1)}</td>
                    <td className="px-5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (item.typical / totalTypical) * 100)}%`, background: getCategoryColor(item.category) }} />
                        </div>
                        <span className="text-xs text-surface-400 font-mono w-10 text-right">{((item.typical / totalTypical) * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-white/[0.03] font-semibold">
                  <td className="px-5 py-2.5 text-ink" colSpan={2}>TOTAL</td>
                  <td className="px-3 py-2.5 text-right text-ink-700 font-mono text-xs">{totalTypical.toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-right text-ink-700 font-mono text-xs">{totalMax.toFixed(1)}</td>
                  <td className="px-5 py-2.5 text-right text-ink-700 font-mono text-xs">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Battery Life Estimations */}
      <div className="bg-surface-800/40 border border-ink-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-ink mb-4">🔋 Battery Life Estimates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {batteries.map((bat, i) => {
            const hours = bat.capacity === Infinity ? Infinity : bat.capacity / totalTypical;
            const days = hours / 24;
            return (
              <div key={i} className="bg-surface-700/40 border border-ink-200 rounded-lg p-4">
                <div className="text-xs text-surface-400 mb-2">{bat.name}</div>
                <div className="text-lg font-bold text-ink">
                  {hours === Infinity ? '∞' : hours < 1 ? `${(hours * 60).toFixed(0)} min` : hours < 24 ? `${hours.toFixed(1)} hrs` : `${days.toFixed(1)} days`}
                </div>
                <div className="text-xs text-surface-500">
                  {bat.capacity === Infinity ? 'Unlimited' : `${bat.capacity}mAh @ ${totalTypical.toFixed(0)}mA`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
