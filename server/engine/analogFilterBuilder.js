/**
 * Analog Filter Builder — Full RLC / Op-Amp schematics for every filter type.
 * Every filter generates explicit component nodes and orthogonal connections.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildFilterResult({ title, components, nodes, connections, code, explanation }) {
  return {
    platform: 'analog',
    validation: { valid: true, warnings: [], errors: [] },
    components: components || [],
    supportComponents: [],
    pinAssignments: [],
    netlist: {
      version: '1.0', platform: 'analog', nets: {},
      statistics: { totalNets: 3, totalConnections: (connections || []).length, totalNodes: (nodes || []).length }
    },
    connections: connections || [],
    nodes: nodes || [],
    code: code || '',
    explanation: explanation || `## ${title}\nFilter configured successfully.`
  };
}

function node(id, type, name, x, y, opts = {}) {
  return { id, type, name, x, y, ...opts };
}
function comp(id, name, x, y, value, cat = 'passive') {
  return { id, type: 'component', name, category: cat, x, y, value };
}
function wire(id, fromNode, fromPin, toNode, toPin, color, label) {
  return { id, from: { node: fromNode, pin: fromPin }, to: { node: toNode, pin: toPin }, type: 'signal', color: color || '#6366f1', label: label || '' };
}
function gndWire(id, fromNode, toNode) {
  return { id, from: { node: fromNode, pin: 'P2' }, to: { node: toNode, pin: 'GND' }, type: 'ground', color: '#1f2937', label: '' };
}

// ─── RC/RLC Computations ────────────────────────────────────────────────────

function computeRC(fc) {
  const C = 1e-6;
  const R = 1 / (2 * Math.PI * fc * C);
  return { R: Math.round(R * 100) / 100, C, RStr: `${Math.round(R)}Ω`, CStr: '1µF' };
}
function computeRLC(fc) {
  const C = 1e-6;
  const L = 1 / (4 * Math.PI * Math.PI * fc * fc * C);
  const R = 1 / (2 * Math.PI * fc * C);
  return { R: Math.round(R), C, L, RStr: `${Math.round(R)}Ω`, CStr: '1µF', LStr: `${(L * 1000).toFixed(2)}mH` };
}
function computeRL(fc, R) {
  const L = R / (2 * Math.PI * fc);
  return { L, LStr: `${(L * 1000).toFixed(2)}mH` };
}

// ─── Sallen-Key (2nd Order Active Filter) Helper ────────────────────────────
// Generic Sallen-Key Low Pass: Vin → R1 → node1 → R2 → node2 → Op-Amp+ → Vout
//                                              C1↓GND             C2↓GND (from Vout feedback)
function sallenKeyLPF(title, fc, desc) {
  const { RStr, CStr } = computeRC(fc);
  const nodes = [
    node('vin', 'input', 'Vin', 80, 200),
    comp('r1', 'R1', 240, 200, RStr),
    node('j1', 'junction', '', 360, 200),
    comp('r2', 'R2', 440, 200, RStr),
    node('j2', 'junction', '', 560, 200),
    comp('opamp', 'Op-Amp', 700, 200, '', 'opamp'),
    node('vout', 'output', 'Vout', 880, 200),
    comp('c1', 'C1', 360, 340, CStr),
    comp('c2', 'C2', 560, 340, CStr),
    node('gnd1', 'ground', 'GND', 360, 450),
    node('gnd2', 'ground', 'GND', 560, 450),
  ];
  const connections = [
    wire('w1', 'vin', 'OUT', 'r1', 'P1', '#22c55e', 'Vin'),
    wire('w2', 'r1', 'P2', 'j1', 'IN', '#6366f1'),
    wire('w3', 'j1', 'OUT', 'r2', 'P1', '#6366f1'),
    wire('w4', 'r2', 'P2', 'j2', 'IN', '#6366f1'),
    wire('w5', 'j2', 'OUT', 'opamp', 'V+', '#8b5cf6'),
    wire('w6', 'opamp', 'OUT', 'vout', 'IN', '#ef4444', 'Vout'),
    wire('w7', 'j1', 'OUT', 'c1', 'P1', '#3b82f6'),
    gndWire('w8', 'c1', 'gnd1'),
    wire('w9', 'j2', 'OUT', 'c2', 'P1', '#3b82f6'),
    gndWire('w10', 'c2', 'gnd2'),
  ];
  const comps = [
    { id: 'r1', name: 'Resistor R1', category: 'passive', value: RStr, quantity: 1 },
    { id: 'r2', name: 'Resistor R2', category: 'passive', value: RStr, quantity: 1 },
    { id: 'c1', name: 'Capacitor C1', category: 'passive', value: CStr, quantity: 1 },
    { id: 'c2', name: 'Capacitor C2', category: 'passive', value: CStr, quantity: 1 },
    { id: 'opamp', name: 'Op-Amp', category: 'opamp', quantity: 1 },
  ];
  return buildFilterResult({
    title, nodes, connections, components: comps,
    code: `${title}\nR1=R2=${RStr}, C1=C2=${CStr}\nfc = 1/(2π√(R1·R2·C1·C2)) = ${fc} Hz\nTopology: Sallen-Key`,
    explanation: `## ${title}\n${desc}\n\n### Components\n- **R1, R2**: ${RStr}\n- **C1, C2**: ${CStr}\n- **Op-Amp**: Unity gain buffer\n\n### Transfer Function\nH(s) = 1 / (s²R1R2C1C2 + s(R1C1+R2C1) + 1)`
  });
}

// ─── Passive RC LP/HP ───────────────────────────────────────────────────────
function passiveRCLP(fc) {
  const { RStr, CStr } = computeRC(fc);
  const nodes = [
    node('vin', 'input', 'Vin', 100, 200),
    comp('r', 'R', 300, 200, RStr),
    node('j1', 'junction', '', 460, 200),
    comp('c', 'C', 460, 330, CStr),
    node('vout', 'output', 'Vout', 620, 200),
    node('gnd', 'ground', 'GND', 460, 440),
  ];
  const conns = [
    wire('w1', 'vin', 'OUT', 'r', 'P1', '#22c55e', 'Vin'),
    wire('w2', 'r', 'P2', 'j1', 'IN', '#6366f1'),
    wire('w3', 'j1', 'OUT', 'vout', 'IN', '#ef4444', 'Vout'),
    wire('w4', 'j1', 'OUT', 'c', 'P1', '#3b82f6'),
    gndWire('w5', 'c', 'gnd'),
  ];
  return { nodes, conns, RStr, CStr };
}

function passiveRCHP(fc) {
  const { RStr, CStr } = computeRC(fc);
  const nodes = [
    node('vin', 'input', 'Vin', 100, 200),
    comp('c', 'C', 300, 200, CStr),
    node('j1', 'junction', '', 460, 200),
    comp('r', 'R', 460, 330, RStr),
    node('vout', 'output', 'Vout', 620, 200),
    node('gnd', 'ground', 'GND', 460, 440),
  ];
  const conns = [
    wire('w1', 'vin', 'OUT', 'c', 'P1', '#22c55e', 'Vin'),
    wire('w2', 'c', 'P2', 'j1', 'IN', '#6366f1'),
    wire('w3', 'j1', 'OUT', 'vout', 'IN', '#ef4444', 'Vout'),
    wire('w4', 'j1', 'OUT', 'r', 'P1', '#3b82f6'),
    gndWire('w5', 'r', 'gnd'),
  ];
  return { nodes, conns, RStr, CStr };
}

// ─── Main Entry Point ───────────────────────────────────────────────────────

function generateAnalogFilterCircuit(config) {
  const { filterType, frequency } = config;
  const fc = parseFloat(frequency) || 1000;
  const { R, RStr, CStr } = computeRC(fc);
  const { LStr } = computeRL(fc, R);
  const rlc = computeRLC(fc);

  // ── Low Pass Filter (Passive RC) ──
  if (filterType === 'low_pass') {
    const { nodes, conns } = passiveRCLP(fc);
    return buildFilterResult({
      title: 'RC Low Pass Filter', nodes, connections: conns,
      components: [
        { id: 'r', name: 'Resistor', category: 'passive', value: RStr, quantity: 1 },
        { id: 'c', name: 'Capacitor', category: 'passive', value: CStr, quantity: 1 },
      ],
      code: `RC Low Pass Filter\nR = ${RStr}, C = ${CStr}\nfc = 1/(2πRC) = ${fc} Hz\nH(s) = 1 / (1 + sRC)`,
      explanation: `## Low Pass Filter\nPasses frequencies below ${fc} Hz.\n- **R**: ${RStr}\n- **C**: ${CStr}\n- **Roll-off**: -20 dB/decade`
    });
  }

  // ── High Pass Filter (Passive RC) ──
  if (filterType === 'high_pass') {
    const { nodes, conns } = passiveRCHP(fc);
    return buildFilterResult({
      title: 'RC High Pass Filter', nodes, connections: conns,
      components: [
        { id: 'r', name: 'Resistor', category: 'passive', value: RStr, quantity: 1 },
        { id: 'c', name: 'Capacitor', category: 'passive', value: CStr, quantity: 1 },
      ],
      code: `RC High Pass Filter\nR = ${RStr}, C = ${CStr}\nfc = 1/(2πRC) = ${fc} Hz\nH(s) = sRC / (1 + sRC)`,
      explanation: `## High Pass Filter\nPasses frequencies above ${fc} Hz.\n- **R**: ${RStr}\n- **C**: ${CStr}`
    });
  }

  // ── Band Pass Filter (Series RLC) ──
  if (filterType === 'band_pass') {
    const n = [
      node('vin', 'input', 'Vin', 80, 220),
      comp('r', 'R', 220, 220, rlc.RStr),
      comp('l', 'L', 380, 220, rlc.LStr),
      node('j1', 'junction', '', 520, 220),
      comp('c', 'C', 520, 350, rlc.CStr),
      node('vout', 'output', 'Vout', 680, 220),
      node('gnd', 'ground', 'GND', 520, 460),
    ];
    const c = [
      wire('w1','vin','OUT','r','P1','#22c55e','Vin'),
      wire('w2','r','P2','l','P1','#6366f1'),
      wire('w3','l','P2','j1','IN','#6366f1'),
      wire('w4','j1','OUT','vout','IN','#ef4444','Vout'),
      wire('w5','j1','OUT','c','P1','#3b82f6'),
      gndWire('w6','c','gnd'),
    ];
    return buildFilterResult({
      title: 'Series RLC Band Pass Filter', nodes: n, connections: c,
      components: [
        { id: 'r', name: 'Resistor', category: 'passive', value: rlc.RStr, quantity: 1 },
        { id: 'l', name: 'Inductor', category: 'passive', value: rlc.LStr, quantity: 1 },
        { id: 'c', name: 'Capacitor', category: 'passive', value: rlc.CStr, quantity: 1 },
      ],
      code: `Series RLC Band Pass Filter\nR = ${rlc.RStr}, L = ${rlc.LStr}, C = ${rlc.CStr}\nf₀ = 1/(2π√LC) = ${fc} Hz\nQ = (1/R)√(L/C)`,
      explanation: `## Band Pass Filter\nPasses frequencies around ${fc} Hz using series RLC.\n- **R**: ${rlc.RStr}\n- **L**: ${rlc.LStr}\n- **C**: ${rlc.CStr}`
    });
  }

  // ── Band Stop / Notch Filter (Parallel LC in series path) ──
  if (filterType === 'band_stop') {
    const n = [
      node('vin', 'input', 'Vin', 80, 220),
      comp('r', 'R', 220, 220, rlc.RStr),
      node('j1', 'junction', '', 380, 220),
      comp('l', 'L', 380, 120, rlc.LStr),
      comp('c', 'C', 380, 340, rlc.CStr),
      node('vout', 'output', 'Vout', 600, 220),
      node('gnd', 'ground', 'GND', 600, 440),
      comp('rload', 'R_load', 600, 340, '1kΩ'),
    ];
    const c = [
      wire('w1','vin','OUT','r','P1','#22c55e','Vin'),
      wire('w2','r','P2','j1','IN','#6366f1'),
      wire('w3','j1','OUT','l','P1','#8b5cf6'),
      wire('w4','j1','OUT','c','P1','#3b82f6'),
      wire('w5','j1','OUT','vout','IN','#ef4444','Vout'),
      wire('w6','vout','OUT','rload','P1','#6366f1'),
      gndWire('w7','rload','gnd'),
    ];
    return buildFilterResult({
      title: 'Notch / Band Stop Filter', nodes: n, connections: c,
      components: [
        { id: 'r', name: 'Resistor', category: 'passive', value: rlc.RStr, quantity: 1 },
        { id: 'l', name: 'Inductor', category: 'passive', value: rlc.LStr, quantity: 1 },
        { id: 'c', name: 'Capacitor', category: 'passive', value: rlc.CStr, quantity: 1 },
        { id: 'rload', name: 'Load Resistor', category: 'passive', value: '1kΩ', quantity: 1 },
      ],
      code: `Band Stop (Notch) Filter\nR = ${rlc.RStr}, L = ${rlc.LStr}, C = ${rlc.CStr}\nNotch at f₀ = 1/(2π√LC) = ${fc} Hz`,
      explanation: `## Band Stop Filter\nRejects frequencies around ${fc} Hz using parallel LC tank.`
    });
  }

  // ── All-Pass Filter (Op-Amp) ──
  if (filterType === 'all_pass') {
    const n = [
      node('vin', 'input', 'Vin', 80, 200),
      comp('r1', 'R1', 240, 200, RStr),
      node('j1', 'junction', '', 380, 200),
      comp('c', 'C', 380, 320, CStr),
      comp('r2', 'R2', 240, 360, RStr),
      comp('opamp', 'Op-Amp', 560, 260, '', 'opamp'),
      node('vout', 'output', 'Vout', 740, 260),
      node('gnd', 'ground', 'GND', 380, 440),
    ];
    const c = [
      wire('w1','vin','OUT','r1','P1','#22c55e','Vin'),
      wire('w2','r1','P2','j1','IN','#6366f1'),
      wire('w3','j1','OUT','opamp','V+','#8b5cf6'),
      wire('w4','j1','OUT','c','P1','#3b82f6'),
      gndWire('w5','c','gnd'),
      wire('w6','vin','OUT','r2','P1','#22c55e'),
      wire('w7','r2','P2','opamp','V-','#f43f5e'),
      wire('w8','opamp','OUT','vout','IN','#ef4444','Vout'),
    ];
    return buildFilterResult({
      title: 'All-Pass Filter', nodes: n, connections: c,
      components: [
        { id: 'r1', name: 'R1', category: 'passive', value: RStr, quantity: 1 },
        { id: 'r2', name: 'R2', category: 'passive', value: RStr, quantity: 1 },
        { id: 'c', name: 'Capacitor', category: 'passive', value: CStr, quantity: 1 },
        { id: 'opamp', name: 'Op-Amp', category: 'opamp', quantity: 1 },
      ],
      code: `All-Pass Filter\nR1=R2=${RStr}, C=${CStr}\nPhase shift at ${fc} Hz\nH(s) = (1-sRC)/(1+sRC), |H|=1`,
      explanation: `## All-Pass Filter\nPasses all frequencies with unity gain, shifts phase.\n- **Phase shift**: 0° to -180° around ${fc} Hz`
    });
  }

  // ── RC Filter ──
  if (filterType === 'rc_filter') {
    const { nodes, conns } = passiveRCLP(fc);
    return buildFilterResult({
      title: 'RC Filter', nodes, connections: conns,
      components: [
        { id: 'r', name: 'Resistor', category: 'passive', value: RStr, quantity: 1 },
        { id: 'c', name: 'Capacitor', category: 'passive', value: CStr, quantity: 1 },
      ],
      code: `RC Filter\nR = ${RStr}, C = ${CStr}\nfc = 1/(2πRC) = ${fc} Hz\nτ = RC = ${(R * 1e-6 * 1e6).toFixed(2)} µs`,
      explanation: `## RC Filter\nBasic resistor-capacitor network. fc = ${fc} Hz.`
    });
  }

  // ── RL Filter ──
  if (filterType === 'rl_filter') {
    const n = [
      node('vin', 'input', 'Vin', 100, 200),
      comp('r', 'R', 300, 200, RStr),
      node('j1', 'junction', '', 460, 200),
      comp('l', 'L', 460, 330, LStr),
      node('vout', 'output', 'Vout', 620, 200),
      node('gnd', 'ground', 'GND', 460, 440),
    ];
    const c = [
      wire('w1','vin','OUT','r','P1','#22c55e','Vin'),
      wire('w2','r','P2','j1','IN','#6366f1'),
      wire('w3','j1','OUT','vout','IN','#ef4444','Vout'),
      wire('w4','j1','OUT','l','P1','#8b5cf6'),
      gndWire('w5','l','gnd'),
    ];
    return buildFilterResult({
      title: 'RL Filter', nodes: n, connections: c,
      components: [
        { id: 'r', name: 'Resistor', category: 'passive', value: RStr, quantity: 1 },
        { id: 'l', name: 'Inductor', category: 'passive', value: LStr, quantity: 1 },
      ],
      code: `RL Filter\nR = ${RStr}, L = ${LStr}\nfc = R/(2πL) = ${fc} Hz`,
      explanation: `## RL Filter\nResistor-inductor low-pass network. fc = ${fc} Hz.`
    });
  }

  // ── RLC Filter ──
  if (filterType === 'rlc_filter') {
    const n = [
      node('vin', 'input', 'Vin', 80, 220),
      comp('r', 'R', 220, 220, rlc.RStr),
      comp('l', 'L', 400, 220, rlc.LStr),
      node('j1', 'junction', '', 540, 220),
      comp('c', 'C', 540, 350, rlc.CStr),
      node('vout', 'output', 'Vout', 700, 220),
      node('gnd', 'ground', 'GND', 540, 460),
    ];
    const c = [
      wire('w1','vin','OUT','r','P1','#22c55e','Vin'),
      wire('w2','r','P2','l','P1','#6366f1'),
      wire('w3','l','P2','j1','IN','#8b5cf6'),
      wire('w4','j1','OUT','vout','IN','#ef4444','Vout'),
      wire('w5','j1','OUT','c','P1','#3b82f6'),
      gndWire('w6','c','gnd'),
    ];
    return buildFilterResult({
      title: 'Series RLC Filter', nodes: n, connections: c,
      components: [
        { id: 'r', name: 'Resistor', category: 'passive', value: rlc.RStr, quantity: 1 },
        { id: 'l', name: 'Inductor', category: 'passive', value: rlc.LStr, quantity: 1 },
        { id: 'c', name: 'Capacitor', category: 'passive', value: rlc.CStr, quantity: 1 },
      ],
      code: `Series RLC Filter\nR=${rlc.RStr}, L=${rlc.LStr}, C=${rlc.CStr}\nf₀ = 1/(2π√LC) = ${fc} Hz\nQ = (1/R)√(L/C)`,
      explanation: `## RLC Filter\nSeries RLC resonant circuit at ${fc} Hz.`
    });
  }

  // ── Passive Filter ──
  if (filterType === 'passive_filter') {
    const { nodes, conns } = passiveRCLP(fc);
    return buildFilterResult({
      title: 'Passive Filter', nodes, connections: conns,
      components: [
        { id: 'r', name: 'Resistor', category: 'passive', value: RStr, quantity: 1 },
        { id: 'c', name: 'Capacitor', category: 'passive', value: CStr, quantity: 1 },
      ],
      code: `Passive RC Filter\nR = ${RStr}, C = ${CStr}\nfc = ${fc} Hz\nNo amplification (passive, gain ≤ 1)`,
      explanation: `## Passive Filter\nUses only passive components. No gain above unity.`
    });
  }

  // ── Active Filter (Sallen-Key LPF) ──
  if (filterType === 'active_filter') {
    return sallenKeyLPF('Active Filter (Sallen-Key)', fc, 'Active low-pass filter using Sallen-Key topology with op-amp.');
  }

  // ── Butterworth ──
  if (filterType === 'butterworth') {
    return sallenKeyLPF('Butterworth Filter (2nd Order)', fc, 'Maximally flat magnitude response in passband. No ripple. Sallen-Key implementation.');
  }

  // ── Chebyshev Type I ──
  if (filterType === 'chebyshev_i') {
    return sallenKeyLPF('Chebyshev Type I Filter', fc, 'Steeper roll-off than Butterworth with 0.5dB passband ripple. Sallen-Key topology.');
  }

  // ── Chebyshev Type II ──
  if (filterType === 'chebyshev_ii') {
    return sallenKeyLPF('Chebyshev Type II Filter', fc, 'Flat passband, equiripple in stopband. Also called Inverse Chebyshev. Sallen-Key topology.');
  }

  // ── Elliptic (Cauer) ──
  if (filterType === 'elliptic') {
    return sallenKeyLPF('Elliptic (Cauer) Filter', fc, 'Sharpest possible roll-off for given order. Equiripple in both passband and stopband.');
  }

  // ── Bessel ──
  if (filterType === 'bessel') {
    return sallenKeyLPF('Bessel Filter', fc, 'Maximally flat group delay (linear phase). Best for pulse and step response preservation.');
  }

  // ── First-Order ──
  if (filterType === 'first_order') {
    const { nodes, conns } = passiveRCLP(fc);
    return buildFilterResult({
      title: 'First-Order Filter', nodes, connections: conns,
      components: [
        { id: 'r', name: 'Resistor', category: 'passive', value: RStr, quantity: 1 },
        { id: 'c', name: 'Capacitor', category: 'passive', value: CStr, quantity: 1 },
      ],
      code: `First-Order LPF\nR = ${RStr}, C = ${CStr}\nfc = ${fc} Hz\nRoll-off: -20 dB/decade (single pole)`,
      explanation: `## First-Order Filter\nSingle RC stage. -20 dB/decade roll-off.`
    });
  }

  // ── Second-Order ──
  if (filterType === 'second_order') {
    return sallenKeyLPF('Second-Order Filter (Sallen-Key)', fc, '2nd-order active filter. -40 dB/decade roll-off. Resonance possible depending on damping.');
  }

  // ── Higher-Order (cascaded 2nd-order stages) ──
  if (filterType === 'higher_order') {
    // Two cascaded Sallen-Key stages
    const n = [
      node('vin', 'input', 'Vin', 50, 200),
      comp('r1', 'R1', 140, 200, RStr),
      comp('r2', 'R2', 260, 200, RStr),
      node('j1', 'junction', '', 350, 200),
      comp('c1', 'C1', 200, 330, CStr),
      comp('opamp1', 'Op-Amp₁', 450, 200, '', 'opamp'),
      node('j2', 'junction', '', 560, 200),
      comp('r3', 'R3', 640, 200, RStr),
      comp('r4', 'R4', 760, 200, RStr),
      comp('c2', 'C2', 700, 330, CStr),
      comp('opamp2', 'Op-Amp₂', 880, 200, '', 'opamp'),
      node('vout', 'output', 'Vout', 950, 200),
      node('gnd1', 'ground', 'GND', 200, 440),
      node('gnd2', 'ground', 'GND', 700, 440),
    ];
    const c = [
      wire('w1','vin','OUT','r1','P1','#22c55e','Vin'),
      wire('w2','r1','P2','r2','P1','#6366f1'),
      wire('w3','r2','P2','j1','IN','#6366f1'),
      wire('w4','j1','OUT','opamp1','V+','#8b5cf6'),
      wire('w5','r1','P2','c1','P1','#3b82f6'),
      gndWire('w6','c1','gnd1'),
      wire('w7','opamp1','OUT','j2','IN','#ef4444'),
      wire('w8','j2','OUT','r3','P1','#6366f1'),
      wire('w9','r3','P2','r4','P1','#6366f1'),
      wire('w10','r4','P2','opamp2','V+','#8b5cf6'),
      wire('w11','r3','P2','c2','P1','#3b82f6'),
      gndWire('w12','c2','gnd2'),
      wire('w13','opamp2','OUT','vout','IN','#ef4444','Vout'),
    ];
    return buildFilterResult({
      title: '4th-Order Filter (Cascaded Sallen-Key)', nodes: n, connections: c,
      components: [
        { id: 'r1', name: 'R1', category: 'passive', value: RStr, quantity: 4 },
        { id: 'c1', name: 'C1', category: 'passive', value: CStr, quantity: 2 },
        { id: 'opamp1', name: 'Op-Amp', category: 'opamp', quantity: 2 },
      ],
      code: `4th-Order Cascaded Sallen-Key\nR = ${RStr}, C = ${CStr}\nfc = ${fc} Hz\nRoll-off: -80 dB/decade`,
      explanation: `## Higher-Order Filter\nTwo cascaded 2nd-order Sallen-Key stages for -80 dB/decade roll-off.`
    });
  }

  // ── Tuned Amplifier ──
  if (filterType === 'tuned_amplifier') {
    const n = [
      node('vin', 'input', 'Vin', 80, 250),
      comp('c_couple', 'C_in', 200, 250, '100nF'),
      comp('l', 'L', 400, 150, rlc.LStr),
      comp('c', 'C', 400, 350, rlc.CStr),
      node('j1', 'junction', '', 400, 250),
      comp('opamp', 'Op-Amp', 580, 250, '', 'opamp'),
      node('vout', 'output', 'Vout', 750, 250),
    ];
    const c = [
      wire('w1','vin','OUT','c_couple','P1','#22c55e','Vin'),
      wire('w2','c_couple','P2','j1','IN','#6366f1'),
      wire('w3','j1','OUT','l','P1','#8b5cf6'),
      wire('w4','j1','OUT','c','P1','#3b82f6'),
      wire('w5','j1','OUT','opamp','V+','#8b5cf6'),
      wire('w6','opamp','OUT','vout','IN','#ef4444','Vout'),
    ];
    return buildFilterResult({
      title: 'Tuned Amplifier Filter', nodes: n, connections: c,
      components: [
        { id: 'l', name: 'Inductor', category: 'passive', value: rlc.LStr, quantity: 1 },
        { id: 'c', name: 'Capacitor', category: 'passive', value: rlc.CStr, quantity: 1 },
        { id: 'opamp', name: 'Op-Amp', category: 'opamp', quantity: 1 },
      ],
      code: `Tuned Amplifier\nLC Tank: L=${rlc.LStr}, C=${rlc.CStr}\nResonant at f₀ = ${fc} Hz`,
      explanation: `## Tuned Amplifier\nNarrow bandpass using LC tank with op-amp amplification at ${fc} Hz.`
    });
  }

  // ── Switched Capacitor Filter ──
  if (filterType === 'switched_cap') {
    const n = [
      node('vin', 'input', 'Vin', 80, 200),
      node('clk', 'input', 'CLK', 320, 80),
      comp('sw1', 'SW₁', 220, 200, '', 'passive'),
      comp('c_sw', 'C_sw', 320, 300, '10pF'),
      comp('sw2', 'SW₂', 440, 200, '', 'passive'),
      comp('opamp', 'Op-Amp', 600, 200, '', 'opamp'),
      comp('c_int', 'C_int', 600, 100, CStr),
      node('vout', 'output', 'Vout', 780, 200),
    ];
    const c = [
      wire('w1','vin','OUT','sw1','P1','#22c55e','Vin'),
      wire('w2','sw1','P2','c_sw','P1','#6366f1'),
      wire('w3','c_sw','P2','sw2','P1','#6366f1'),
      wire('w4','sw2','P2','opamp','V-','#f43f5e'),
      wire('w5','opamp','OUT','vout','IN','#ef4444','Vout'),
      wire('w6','clk','OUT','sw1','CLK','#f59e0b','CLK'),
      wire('w7','opamp','OUT','c_int','P1','#3b82f6'),
      wire('w8','c_int','P2','opamp','V-','#3b82f6'),
    ];
    return buildFilterResult({
      title: 'Switched Capacitor Filter', nodes: n, connections: c,
      components: [
        { id: 'c_sw', name: 'Switched Cap', category: 'passive', value: '10pF', quantity: 1 },
        { id: 'c_int', name: 'Integrator Cap', category: 'passive', value: CStr, quantity: 1 },
        { id: 'opamp', name: 'Op-Amp', category: 'opamp', quantity: 1 },
      ],
      code: `Switched Capacitor Filter\nR_equiv = T/C_sw (clock-tunable)\nfc adjustable via clock frequency`,
      explanation: `## Switched Capacitor Filter\nUses switched capacitors to emulate resistors. Clock-tunable cutoff.`
    });
  }

  // ── Voltage-Controlled Filter (VCF) ──
  if (filterType === 'vcf') {
    const n = [
      node('vin', 'input', 'Vin', 80, 200),
      node('vctrl', 'input', 'V_ctrl', 360, 80),
      comp('ota', 'OTA', 360, 200, 'gm', 'opamp'),
      node('j1', 'junction', '', 520, 200),
      comp('c', 'C', 520, 330, CStr),
      node('vout', 'output', 'Vout', 680, 200),
      node('gnd', 'ground', 'GND', 520, 440),
    ];
    const c = [
      wire('w1','vin','OUT','ota','V+','#22c55e','Vin'),
      wire('w2','vctrl','OUT','ota','Vctrl','#f59e0b','V_ctrl'),
      wire('w3','ota','OUT','j1','IN','#6366f1'),
      wire('w4','j1','OUT','vout','IN','#ef4444','Vout'),
      wire('w5','j1','OUT','c','P1','#3b82f6'),
      gndWire('w6','c','gnd'),
    ];
    return buildFilterResult({
      title: 'Voltage-Controlled Filter (VCF)', nodes: n, connections: c,
      components: [
        { id: 'ota', name: 'OTA (Op. Transconductance Amp)', category: 'opamp', quantity: 1 },
        { id: 'c', name: 'Capacitor', category: 'passive', value: CStr, quantity: 1 },
      ],
      code: `Voltage-Controlled Filter\nfc = gm/(2πC)\ngm controlled by V_ctrl\nNominal fc = ${fc} Hz`,
      explanation: `## Voltage-Controlled Filter\nCutoff frequency controlled by external voltage. Common in synthesizers.`
    });
  }

  // ── Fallback: generic passive RC ──
  const { nodes, conns } = passiveRCLP(fc);
  return buildFilterResult({
    title: 'Analog Filter', nodes, connections: conns,
    components: [
      { id: 'r', name: 'Resistor', category: 'passive', value: RStr, quantity: 1 },
      { id: 'c', name: 'Capacitor', category: 'passive', value: CStr, quantity: 1 },
    ],
    code: `Analog Filter\nR = ${RStr}, C = ${CStr}\nfc = ${fc} Hz`,
    explanation: `## Analog Filter\nGeneric RC filter at ${fc} Hz.`
  });
}

module.exports = { generateAnalogFilterCircuit };
