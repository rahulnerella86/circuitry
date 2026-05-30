/**
 * Digital Filter Builder — DSP Signal Flow Graphs for every digital filter type.
 * Generates explicit delay (z⁻¹), multiplier (×), and adder (Σ) nodes.
 */

function buildResult({ title, components, nodes, connections, code, explanation }) {
  return {
    platform: 'dsp',
    validation: { valid: true, warnings: [], errors: [] },
    components: components || [],
    supportComponents: [],
    pinAssignments: [],
    netlist: { version: '1.0', platform: 'digital_filter', nets: {}, statistics: { totalNets: 0, totalConnections: (connections || []).length, totalNodes: (nodes || []).length } },
    connections: connections || [],
    nodes: nodes || [],
    code: code || '',
    explanation: explanation || `## ${title}\nDigital filter configured.`
  };
}

function nd(id, type, name, x, y, opts = {}) {
  return { id, type, name, x, y, ...opts };
}
function dspNode(id, name, x, y, cat) {
  return { id, type: 'component', name, category: cat, x, y };
}
function wire(id, from, fPin, to, tPin, color, label) {
  return { id, from: { node: from, pin: fPin }, to: { node: to, pin: tPin }, type: 'signal', color: color || '#6366f1', label: label || '' };
}

// ─── FIR Tapped Delay Line SFG ──────────────────────────────────────────────
function firSFG(title, fc, fs, order, desc) {
  const N = order || 4;
  const nodes = [];
  const connections = [];
  const comps = [];
  const startX = 100, startY = 150, delaySpacing = 140, yMult = 250, ySum = 350;

  nodes.push(nd('xn', 'input', 'x[n]', startX, startY));

  // Create delay chain and coefficient multipliers
  for (let i = 0; i <= N; i++) {
    const x = startX + 120 + i * delaySpacing;
    
    if (i < N) {
      // Delay block
      const dId = `z${i}`;
      nodes.push(dspNode(dId, `z⁻¹`, x + delaySpacing / 2, startY, 'delay'));
      comps.push({ id: dId, name: `Delay z⁻¹`, category: 'delay', quantity: 1 });
    }

    // Coefficient multiplier
    const mId = `b${i}`;
    nodes.push(dspNode(mId, `×b${i}`, x, yMult, 'multiplier'));
    comps.push({ id: mId, name: `Coeff b${i}`, category: 'multiplier', quantity: 1 });

    // Tap wire: from delay chain down to multiplier
    const tapSource = i === 0 ? 'xn' : `z${i - 1}`;
    connections.push(wire(`tap${i}`, tapSource, 'OUT', mId, 'IN', '#06b6d4', i === 0 ? 'x[n]' : `x[n-${i}]`));
    
    // Connect delay chain
    if (i < N) {
      const nextSource = i === 0 ? 'xn' : `z${i - 1}`;
      connections.push(wire(`d${i}`, nextSource, 'OUT', `z${i}`, 'IN', '#6366f1'));
    }
  }

  // Summation nodes
  for (let i = 0; i <= N; i++) {
    const x = startX + 120 + i * delaySpacing;
    if (i < N) {
      const sId = `sum${i}`;
      nodes.push(dspNode(sId, 'Σ', x, ySum, 'summer'));
      connections.push(wire(`ms${i}`, `b${i}`, 'OUT', sId, 'IN1', '#f59e0b'));
      if (i > 0) {
        connections.push(wire(`ss${i}`, `sum${i - 1}`, 'OUT', sId, 'IN2', '#10b981'));
      }
    } else {
      // Last multiplier goes to final sum
      connections.push(wire(`ms${i}`, `b${i}`, 'OUT', `sum${N - 1}`, 'IN2', '#f59e0b'));
    }
  }

  // Output
  const outX = startX + 120 + (N - 1) * delaySpacing + 120;
  nodes.push(nd('yn', 'output', 'y[n]', outX, ySum));
  connections.push(wire('wout', `sum${N - 1}`, 'OUT', 'yn', 'IN', '#ef4444', 'y[n]'));

  return buildResult({
    title, nodes, connections, components: comps,
    code: `// ${title} (N=${N}, fc=${fc}Hz, fs=${fs}Hz)\n// y[n] = Σ b[k] · x[n-k], k=0..${N}\n${desc || ''}`,
    explanation: `## ${title}\n${desc || `FIR filter with ${N + 1} taps.`}\n\n### Signal Flow\nx[n] → z⁻¹ chain → coefficient multipliers → summation → y[n]`
  });
}

// ─── IIR Direct Form II SFG ────────────────────────────────────────────────
function iirDF2(title, fc, fs, desc) {
  const nodes = [];
  const connections = [];
  const startX = 80, midX = 400, outX = 720, topY = 100, midY = 250, botY = 400;

  // Input & output
  nodes.push(nd('xn', 'input', 'x[n]', startX, midY));
  nodes.push(nd('yn', 'output', 'y[n]', outX, midY));

  // Central delay chain (vertical)
  nodes.push(dspNode('sum1', 'Σ', midX - 80, midY, 'summer'));
  nodes.push(dspNode('w0', 'w[n]', midX, midY, 'summer'));
  nodes.push(dspNode('z1', 'z⁻¹', midX, midY + 80, 'delay'));
  nodes.push(dspNode('z2', 'z⁻¹', midX, midY + 160, 'delay'));

  // Feed-forward multipliers (b coefficients)
  nodes.push(dspNode('b0', '×b₀', midX + 120, midY, 'multiplier'));
  nodes.push(dspNode('b1', '×b₁', midX + 120, midY + 80, 'multiplier'));
  nodes.push(dspNode('b2', '×b₂', midX + 120, midY + 160, 'multiplier'));

  // Sum output
  nodes.push(dspNode('sum2', 'Σ', midX + 240, midY, 'summer'));

  // Feedback multipliers (a coefficients)
  nodes.push(dspNode('a1', '×(-a₁)', midX - 160, midY + 80, 'multiplier'));
  nodes.push(dspNode('a2', '×(-a₂)', midX - 160, midY + 160, 'multiplier'));

  // Wiring
  connections.push(wire('w1', 'xn', 'OUT', 'sum1', 'IN1', '#22c55e', 'x[n]'));
  connections.push(wire('w2', 'sum1', 'OUT', 'w0', 'IN', '#6366f1', 'w[n]'));
  connections.push(wire('w3', 'w0', 'OUT', 'z1', 'IN', '#6366f1'));
  connections.push(wire('w4', 'z1', 'OUT', 'z2', 'IN', '#06b6d4'));
  
  // Feed-forward path
  connections.push(wire('w5', 'w0', 'OUT', 'b0', 'IN', '#f59e0b'));
  connections.push(wire('w6', 'z1', 'OUT', 'b1', 'IN', '#f59e0b'));
  connections.push(wire('w7', 'z2', 'OUT', 'b2', 'IN', '#f59e0b'));
  connections.push(wire('w8', 'b0', 'OUT', 'sum2', 'IN1', '#10b981'));
  connections.push(wire('w9', 'b1', 'OUT', 'sum2', 'IN2', '#10b981'));
  connections.push(wire('w10', 'b2', 'OUT', 'sum2', 'IN3', '#10b981'));
  connections.push(wire('w11', 'sum2', 'OUT', 'yn', 'IN', '#ef4444', 'y[n]'));
  
  // Feedback path
  connections.push(wire('w12', 'z1', 'OUT', 'a1', 'IN', '#f43f5e'));
  connections.push(wire('w13', 'z2', 'OUT', 'a2', 'IN', '#f43f5e'));
  connections.push(wire('w14', 'a1', 'OUT', 'sum1', 'IN2', '#f43f5e', '-a₁'));
  connections.push(wire('w15', 'a2', 'OUT', 'sum1', 'IN3', '#f43f5e', '-a₂'));

  return buildResult({
    title, nodes, connections,
    components: [
      { id: 'z1', name: 'Unit Delay z⁻¹', category: 'delay', quantity: 2 },
      { id: 'b0', name: 'Coefficient Multiplier', category: 'multiplier', quantity: 5 },
      { id: 'sum1', name: 'Adder Σ', category: 'summer', quantity: 2 },
    ],
    code: `// ${title} (fc=${fc}Hz, fs=${fs}Hz)\n// w[n] = x[n] - a₁·w[n-1] - a₂·w[n-2]\n// y[n] = b₀·w[n] + b₁·w[n-1] + b₂·w[n-2]\n${desc || ''}`,
    explanation: `## ${title}\n${desc || 'IIR biquad filter.'}\n\n### Signal Flow\nx[n] → Σ → w[n] → z⁻¹ chain\n↓ b coefficients → Σ → y[n]\n↑ a coefficients (feedback)`
  });
}

// ─── Simple single-path block (for design method filters) ───────────────────
function methodBlock({ id, name, inputs, outputs, desc, codeStr }) {
  const nodes = [];
  const connections = [];
  const yStep = 70;
  const inX = 100, blockX = 450, outX = 800;

  // Use a named block node
  nodes.push({ id, type: 'component', name, category: 'dsp', x: blockX, y: Math.max(inputs.length, outputs.length) * yStep / 2 + 30 });

  inputs.forEach((inp, i) => {
    const y = 80 + i * yStep;
    const nid = `in_${inp.replace(/[\s\[\]]/g, '_')}`;
    nodes.push(nd(nid, 'input', inp, inX, y));
    connections.push(wire(`ci_${i}`, nid, 'OUT', id, inp, '#3b82f6', inp));
  });

  outputs.forEach((out, i) => {
    const y = 80 + i * yStep;
    const nid = `out_${out.replace(/[\s\[\]]/g, '_')}`;
    nodes.push(nd(nid, 'output', out, outX, y));
    connections.push(wire(`co_${i}`, id, out, nid, 'IN', '#10b981', out));
  });

  return buildResult({
    title: name,
    components: [{ id, name, category: 'dsp', description: desc, quantity: 1 }],
    nodes, connections, code: codeStr || `// ${name}\n${desc}`,
    explanation: `## ${name}\n${desc}`
  });
}

// ─── Main Entry Point ───────────────────────────────────────────────────────

function generateDigitalFilterCircuit(config) {
  const { filterType, frequency } = config;
  const fc = parseFloat(frequency) || 1000;
  const fs = 8000;

  // ── FIR ──
  if (filterType === 'fir') {
    return firSFG('FIR Filter', fc, fs, 4, `Finite Impulse Response — non-recursive, always stable, linear phase possible. fc=${fc}Hz, fs=${fs}Hz.`);
  }

  // ── IIR ──
  if (filterType === 'iir') {
    return iirDF2('IIR Filter (Direct Form II)', fc, fs, `Infinite Impulse Response — recursive, efficient. fc=${fc}Hz, fs=${fs}Hz.`);
  }

  // ── Digital Response Types (all use biquad/DF2) ──
  if (filterType === 'digital_lpf') {
    return iirDF2('Digital Low Pass Filter', fc, fs, `Digital LPF biquad. Passes below ${fc}Hz. fs=${fs}Hz.`);
  }
  if (filterType === 'digital_hpf') {
    return iirDF2('Digital High Pass Filter', fc, fs, `Digital HPF biquad. Passes above ${fc}Hz. fs=${fs}Hz.`);
  }
  if (filterType === 'digital_bpf') {
    return iirDF2('Digital Band Pass Filter', fc, fs, `Digital BPF biquad centered at ${fc}Hz. fs=${fs}Hz.`);
  }
  if (filterType === 'digital_bsf') {
    return iirDF2('Digital Notch Filter', fc, fs, `Digital Band Stop / Notch biquad rejecting ${fc}Hz. fs=${fs}Hz.`);
  }
  if (filterType === 'digital_apf') {
    return iirDF2('Digital All-Pass Filter', fc, fs, `All-pass biquad — unity magnitude, phase shift at ${fc}Hz.`);
  }

  // ── Structure Form: Direct Form I ──
  if (filterType === 'direct_form_1') {
    // DF1 has two separate delay lines
    const nodes = [];
    const connections = [];
    const cx = 400, topY = 80, midY = 220, botY = 360;

    nodes.push(nd('xn', 'input', 'x[n]', 80, topY + 40));
    nodes.push(nd('yn', 'output', 'y[n]', 750, midY));

    // Feed-forward delay line (top)
    nodes.push(dspNode('zx1', 'z⁻¹', 250, topY, 'delay'));
    nodes.push(dspNode('zx2', 'z⁻¹', 380, topY, 'delay'));
    nodes.push(dspNode('b0', '×b₀', 200, topY + 80, 'multiplier'));
    nodes.push(dspNode('b1', '×b₁', 330, topY + 80, 'multiplier'));
    nodes.push(dspNode('b2', '×b₂', 460, topY + 80, 'multiplier'));

    // Feedback delay line (bottom)
    nodes.push(dspNode('zy1', 'z⁻¹', 250, botY, 'delay'));
    nodes.push(dspNode('zy2', 'z⁻¹', 380, botY, 'delay'));
    nodes.push(dspNode('a1', '×(-a₁)', 330, botY - 70, 'multiplier'));
    nodes.push(dspNode('a2', '×(-a₂)', 460, botY - 70, 'multiplier'));

    // Output summer
    nodes.push(dspNode('sumout', 'Σ', 600, midY, 'summer'));

    // Feed-forward wiring
    connections.push(wire('w1', 'xn', 'OUT', 'b0', 'IN', '#22c55e'));
    connections.push(wire('w2', 'xn', 'OUT', 'zx1', 'IN', '#6366f1'));
    connections.push(wire('w3', 'zx1', 'OUT', 'zx2', 'IN', '#06b6d4'));
    connections.push(wire('w4', 'zx1', 'OUT', 'b1', 'IN', '#f59e0b'));
    connections.push(wire('w5', 'zx2', 'OUT', 'b2', 'IN', '#f59e0b'));

    // Feedback wiring
    connections.push(wire('w6', 'sumout', 'OUT', 'zy1', 'IN', '#6366f1'));
    connections.push(wire('w7', 'zy1', 'OUT', 'zy2', 'IN', '#06b6d4'));
    connections.push(wire('w8', 'zy1', 'OUT', 'a1', 'IN', '#f43f5e'));
    connections.push(wire('w9', 'zy2', 'OUT', 'a2', 'IN', '#f43f5e'));

    // Sum
    connections.push(wire('w10', 'b0', 'OUT', 'sumout', 'IN1', '#10b981'));
    connections.push(wire('w11', 'b1', 'OUT', 'sumout', 'IN2', '#10b981'));
    connections.push(wire('w12', 'b2', 'OUT', 'sumout', 'IN3', '#10b981'));
    connections.push(wire('w13', 'a1', 'OUT', 'sumout', 'IN4', '#f43f5e'));
    connections.push(wire('w14', 'a2', 'OUT', 'sumout', 'IN5', '#f43f5e'));
    connections.push(wire('w15', 'sumout', 'OUT', 'yn', 'IN', '#ef4444', 'y[n]'));

    return buildResult({
      title: 'Direct Form I', nodes, connections,
      components: [
        { id: 'z', name: 'Unit Delay z⁻¹', category: 'delay', quantity: 4 },
        { id: 'm', name: 'Coefficient Multiplier', category: 'multiplier', quantity: 5 },
        { id: 's', name: 'Adder Σ', category: 'summer', quantity: 1 },
      ],
      code: `// Direct Form I\n// y[n] = b₀x[n] + b₁x[n-1] + b₂x[n-2] - a₁y[n-1] - a₂y[n-2]\n// Two separate delay lines: 2N delay elements`,
      explanation: `## Direct Form I\nStandard IIR structure with separate numerator and denominator delay lines.\n\nRequires 2N delay elements (4 for 2nd order).`
    });
  }

  // ── Direct Form II ──
  if (filterType === 'direct_form_2') {
    return iirDF2('Direct Form II (Canonical)', fc, fs, 'Canonical form with single shared delay line. Requires only N delay elements.');
  }

  // ── Transposed Form ──
  if (filterType === 'transposed') {
    return iirDF2('Transposed Direct Form II', fc, fs, 'Better numerical stability for floating-point arithmetic. Reversed signal flow.');
  }

  // ── Cascade (SOS) ──
  if (filterType === 'cascade') {
    // Two cascaded biquad stages
    const nodes = [];
    const connections = [];

    nodes.push(nd('xn', 'input', 'x[n]', 60, 200));
    nodes.push(dspNode('bq1', 'Biquad₁', 250, 200, 'dsp'));
    nodes.push(dspNode('bq2', 'Biquad₂', 500, 200, 'dsp'));
    nodes.push(nd('yn', 'output', 'y[n]', 700, 200));

    // Delay details for stage 1
    nodes.push(dspNode('z1a', 'z⁻¹', 200, 320, 'delay'));
    nodes.push(dspNode('z1b', 'z⁻¹', 300, 320, 'delay'));

    // Delay details for stage 2
    nodes.push(dspNode('z2a', 'z⁻¹', 450, 320, 'delay'));
    nodes.push(dspNode('z2b', 'z⁻¹', 550, 320, 'delay'));

    connections.push(wire('w1', 'xn', 'OUT', 'bq1', 'IN', '#22c55e', 'x[n]'));
    connections.push(wire('w2', 'bq1', 'OUT', 'bq2', 'IN', '#6366f1', 'w₁[n]'));
    connections.push(wire('w3', 'bq2', 'OUT', 'yn', 'IN', '#ef4444', 'y[n]'));
    connections.push(wire('w4', 'bq1', 'OUT', 'z1a', 'IN', '#06b6d4'));
    connections.push(wire('w5', 'z1a', 'OUT', 'z1b', 'IN', '#06b6d4'));
    connections.push(wire('w6', 'bq2', 'OUT', 'z2a', 'IN', '#06b6d4'));
    connections.push(wire('w7', 'z2a', 'OUT', 'z2b', 'IN', '#06b6d4'));

    return buildResult({
      title: 'Cascade (SOS) Form', nodes, connections,
      components: [
        { id: 'bq', name: 'Biquad Section', category: 'dsp', quantity: 2 },
        { id: 'z', name: 'Unit Delay z⁻¹', category: 'delay', quantity: 4 },
      ],
      code: `// Cascade / SOS Form\n// H(z) = H₁(z) · H₂(z)\n// Each section is a 2nd-order biquad`,
      explanation: `## Cascade (Second-Order Sections)\nMost robust for high-order filters. Each section is independently stable.`
    });
  }

  // ── Parallel Form ──
  if (filterType === 'parallel') {
    const nodes = [];
    const connections = [];

    nodes.push(nd('xn', 'input', 'x[n]', 60, 200));
    nodes.push(dspNode('sp', 'Split', 180, 200, 'summer'));
    nodes.push(dspNode('s1', 'Section₁', 400, 120, 'dsp'));
    nodes.push(dspNode('s2', 'Section₂', 400, 280, 'dsp'));
    nodes.push(dspNode('sum', 'Σ', 600, 200, 'summer'));
    nodes.push(nd('yn', 'output', 'y[n]', 760, 200));

    connections.push(wire('w1', 'xn', 'OUT', 'sp', 'IN', '#22c55e', 'x[n]'));
    connections.push(wire('w2', 'sp', 'OUT1', 's1', 'IN', '#6366f1'));
    connections.push(wire('w3', 'sp', 'OUT2', 's2', 'IN', '#6366f1'));
    connections.push(wire('w4', 's1', 'OUT', 'sum', 'IN1', '#10b981'));
    connections.push(wire('w5', 's2', 'OUT', 'sum', 'IN2', '#10b981'));
    connections.push(wire('w6', 'sum', 'OUT', 'yn', 'IN', '#ef4444', 'y[n]'));

    return buildResult({
      title: 'Parallel Form', nodes, connections,
      components: [
        { id: 's', name: 'Partial Fraction Section', category: 'dsp', quantity: 2 },
        { id: 'sum', name: 'Adder Σ', category: 'summer', quantity: 1 },
      ],
      code: `// Parallel Form\n// H(z) = H₁(z) + H₂(z) + ...\n// Sum of partial fraction sections`,
      explanation: `## Parallel Form\nPartial fraction expansion. Each section runs in parallel, outputs summed.`
    });
  }

  // ── Lattice Filter ──
  if (filterType === 'lattice') {
    const nodes = [];
    const connections = [];

    nodes.push(nd('xn', 'input', 'x[n]', 60, 150));
    
    for (let i = 0; i < 3; i++) {
      const x = 200 + i * 200;
      nodes.push(dspNode(`k${i}`, `×k${i}`, x, 150, 'multiplier'));
      nodes.push(dspNode(`z${i}`, 'z⁻¹', x, 300, 'delay'));
      nodes.push(dspNode(`sf${i}`, 'Σ', x + 60, 150, 'summer'));
      nodes.push(dspNode(`sb${i}`, 'Σ', x + 60, 300, 'summer'));
      
      const prevF = i === 0 ? 'xn' : `sf${i-1}`;
      connections.push(wire(`wf${i}`, prevF, 'OUT', `k${i}`, 'IN', '#f59e0b'));
      connections.push(wire(`wfa${i}`, `k${i}`, 'OUT', `sb${i}`, 'IN1', '#f59e0b'));
      connections.push(wire(`wfb${i}`, prevF, 'OUT', `sf${i}`, 'IN1', '#6366f1'));
      connections.push(wire(`wz${i}`, `z${i}`, 'OUT', `sf${i}`, 'IN2', '#06b6d4'));
      connections.push(wire(`wzb${i}`, `sb${i}`, 'OUT', `z${i}`, 'IN', '#10b981'));
    }

    nodes.push(nd('yn', 'output', 'y[n]', 820, 150));
    nodes.push(nd('en', 'output', 'e[n]', 820, 300));
    connections.push(wire('wout1', 'sf2', 'OUT', 'yn', 'IN', '#ef4444', 'y[n]'));
    connections.push(wire('wout2', 'sb2', 'OUT', 'en', 'IN', '#ef4444', 'e[n]'));

    return buildResult({
      title: 'Lattice Filter', nodes, connections,
      components: [
        { id: 'k', name: 'Reflection Coefficient ×k', category: 'multiplier', quantity: 3 },
        { id: 'z', name: 'Unit Delay z⁻¹', category: 'delay', quantity: 3 },
        { id: 's', name: 'Adder Σ', category: 'summer', quantity: 6 },
      ],
      code: `// Lattice Filter\n// Forward: f[i] = f[i-1] + k[i]·b[i-1]\n// Backward: b[i] = k[i]·f[i-1] + b[i-1]`,
      explanation: `## Lattice Filter\nUses reflection coefficients. Common in speech/audio coding.`
    });
  }

  // ── Design Method Filters (structured blocks) ──
  if (filterType === 'window_method') {
    return firSFG('Window Method FIR', fc, fs, 6, `FIR designed by windowing ideal impulse response.\nWindows: Hamming, Hann, Blackman, Kaiser.\nfc=${fc}Hz, fs=${fs}Hz.`);
  }
  if (filterType === 'freq_sampling') {
    return firSFG('Frequency Sampling FIR', fc, fs, 6, `FIR designed by specifying frequency response samples, then IFFT.\nfc=${fc}Hz, fs=${fs}Hz.`);
  }
  if (filterType === 'bilinear') {
    return iirDF2('Bilinear Transform IIR', fc, fs, `Analog-to-digital via s = (2fs)(z-1)/(z+1).\nPre-warped fc = ${fc}Hz. No aliasing.`);
  }
  if (filterType === 'impulse_invariance') {
    return iirDF2('Impulse Invariance IIR', fc, fs, `Digital filter by sampling analog impulse response.\nT = 1/${fs}s. Aliasing possible for HPF.`);
  }

  // ── Phase & Adaptive ──
  if (filterType === 'linear_phase') {
    return firSFG('Linear Phase FIR', fc, fs, 6, `Symmetric coefficients: h[n] = h[N-1-n].\nConstant group delay = (N-1)/2 samples.\nNo phase distortion.`);
  }
  if (filterType === 'nonlinear_phase') {
    return iirDF2('Non-Linear Phase IIR', fc, fs, 'Minimum-phase or IIR. Non-constant group delay. More efficient than linear phase.');
  }

  if (filterType === 'adaptive_lms') {
    const nodes = [];
    const connections = [];

    nodes.push(nd('xn', 'input', 'x[n]', 80, 150));
    nodes.push(nd('dn', 'input', 'd[n]', 80, 350));
    nodes.push(dspNode('fir', 'Adaptive FIR', 350, 150, 'dsp'));
    nodes.push(dspNode('sum', 'Σ', 550, 250, 'summer'));
    nodes.push(dspNode('lms', 'LMS Update', 350, 400, 'dsp'));
    nodes.push(nd('yn', 'output', 'y[n]', 700, 150));
    nodes.push(nd('en', 'output', 'e[n]', 700, 350));

    connections.push(wire('w1', 'xn', 'OUT', 'fir', 'IN', '#22c55e', 'x[n]'));
    connections.push(wire('w2', 'fir', 'OUT', 'yn', 'IN', '#ef4444', 'y[n]'));
    connections.push(wire('w3', 'fir', 'OUT', 'sum', 'IN1', '#6366f1'));
    connections.push(wire('w4', 'dn', 'OUT', 'sum', 'IN2', '#8b5cf6', 'd[n]'));
    connections.push(wire('w5', 'sum', 'OUT', 'en', 'IN', '#ef4444', 'e[n]'));
    connections.push(wire('w6', 'sum', 'OUT', 'lms', 'IN', '#f43f5e', 'error'));
    connections.push(wire('w7', 'lms', 'OUT', 'fir', 'COEFF', '#f59e0b', 'w update'));

    return buildResult({
      title: 'Adaptive LMS Filter', nodes, connections,
      components: [
        { id: 'fir', name: 'Adaptive FIR', category: 'dsp', quantity: 1 },
        { id: 'lms', name: 'LMS Coefficient Update', category: 'dsp', quantity: 1 },
      ],
      code: `// LMS Adaptive Filter\n// w[n+1] = w[n] + µ·e[n]·x[n]\n// e[n] = d[n] - y[n]\n// µ = step size`,
      explanation: `## Adaptive LMS Filter\nLeast Mean Squares: updates coefficients to minimize error e[n] = d[n] - y[n].`
    });
  }
  if (filterType === 'adaptive_rls') {
    return methodBlock({ id: 'rls', name: 'Adaptive RLS Filter', inputs: ['x[n]', 'd[n]'], outputs: ['y[n]', 'e[n]'],
      desc: 'Recursive Least Squares. Faster convergence than LMS, O(N²) cost.\nλ = 0.99 forgetting factor.',
      codeStr: `// RLS Adaptive Filter\n// P[n] = (1/λ)(P[n-1] - K·x'·P[n-1])\n// K = P[n-1]·x / (λ + x'·P[n-1]·x)\n// w[n] = w[n-1] + K·e[n]` });
  }

  // ── Advanced Filters ──
  if (filterType === 'kalman') {
    return methodBlock({ id: 'kal', name: 'Kalman Filter', inputs: ['z[n] (measurement)', 'u[n] (control)'], outputs: ['x̂[n] (estimate)'],
      desc: 'Optimal recursive estimator. Predict → Correct cycle.\nState-space model: x = Ax + Bu, z = Hx + v.',
      codeStr: `// Kalman Filter\n// Predict: x̂⁻ = A·x̂ + B·u, P⁻ = A·P·Aᵀ + Q\n// Update:  K = P⁻Hᵀ(HP⁻Hᵀ+R)⁻¹\n//          x̂ = x̂⁻ + K(z - Hx̂⁻)\n//          P = (I-KH)P⁻` });
  }
  if (filterType === 'wiener') {
    return methodBlock({ id: 'wie', name: 'Wiener Filter', inputs: ['x[n] (noisy)'], outputs: ['ŝ[n] (clean)'],
      desc: 'Optimal linear filter for noise reduction in the frequency domain.\nH(f) = Sss(f) / (Sss(f) + Snn(f)).',
      codeStr: `// Wiener Filter\n// H(f) = Sss(f) / (Sss(f) + Snn(f))\n// Optimal in MSE sense` });
  }

  if (filterType === 'multirate_dec') {
    const nodes = [
      nd('xn', 'input', 'x[n]', 80, 200),
      dspNode('lpf', 'Anti-Alias LPF', 280, 200, 'dsp'),
      dspNode('down', '↓M', 500, 200, 'dsp'),
      nd('ym', 'output', 'y[m]', 700, 200),
    ];
    const connections = [
      wire('w1', 'xn', 'OUT', 'lpf', 'IN', '#22c55e', 'x[n]'),
      wire('w2', 'lpf', 'OUT', 'down', 'IN', '#6366f1', 'filtered'),
      wire('w3', 'down', 'OUT', 'ym', 'IN', '#ef4444', 'y[m]'),
    ];
    return buildResult({
      title: 'Decimation Filter', nodes, connections,
      components: [{ id: 'lpf', name: 'Anti-Alias LPF', category: 'dsp', quantity: 1 }, { id: 'down', name: 'Downsampler ↓M', category: 'dsp', quantity: 1 }],
      code: `// Decimation (↓M)\n// 1. Anti-alias LPF: fc < fs/(2M)\n// 2. Downsample: y[m] = x_filt[mM]\n// Output rate = fs/M`,
      explanation: `## Decimation\nReduces sample rate by factor M.`
    });
  }

  if (filterType === 'multirate_int') {
    const nodes = [
      nd('xn', 'input', 'x[n]', 80, 200),
      dspNode('up', '↑L', 280, 200, 'dsp'),
      dspNode('lpf', 'Anti-Image LPF', 500, 200, 'dsp'),
      nd('ym', 'output', 'y[m]', 700, 200),
    ];
    const connections = [
      wire('w1', 'xn', 'OUT', 'up', 'IN', '#22c55e', 'x[n]'),
      wire('w2', 'up', 'OUT', 'lpf', 'IN', '#6366f1', 'zero-stuffed'),
      wire('w3', 'lpf', 'OUT', 'ym', 'IN', '#ef4444', 'y[m]'),
    ];
    return buildResult({
      title: 'Interpolation Filter', nodes, connections,
      components: [{ id: 'up', name: 'Upsampler ↑L', category: 'dsp', quantity: 1 }, { id: 'lpf', name: 'Anti-Image LPF', category: 'dsp', quantity: 1 }],
      code: `// Interpolation (↑L)\n// 1. Insert L-1 zeros\n// 2. Anti-image LPF\n// Output rate = L·fs`,
      explanation: `## Interpolation\nIncreases sample rate by factor L.`
    });
  }

  if (filterType === 'comb') {
    const nodes = [
      nd('xn', 'input', 'x[n]', 80, 200),
      dspNode('sum', 'Σ', 280, 200, 'summer'),
      dspNode('zk', 'z⁻ᴷ', 280, 340, 'delay'),
      dspNode('a', '×a', 420, 340, 'multiplier'),
      nd('yn', 'output', 'y[n]', 500, 200),
    ];
    const connections = [
      wire('w1', 'xn', 'OUT', 'sum', 'IN1', '#22c55e', 'x[n]'),
      wire('w2', 'sum', 'OUT', 'yn', 'IN', '#ef4444', 'y[n]'),
      wire('w3', 'sum', 'OUT', 'zk', 'IN', '#06b6d4'),
      wire('w4', 'zk', 'OUT', 'a', 'IN', '#f59e0b'),
      wire('w5', 'a', 'OUT', 'sum', 'IN2', '#f43f5e', 'feedback'),
    ];
    return buildResult({
      title: 'Comb Filter', nodes, connections,
      components: [
        { id: 'zk', name: 'K-sample Delay', category: 'delay', quantity: 1 },
        { id: 'a', name: 'Gain ×a', category: 'multiplier', quantity: 1 },
        { id: 'sum', name: 'Adder Σ', category: 'summer', quantity: 1 },
      ],
      code: `// Comb Filter\n// y[n] = x[n] + a·y[n-K]\n// Notch spacing = fs/K`,
      explanation: `## Comb Filter\nCreates periodic notches/peaks. Feedback creates resonant peaks.`
    });
  }

  if (filterType === 'moving_average') {
    return firSFG('Moving Average Filter', fc, fs, 4, `Simplest FIR: all coefficients = 1/N.\nExcellent for smoothing time-domain signals.\ny[n] = (1/N) Σ x[n-k]`);
  }

  // ── Fallback ──
  return firSFG('Digital Filter', fc, fs, 4, `Generic digital filter at fc=${fc}Hz, fs=${fs}Hz.`);
}

module.exports = { generateDigitalFilterCircuit };
