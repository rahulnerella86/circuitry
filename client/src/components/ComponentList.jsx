import { useState } from 'react';

export default function ComponentList({ result }) {
  const [prices, setPrices] = useState({});

  if (!result) return null;

  const userComponents = result.components.filter(c => c.category !== 'passive');
  const passiveComponents = result.components.filter(c => c.category === 'passive');

  const handlePriceChange = (id, value) => {
    const num = parseFloat(value);
    setPrices(prev => ({
      ...prev,
      [id]: isNaN(num) ? '' : num
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    result.components.forEach((comp, idx) => {
      const id = comp.id || `comp_${idx}`;
      const price = parseFloat(prices[id]) || 0;
      total += price * (comp.quantity || 1);
    });
    return total;
  };

  const categoryColors = {
    sensor: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    actuator: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
    display: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    communication: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    passive: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Bill of Materials
          </h2>
          <p className="text-xs text-ink-400 mt-0.5">
            {result.components.length} total components ({userComponents.length} main + {passiveComponents.length} supporting)
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-400 uppercase tracking-wider font-semibold mb-1">Estimated Total</p>
          <p className="text-2xl font-bold text-ink-900">${calculateTotal().toFixed(2)}</p>
        </div>
      </div>

      {/* Main Components Table */}
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="px-4 py-3 border-b border-ink-200">
          <h3 className="text-sm font-semibold text-ink">Main Components</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Component</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Qty</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Value</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Voltage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Pin Assignment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Unit Price $</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Total $</th>
              </tr>
            </thead>
            <tbody>
              {userComponents.map((comp, idx) => {
                const colors = categoryColors[comp.category] || categoryColors.passive;
                const assignment = result.pinAssignments?.find(a => a.componentId === comp.id);
                const id = comp.id || `comp_main_${idx}`;
                const unitPrice = prices[id] === undefined ? '' : prices[id];
                const total = (parseFloat(unitPrice) || 0) * (comp.quantity || 1);

                return (
                  <tr key={id} className="border-b border-ink-100 hover:bg-ink-50/[0.02] transition-colors">
                    <td className="px-4 py-3 text-ink-500 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{comp.name}</div>
                      {comp.type && (
                        <div className="text-xs text-ink-400 mt-0.5">{comp.type}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {comp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink font-medium">{comp.quantity || 1}</td>
                    <td className="px-4 py-3">
                      <span className="px-1.5 py-0.5 rounded bg-ink-50 text-ink-400 text-xs font-mono">
                        {comp.value || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {comp.voltage ? (
                        <span className="text-ink-400">
                           {comp.voltage.typical || comp.voltage.min}V
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {assignment ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(assignment.pins).map(([name, info]) => (
                            info?.pinId && (
                              <span key={name} className="px-1.5 py-0.5 rounded bg-primary-500/10 text-ink-700 text-[10px] font-mono border border-primary-500/20">
                                {name}→{info.pinId}
                              </span>
                            )
                          ))}
                        </div>
                      ) : (
                        <span className="text-ink-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-20 px-2 py-1 text-xs border border-ink-200 rounded bg-ink-50 text-ink focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                        value={unitPrice}
                        onChange={(e) => handlePriceChange(id, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3 text-ink font-medium">
                      {total > 0 ? total.toFixed(2) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supporting Components */}
      {passiveComponents.length > 0 && (
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="px-4 py-3 border-b border-ink-200">
            <h3 className="text-sm font-semibold text-ink">Supporting Components</h3>
            <p className="text-xs text-ink-400 mt-0.5">Resistors, capacitors, drivers, and protection circuits</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Component</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Value</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Qty</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Purpose</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Unit Price $</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Total $</th>
                </tr>
              </thead>
              <tbody>
                {passiveComponents.map((comp, idx) => {
                  const id = comp.id || `comp_passive_${idx}`;
                  const unitPrice = prices[id] === undefined ? '' : prices[id];
                  const total = (parseFloat(unitPrice) || 0) * (comp.quantity || 1);

                  return (
                    <tr key={id} className="border-b border-ink-100 hover:bg-ink-50/[0.02] transition-colors">
                      <td className="px-4 py-3 text-ink font-medium text-xs">{comp.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-1.5 py-0.5 rounded bg-ink-50 text-ink-400 text-xs font-mono">
                          {comp.value || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink text-xs">{comp.quantity || 1}</td>
                      <td className="px-4 py-3 text-ink-500 text-xs">{comp.purpose || '—'}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="w-20 px-2 py-1 text-xs border border-ink-200 rounded bg-ink-50 text-ink focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                          value={unitPrice}
                          onChange={(e) => handlePriceChange(id, e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3 text-ink font-medium">
                        {total > 0 ? total.toFixed(2) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
