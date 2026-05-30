import { useState, useMemo } from 'react';

/**
 * Instructions component — Blueprint.am-style build guide with
 * checklist steps, tools & assumptions, and progress tracking.
 */
export default function Instructions({ result }) {
  const [checked, setChecked] = useState({});

  const toggleCheck = (id) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Generate build instructions from result data
  const buildSteps = useMemo(() => {
    if (!result) return [];

    const steps = [];
    const isMCU = result.platform && typeof result.platform === 'object';

    if (isMCU) {
      // Phase 1: Gather
      const gatherItems = [];
      gatherItems.push({ id: 'g1', text: `Obtain ${result.platform.name} board`, parts: 1 });
      (result.components || []).forEach((c, i) => {
        if (c.category !== 'passive') {
          gatherItems.push({ id: `g${i + 2}`, text: `Obtain ${c.name}${c.quantity > 1 ? ` (×${c.quantity})` : ''}`, parts: c.quantity || 1 });
        }
      });
      const passives = (result.components || []).filter(c => c.category === 'passive');
      if (passives.length > 0) {
        gatherItems.push({ id: 'gp', text: `Gather ${passives.length} supporting components (resistors, capacitors, etc.)`, parts: passives.length });
      }
      steps.push({ phase: 'Gather', icon: '📦', items: gatherItems });

      // Phase 2: Wire
      const wireItems = [];
      wireItems.push({ id: 'w0', text: 'Set up breadboard or PCB with power rails', parts: 1 });
      (result.pinAssignments || []).forEach((assignment, i) => {
        const comp = (result.components || []).find(c => c.id === assignment.componentId);
        const pinCount = Object.keys(assignment.pins || {}).length;
        wireItems.push({
          id: `w${i + 1}`,
          text: `Wire ${comp?.name || assignment.componentId} to ${result.platform.name}`,
          parts: pinCount,
        });
      });
      wireItems.push({ id: 'wg', text: 'Connect all ground (GND) lines', parts: 1 });
      wireItems.push({ id: 'wv', text: `Connect power (${result.platform.operatingVoltage}V) lines`, parts: 1 });
      steps.push({ phase: 'Wire', icon: '🔌', items: wireItems });

      // Phase 3: Program
      const progItems = [];
      progItems.push({ id: 'p1', text: `Install ${result.platform.name} board package in Arduino IDE`, parts: 0 });
      progItems.push({ id: 'p2', text: 'Install required libraries (see Code tab)', parts: 0 });
      progItems.push({ id: 'p3', text: 'Upload generated code to board', parts: 0 });
      progItems.push({ id: 'p4', text: 'Open Serial Monitor and verify output', parts: 0 });
      steps.push({ phase: 'Program', icon: '💻', items: progItems });

      // Phase 4: Test
      const testItems = [];
      testItems.push({ id: 't1', text: 'Verify power LED on board', parts: 0 });
      testItems.push({ id: 't2', text: 'Check sensor readings in Serial Monitor', parts: 0 });
      testItems.push({ id: 't3', text: 'Test actuator responses', parts: 0 });
      testItems.push({ id: 't4', text: 'Validate full system operation', parts: 0 });
      steps.push({ phase: 'Test', icon: '✅', items: testItems });
    } else {
      // Non-MCU: generic build steps
      const items = [];
      items.push({ id: 's1', text: 'Gather all components from the parts list', parts: (result.components || []).length });
      items.push({ id: 's2', text: 'Set up breadboard or PCB', parts: 0 });
      items.push({ id: 's3', text: 'Place components according to circuit diagram', parts: 0 });
      items.push({ id: 's4', text: 'Wire connections as shown in the netlist', parts: (result.connections || []).length });
      items.push({ id: 's5', text: 'Apply power and test circuit operation', parts: 0 });
      steps.push({ phase: 'Build', icon: '🔧', items: items });
    }

    return steps;
  }, [result]);

  // Calculate totals
  const totalItems = buildSteps.reduce((sum, phase) => sum + phase.items.length, 0);
  const doneItems = Object.values(checked).filter(Boolean).length;

  // Tools & assumptions
  const tools = [
    { icon: '🔧', text: 'Soldering iron with fine tip' },
    { icon: '🪛', text: 'Small Phillips screwdriver' },
    { icon: '✂️', text: 'Wire strippers / flush cutters' },
    { icon: '🔬', text: 'Multimeter' },
    { icon: '🧵', text: 'Jumper wires (M-M, M-F)' },
    { icon: '📟', text: 'Breadboard (830 tie-points)' },
  ];

  const assumptions = [
    'Basic understanding of electronic circuits',
    'Familiarity with breadboard prototyping',
    result.platform?.name ? `${result.platform.name} development environment installed` : 'Development tools installed',
    'USB cable for board programming',
    'Ability to read circuit diagrams',
  ];

  if (!result) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          ☰ Instructions
          <span className="font-mono text-xs text-ink-400 font-normal ml-2">
            {doneItems}/{totalItems} done
          </span>
        </h2>
      </div>

      {/* Tools & Assumptions */}
      <div className="border-2 border-ink-200 p-5">
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink mb-4 flex items-center gap-2">
          🔧 Tools & Assumptions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400 mb-3">Tools</h4>
            <div className="space-y-2">
              {tools.map((tool, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-base">{tool.icon}</span>
                  <span>{tool.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400 mb-3">Assumptions</h4>
            <div className="space-y-2">
              {assumptions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-ink-600">
                  <span className="text-ink-300 mt-0.5">–</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Build Phases */}
      {buildSteps.map((phase, phaseIdx) => {
        const phaseDone = phase.items.filter(item => checked[item.id]).length;

        return (
          <div key={phase.phase} className="border-2 border-ink-200">
            {/* Phase header */}
            <div className="flex items-center justify-between px-5 py-3 bg-ink-50 border-b border-ink-200">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="text-ink-400 font-mono">{phaseIdx + 1}.</span>
                <span>{phase.icon}</span>
                {phase.phase}
              </h3>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-ink-400 border border-ink-200 px-2 py-0.5">
                  {phaseDone}/{phase.items.length}
                </span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    phaseDone === phase.items.length && phase.items.length > 0
                      ? 'bg-ink-900 border-ink-900'
                      : 'border-ink-300'
                  }`}
                >
                  {phaseDone === phase.items.length && phase.items.length > 0 && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Phase items */}
            <div>
              {phase.items.map((item, itemIdx) => (
                <div
                  key={item.id}
                  className="instruction-step border-b border-ink-100 last:border-b-0"
                >
                  {/* Step number */}
                  <span className="font-mono text-xs text-ink-300 w-8 text-right flex-shrink-0">
                    {phaseIdx + 1}.{itemIdx + 1}
                  </span>

                  {/* Checkbox */}
                  <button
                    onClick={() => toggleCheck(item.id)}
                    className={`step-check ${checked[item.id] ? 'checked' : ''}`}
                  >
                    {checked[item.id] && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>

                  {/* Text */}
                  <span className={`flex-1 text-sm ${checked[item.id] ? 'line-through text-ink-300' : 'text-ink'}`}>
                    {item.text}
                  </span>

                  {/* Parts count */}
                  {item.parts > 0 && (
                    <span className="font-mono text-[11px] text-ink-400 border border-ink-200 px-2 py-0.5 flex-shrink-0">
                      {item.parts} {item.parts === 1 ? 'part' : 'parts'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
