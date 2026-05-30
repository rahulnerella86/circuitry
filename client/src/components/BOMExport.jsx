import { useState } from 'react';

/**
 * BOMExport — Displays the Bill of Materials and handles CSV/JSON export.
 */
export default function BOMExport({ result }) {
  const [copied, setCopied] = useState(false);

  if (!result || !result.components) return null;

  const components = result.components;

  // Group components by type, value, and part number to aggregate quantities
  const groupedBOM = components.reduce((acc, comp) => {
    const key = `${comp.type}_${comp.value}_${comp.partNumber || ''}`;
    if (!acc[key]) {
      acc[key] = {
        name: comp.name,
        type: comp.type,
        category: comp.category,
        value: comp.value,
        partNumber: comp.partNumber,
        designators: [comp.id],
        quantity: comp.quantity || 1,
      };
    } else {
      acc[key].designators.push(comp.id);
      acc[key].quantity += (comp.quantity || 1);
      // Ensure name is general enough if they differ slightly
    }
    return acc;
  }, {});

  const bomItems = Object.values(groupedBOM).sort((a, b) => a.category.localeCompare(b.category) || a.type.localeCompare(b.type));

  const downloadCSV = () => {
    const headers = ['Designators', 'Quantity', 'Category', 'Type', 'Value', 'Part Number', 'Description'];
    const rows = bomItems.map(item => [
      `"${item.designators.join(', ')}"`,
      item.quantity,
      item.category,
      item.type,
      `"${item.value}"`,
      `"${item.partNumber || ''}"`,
      `"${item.name}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bom_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const copyToClipboard = () => {
    const text = bomItems.map(item => `${item.designators.join(', ')}\t${item.quantity}\t${item.category}\t${item.value}\t${item.partNumber || ''}`).join('\n');
    const header = `Designators\tQuantity\tCategory\tValue\tPart Number\n`;
    navigator.clipboard.writeText(header + text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between bg-surface-800/40 border border-ink-200 p-4 rounded-xl">
        <div>
          <h3 className="text-sm font-semibold text-ink">Bill of Materials</h3>
          <p className="text-xs text-surface-400 mt-1">{bomItems.length} unique parts, {bomItems.reduce((s, i) => s + i.quantity, 0)} total components</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={copyToClipboard}
            className="px-3 py-1.5 bg-surface-700 hover:bg-surface-600 text-ink text-xs font-medium rounded-lg transition-colors border border-white/10"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button 
            onClick={downloadCSV}
            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-ink text-xs font-medium rounded-lg transition-colors shadow-sm"
          >
            Download CSV
          </button>
        </div>
      </div>

      <div className="bg-surface-800/60 border border-ink-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-ink-100/50 text-surface-400 text-xs uppercase border-b border-white/10">
                <th className="px-4 py-3 font-semibold">Item / Value</th>
                <th className="px-4 py-3 font-semibold">Part Number</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold text-center">Qty</th>
                <th className="px-4 py-3 font-semibold">Designators</th>
              </tr>
            </thead>
            <tbody>
              {bomItems.map((item, i) => (
                <tr key={i} className="border-b border-ink-200 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{item.value}</div>
                    <div className="text-xs text-surface-400 mt-0.5">{item.name}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-700">
                    {item.partNumber || <span className="text-surface-600 italic">Generic</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-ink-400 capitalize">{item.category}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-ink">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-400 break-words max-w-[200px]">
                    {item.designators.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
        <div className="text-blue-400 mt-0.5">ℹ️</div>
        <div>
          <h4 className="text-sm font-medium text-blue-300">Ordering Components</h4>
          <p className="text-xs text-blue-200/70 mt-1 leading-relaxed">
            Verify all component values and part numbers before ordering. Generic components (like resistors or capacitors) 
            can be replaced with any part matching the specified value, voltage rating, and package size.
          </p>
        </div>
      </div>
    </div>
  );
}
