/**
 * Analog Circuit Builder — Op-amp amplifiers, BJT/MOSFET circuits,
 * voltage references, comparators, signal conditioning.
 */

function generateAnalogCircuit(input) {
  const { analogType = 'opamp_inverting', params = {} } = input;

  const builders = {
    opamp_inverting: buildInvertingAmp,
    opamp_noninverting: buildNonInvertingAmp,
    opamp_summing: buildSummingAmp,
    opamp_differential: buildDifferentialAmp,
    opamp_instrumentation: buildInstrumentationAmp,
    opamp_buffer: buildBufferAmp,
    comparator: buildComparator,
    comparator_hysteresis: buildComparatorHysteresis,
    bjt_ce_amp: buildBJTCEAmplifier,
    bjt_emitter_follower: buildEmitterFollower,
    mosfet_switch: buildMOSFETSwitch,
    voltage_reference: buildVoltageReference,
    signal_conditioning: buildSignalConditioning,
  };

  const builder = builders[analogType];
  if (!builder) throw new Error(`Unknown analog circuit: ${analogType}`);
  return builder(params);
}

function buildInvertingAmp(params) {
  const gain = parseFloat(params.gain) || -10;
  const Rf = parseFloat(params.rf) || 100000;
  const Rin = Rf / Math.abs(gain);
  const Vcc = parseFloat(params.vcc) || 12;

  return makeOpAmpResult('Inverting Amplifier', {
    gain: gain,
    formula: `Gain = -Rf/Rin = -${Rf}/${Rin.toFixed(0)} = ${gain}`,
    components: [
      { id: 'U1', name: 'Op-Amp (LM358)', category: 'ic', type: 'op_amp', value: 'LM358', quantity: 1 },
      { id: 'Rin', name: `Rin = ${fmtR(Rin)}`, category: 'passive', type: 'resistor', value: fmtR(Rin), quantity: 1 },
      { id: 'Rf', name: `Rf = ${fmtR(Rf)}`, category: 'passive', type: 'resistor', value: fmtR(Rf), quantity: 1 },
    ],
    connections: [
      { from: 'VIN', to: 'Rin.P1', label: 'Input signal', color: '#3b82f6' },
      { from: 'Rin.P2', to: 'U1.IN-', label: 'To inverting input', color: '#3b82f6' },
      { from: 'U1.IN+', to: 'GND', label: 'Non-inv to GND', color: '#1f2937' },
      { from: 'U1.OUT', to: 'Rf.P1', label: 'Output feedback', color: '#10b981' },
      { from: 'Rf.P2', to: 'U1.IN-', label: 'Feedback to IN-', color: '#f59e0b' },
      { from: 'VCC', to: 'U1.V+', label: `+${Vcc}V`, color: '#ef4444' },
      { from: 'U1.V-', to: 'GND', label: 'GND / V-', color: '#1f2937' },
    ],
    description: `Inverting amplifier with gain = **${gain}**. Input signal is applied to the inverting input through Rin.`,
    behavior: `Vout = -${Math.abs(gain)} × Vin. The output is phase-inverted (180° shifted).`,
    inputImpedance: `Zin = Rin = ${fmtR(Rin)}`,
    bandwidth: `GBW / |Gain| (for LM358: ~1MHz GBW → BW ≈ ${(1e6 / Math.abs(gain) / 1000).toFixed(1)} kHz)`,
    Vcc,
  });
}

function buildNonInvertingAmp(params) {
  const gain = parseFloat(params.gain) || 11;
  const R1 = parseFloat(params.r1) || 10000;
  const Rf = R1 * (gain - 1);
  const Vcc = parseFloat(params.vcc) || 12;

  return makeOpAmpResult('Non-Inverting Amplifier', {
    gain,
    formula: `Gain = 1 + Rf/R1 = 1 + ${Rf.toFixed(0)}/${R1} = ${gain}`,
    components: [
      { id: 'U1', name: 'Op-Amp (LM358)', category: 'ic', type: 'op_amp', value: 'LM358', quantity: 1 },
      { id: 'R1', name: `R1 = ${fmtR(R1)}`, category: 'passive', type: 'resistor', value: fmtR(R1), quantity: 1 },
      { id: 'Rf', name: `Rf = ${fmtR(Rf)}`, category: 'passive', type: 'resistor', value: fmtR(Rf), quantity: 1 },
    ],
    connections: [
      { from: 'VIN', to: 'U1.IN+', label: 'Input signal', color: '#3b82f6' },
      { from: 'U1.OUT', to: 'Rf.P1', label: 'Output', color: '#10b981' },
      { from: 'Rf.P2', to: 'U1.IN-', label: 'Feedback', color: '#f59e0b' },
      { from: 'U1.IN-', to: 'R1.P1', label: 'To R1', color: '#f59e0b' },
      { from: 'R1.P2', to: 'GND', label: 'R1 to GND', color: '#1f2937' },
    ],
    description: `Non-inverting amplifier with gain = **${gain}**. High input impedance, no phase inversion.`,
    behavior: `Vout = ${gain} × Vin. Output is in-phase with input.`,
    inputImpedance: `Very high (op-amp input impedance, typically >1 MΩ)`,
    bandwidth: `GBW / Gain ≈ ${(1e6 / gain / 1000).toFixed(1)} kHz`,
    Vcc,
  });
}

function buildSummingAmp(params) {
  const inputs = parseInt(params.inputs) || 3;
  const Rf = parseFloat(params.rf) || 100000;
  const Ri = parseFloat(params.ri) || 100000;

  const components = [
    { id: 'U1', name: 'Op-Amp (LM358)', category: 'ic', type: 'op_amp', value: 'LM358', quantity: 1 },
    { id: 'Rf', name: `Rf = ${fmtR(Rf)}`, category: 'passive', type: 'resistor', value: fmtR(Rf), quantity: 1 },
  ];
  for (let i = 1; i <= inputs; i++) {
    components.push({ id: `R${i}`, name: `R${i} = ${fmtR(Ri)}`, category: 'passive', type: 'resistor', value: fmtR(Ri), quantity: 1 });
  }

  return makeOpAmpResult('Summing Amplifier', {
    gain: -(Rf / Ri),
    formula: `Vout = -Rf/Ri × (V1 + V2 + ... + V${inputs}) = -${(Rf / Ri).toFixed(1)} × ΣVin`,
    components,
    connections: [],
    description: `${inputs}-input summing amplifier. All inputs are weighted equally with gain = -${(Rf / Ri).toFixed(1)}.`,
    behavior: `Adds ${inputs} input signals and inverts the result. Changing Ri values gives weighted summation.`,
    inputImpedance: `Zin per channel = Ri = ${fmtR(Ri)}`,
    Vcc: parseFloat(params.vcc) || 12,
  });
}

function buildDifferentialAmp(params) {
  const gain = parseFloat(params.gain) || 10;
  const R1 = parseFloat(params.r1) || 10000;
  const R2 = R1 * gain;

  return makeOpAmpResult('Differential Amplifier', {
    gain,
    formula: `Gain = R2/R1 = ${R2}/${R1} = ${gain}\nVout = (R2/R1) × (V2 - V1)`,
    components: [
      { id: 'U1', name: 'Op-Amp (LM358)', category: 'ic', type: 'op_amp', value: 'LM358', quantity: 1 },
      { id: 'R1a', name: `R1a = ${fmtR(R1)}`, category: 'passive', type: 'resistor', value: fmtR(R1), quantity: 1 },
      { id: 'R1b', name: `R1b = ${fmtR(R1)}`, category: 'passive', type: 'resistor', value: fmtR(R1), quantity: 1 },
      { id: 'R2a', name: `R2a = ${fmtR(R2)}`, category: 'passive', type: 'resistor', value: fmtR(R2), quantity: 1 },
      { id: 'R2b', name: `R2b = ${fmtR(R2)}`, category: 'passive', type: 'resistor', value: fmtR(R2), quantity: 1 },
    ],
    connections: [],
    description: `Differential amplifier with gain = **${gain}**. Amplifies the difference between two inputs.`,
    behavior: `Vout = ${gain} × (V+ − V−). Rejects common-mode signals.`,
    inputImpedance: `Moderate (determined by R1 values)`,
    Vcc: parseFloat(params.vcc) || 12,
  });
}

function buildInstrumentationAmp(params) {
  const gain = parseFloat(params.gain) || 100;
  const R = parseFloat(params.r) || 10000;
  const Rg = (2 * R) / (gain - 1);

  return makeOpAmpResult('Instrumentation Amplifier', {
    gain,
    formula: `Gain = 1 + (2R/Rg) = 1 + (2×${R}/${Rg.toFixed(0)}) = ${gain}\nRg = 2R/(G-1) = ${Rg.toFixed(0)} Ω`,
    components: [
      { id: 'U1', name: 'Op-Amp 1 (Buffer+)', category: 'ic', type: 'op_amp', value: 'LM358', quantity: 1 },
      { id: 'U2', name: 'Op-Amp 2 (Buffer-)', category: 'ic', type: 'op_amp', value: 'LM358', quantity: 1 },
      { id: 'U3', name: 'Op-Amp 3 (Diff stage)', category: 'ic', type: 'op_amp', value: 'LM358', quantity: 1 },
      { id: 'Rg', name: `Rg = ${fmtR(Rg)} (gain set)`, category: 'passive', type: 'resistor', value: fmtR(Rg), quantity: 1 },
      { id: 'R', name: `R = ${fmtR(R)} (×4)`, category: 'passive', type: 'resistor', value: fmtR(R), quantity: 4 },
    ],
    connections: [],
    description: `3-op-amp instrumentation amplifier with gain = **${gain}**, set by a single resistor Rg.`,
    behavior: `Very high CMRR, high input impedance on both inputs. Ideal for sensor signal amplification.`,
    inputImpedance: `Extremely high (op-amp inputs are non-inverting)`,
    Vcc: parseFloat(params.vcc) || 12,
  });
}

function buildBufferAmp(params) {
  return makeOpAmpResult('Unity-Gain Buffer (Voltage Follower)', {
    gain: 1,
    formula: `Gain = 1 (unity). Vout = Vin.`,
    components: [
      { id: 'U1', name: 'Op-Amp (LM358)', category: 'ic', type: 'op_amp', value: 'LM358', quantity: 1 },
    ],
    connections: [
      { from: 'VIN', to: 'U1.IN+', label: 'Input', color: '#3b82f6' },
      { from: 'U1.OUT', to: 'U1.IN-', label: '100% feedback', color: '#f59e0b' },
      { from: 'U1.OUT', to: 'VOUT', label: 'Output', color: '#10b981' },
    ],
    description: `Unity-gain buffer. Output follows input exactly (gain = 1).`,
    behavior: `Provides impedance isolation: high impedance input, low impedance output.`,
    inputImpedance: `Very high (>1 MΩ)`,
    Vcc: parseFloat(params.vcc) || 12,
  });
}

function buildComparator(params) {
  const Vref = parseFloat(params.vref) || 2.5;
  const Vcc = parseFloat(params.vcc) || 5;

  return makeOpAmpResult('Voltage Comparator', {
    gain: 'Open-loop',
    formula: `Vout = VCC if Vin > Vref (${Vref}V)\nVout = 0V  if Vin < Vref`,
    components: [
      { id: 'U1', name: 'Comparator (LM393)', category: 'ic', type: 'comparator', value: 'LM393', quantity: 1 },
      { id: 'R1', name: 'R1 = 10 kΩ (pull-up)', category: 'passive', type: 'resistor', value: '10 kΩ', quantity: 1 },
      { id: 'R_ref', name: 'Voltage divider for Vref', category: 'passive', type: 'resistor', value: 'See calculation', quantity: 2 },
    ],
    connections: [],
    description: `Voltage comparator with reference = **${Vref}V**. Open-collector output needs pull-up.`,
    behavior: `Output switches HIGH when input exceeds ${Vref}V. Used for threshold detection.`,
    inputImpedance: `Very high`,
    Vcc,
  });
}

function buildComparatorHysteresis(params) {
  const Vref = parseFloat(params.vref) || 2.5;
  const hyst = parseFloat(params.hysteresis) || 0.2;
  const Vcc = parseFloat(params.vcc) || 5;
  const Vth_high = Vref + hyst / 2;
  const Vth_low = Vref - hyst / 2;

  return makeOpAmpResult('Schmitt Trigger (Comparator with Hysteresis)', {
    gain: 'Open-loop + positive feedback',
    formula: `Upper threshold: ${Vth_high.toFixed(2)}V\nLower threshold: ${Vth_low.toFixed(2)}V\nHysteresis: ${hyst}V`,
    components: [
      { id: 'U1', name: 'Comparator (LM393)', category: 'ic', type: 'comparator', value: 'LM393', quantity: 1 },
      { id: 'R1', name: 'R1 = 10 kΩ', category: 'passive', type: 'resistor', value: '10 kΩ', quantity: 1 },
      { id: 'R2', name: 'R2 = 100 kΩ (feedback)', category: 'passive', type: 'resistor', value: '100 kΩ', quantity: 1 },
      { id: 'Rpu', name: 'Pull-up = 10 kΩ', category: 'passive', type: 'resistor', value: '10 kΩ', quantity: 1 },
    ],
    connections: [],
    description: `Schmitt trigger with ${hyst}V hysteresis around ${Vref}V. Prevents output oscillation near threshold.`,
    behavior: `Switches HIGH at ${Vth_high.toFixed(2)}V, switches LOW at ${Vth_low.toFixed(2)}V. Immune to noise.`,
    inputImpedance: `High`,
    Vcc,
  });
}

function buildBJTCEAmplifier(params) {
  const gain = parseFloat(params.gain) || 20;
  const Vcc = parseFloat(params.vcc) || 12;
  const Ic = parseFloat(params.ic) || 0.002;
  const beta = parseFloat(params.beta) || 200;
  const Rc = (Vcc / 3) / Ic;
  const Re = (Vcc / 10) / Ic;
  const Ib = Ic / beta;
  const Vb = 0.7 + Ic * Re;
  const R2 = Vb / (10 * Ib);
  const R1 = (Vcc - Vb) / (10 * Ib);

  return makeOpAmpResult('Common-Emitter BJT Amplifier', {
    gain: -(Rc / Re),
    formula: `Av ≈ -Rc/Re = -${Rc.toFixed(0)}/${Re.toFixed(0)} = ${(-Rc/Re).toFixed(1)}\nWith bypass cap: Av ≈ -gm × Rc = ${(-Ic * Rc / 0.026).toFixed(1)}`,
    components: [
      { id: 'Q1', name: 'NPN Transistor (2N2222)', category: 'discrete', type: 'bjt_npn', value: '2N2222', quantity: 1 },
      { id: 'Rc', name: `Rc = ${fmtR(Rc)}`, category: 'passive', type: 'resistor', value: fmtR(Rc), quantity: 1 },
      { id: 'Re', name: `Re = ${fmtR(Re)}`, category: 'passive', type: 'resistor', value: fmtR(Re), quantity: 1 },
      { id: 'R1', name: `R1 = ${fmtR(R1)} (bias)`, category: 'passive', type: 'resistor', value: fmtR(R1), quantity: 1 },
      { id: 'R2', name: `R2 = ${fmtR(R2)} (bias)`, category: 'passive', type: 'resistor', value: fmtR(R2), quantity: 1 },
      { id: 'Cin', name: 'Cin = 10 µF (coupling)', category: 'passive', type: 'capacitor', value: '10 µF', quantity: 1 },
      { id: 'Cout', name: 'Cout = 10 µF (coupling)', category: 'passive', type: 'capacitor', value: '10 µF', quantity: 1 },
      { id: 'Ce', name: 'Ce = 100 µF (bypass)', category: 'passive', type: 'capacitor', value: '100 µF', quantity: 1 },
    ],
    connections: [],
    description: `Common-emitter amplifier with voltage divider bias. Gain ≈ **${(-Rc/Re).toFixed(1)}** (without bypass cap).`,
    behavior: `Inverts and amplifies the AC input signal. DC operating point: Ic = ${(Ic*1000).toFixed(1)} mA, Vce ≈ ${(Vcc - Ic*(Rc+Re)).toFixed(1)}V.`,
    inputImpedance: `Zin ≈ R1||R2||(β×Re) = moderate`,
    Vcc,
  });
}

function buildEmitterFollower(params) {
  const Vcc = parseFloat(params.vcc) || 12;
  const Ic = parseFloat(params.ic) || 0.005;
  const Re = (Vcc / 2) / Ic;

  return makeOpAmpResult('Emitter Follower (Common Collector)', {
    gain: '≈ 1 (unity)',
    formula: `Av ≈ 1. Vout ≈ Vin - 0.7V\nRe = ${fmtR(Re)}`,
    components: [
      { id: 'Q1', name: 'NPN Transistor (2N2222)', category: 'discrete', type: 'bjt_npn', value: '2N2222', quantity: 1 },
      { id: 'Re', name: `Re = ${fmtR(Re)}`, category: 'passive', type: 'resistor', value: fmtR(Re), quantity: 1 },
      { id: 'Rb', name: 'Rb = 10 kΩ (base)', category: 'passive', type: 'resistor', value: '10 kΩ', quantity: 1 },
    ],
    connections: [],
    description: `Emitter follower (voltage buffer). Gain ≈ 1. High input impedance, low output impedance.`,
    behavior: `Output follows input minus 0.7V Vbe drop. Excellent for impedance matching / driving low-impedance loads.`,
    inputImpedance: `Zin ≈ β × Re (very high)`,
    Vcc,
  });
}

function buildMOSFETSwitch(params) {
  const Vload = parseFloat(params.vload) || 12;
  const Iload = parseFloat(params.iload) || 2;
  const Vgs = parseFloat(params.vgs) || 5;

  return makeOpAmpResult('N-Channel MOSFET Switch', {
    gain: 'ON/OFF',
    formula: `Vgs = ${Vgs}V (logic level)\nLoad: ${Vload}V @ ${Iload}A`,
    components: [
      { id: 'Q1', name: 'N-MOSFET (IRLZ44N)', category: 'discrete', type: 'mosfet_n', value: 'IRLZ44N', quantity: 1 },
      { id: 'Rg', name: 'Rg = 100 Ω (gate)', category: 'passive', type: 'resistor', value: '100 Ω', quantity: 1 },
      { id: 'Rpd', name: 'Rpd = 10 kΩ (pull-down)', category: 'passive', type: 'resistor', value: '10 kΩ', quantity: 1 },
      { id: 'D1', name: 'Flyback diode (1N4007)', category: 'discrete', type: 'diode', value: '1N4007', quantity: 1 },
    ],
    connections: [],
    description: `Low-side MOSFET switch for ${Iload}A load at ${Vload}V. Logic-level gate drive from MCU.`,
    behavior: `MCU pin HIGH → MOSFET ON → current flows through load. Pull-down ensures OFF when MCU pin is floating.`,
    inputImpedance: `Gate: virtually infinite (MOSFET)`,
    Vcc: Vload,
  });
}

function buildVoltageReference(params) {
  const Vref = parseFloat(params.vref) || 2.5;
  const type = params.refType || 'zener';

  return makeOpAmpResult('Voltage Reference', {
    gain: 'N/A',
    formula: `Vref = ${Vref}V (${type})`,
    components: type === 'zener' ? [
      { id: 'D1', name: `Zener (${Vref}V)`, category: 'discrete', type: 'zener', value: `${Vref}V Zener`, quantity: 1 },
      { id: 'Rs', name: 'Rs = 1 kΩ (series)', category: 'passive', type: 'resistor', value: '1 kΩ', quantity: 1 },
    ] : [
      { id: 'U1', name: `TL431 Adj. Ref (${Vref}V)`, category: 'ic', type: 'vref', value: 'TL431', quantity: 1 },
      { id: 'R1', name: 'R1 = 10 kΩ', category: 'passive', type: 'resistor', value: '10 kΩ', quantity: 1 },
      { id: 'R2', name: `R2 (set ${Vref}V)`, category: 'passive', type: 'resistor', value: 'Calculated', quantity: 1 },
    ],
    connections: [],
    description: `${Vref}V voltage reference using ${type === 'zener' ? 'Zener diode' : 'TL431 programmable shunt'}.`,
    behavior: `Provides a stable ${Vref}V reference for ADC, comparators, or biasing.`,
    inputImpedance: `Output impedance: low (regulated)`,
    Vcc: parseFloat(params.vcc) || 12,
  });
}

function buildSignalConditioning(params) {
  const sensorType = params.sensorType || 'thermistor';
  const adcBits = parseInt(params.adcBits) || 10;
  const Vref = parseFloat(params.vref) || 3.3;

  return makeOpAmpResult('Signal Conditioning Chain', {
    gain: 'Variable',
    formula: `Sensor → Amplify → Filter → Level Shift → ADC (${adcBits}-bit, ${Vref}V ref)`,
    components: [
      { id: 'U1', name: 'Op-Amp 1 (Amplifier)', category: 'ic', type: 'op_amp', value: 'LM358', quantity: 1 },
      { id: 'U2', name: 'Op-Amp 2 (Filter)', category: 'ic', type: 'op_amp', value: 'LM358', quantity: 1 },
      { id: 'Rg', name: 'Gain resistors', category: 'passive', type: 'resistor', value: 'Application-specific', quantity: 2 },
      { id: 'RC_filter', name: 'Anti-alias RC filter', category: 'passive', type: 'rc', value: 'fc < fs/2', quantity: 1 },
      { id: 'C_decouple', name: 'Decoupling 100nF', category: 'passive', type: 'capacitor', value: '100 nF', quantity: 2 },
    ],
    connections: [],
    description: `Signal conditioning for **${sensorType}** sensor → ${adcBits}-bit ADC.`,
    behavior: `1. Amplify sensor output to 0-${Vref}V range\n2. Low-pass filter (anti-aliasing)\n3. Buffer output for ADC\n\nADC resolution: ${(Vref / Math.pow(2, adcBits) * 1000).toFixed(3)} mV/step`,
    inputImpedance: 'Depends on first-stage configuration',
    Vcc: parseFloat(params.vcc) || 5,
  });
}

// ─── Helpers ─────────────────────────────────────────────

function fmtR(val) {
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)} MΩ`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(2)} kΩ`;
  return `${val.toFixed(1)} Ω`;
}

function makeOpAmpResult(title, opts) {
  const connections = (opts.connections || []).map((c, i) => ({
    id: `conn_${i + 1}`,
    from: { node: c.from.split('.')[0], pin: c.from.split('.')[1] || '+' },
    to: { node: c.to.split('.')[0], pin: c.to.split('.')[1] || '+' },
    type: 'signal',
    label: c.label,
    color: c.color || '#6366f1',
  }));

  return {
    platform: { id: 'analog', name: 'Analog Circuit' },
    components: opts.components,
    connections,
    pinAssignments: [],
    netlist: {
      version: '1.0',
      platform: 'analog',
      generatedAt: new Date().toISOString(),
      nets: {},
      statistics: { totalNets: 0, totalConnections: connections.length, totalNodes: opts.components.length },
    },
    code: `${title}\n${'═'.repeat(40)}\n\n${opts.formula}\n\n── Component Summary ──\n${opts.components.map(c => `• ${c.name} (×${c.quantity})`).join('\n')}\n\n── Design Notes ──\n• Supply: ±${opts.Vcc || 12}V or single ${opts.Vcc || 12}V\n• Input impedance: ${opts.inputImpedance || 'High'}\n${opts.bandwidth ? `• Bandwidth: ${opts.bandwidth}\n` : ''}`,
    explanation: `## ${title}\n\n${opts.description}\n\n### Gain\n\`\`\`\n${opts.formula}\n\`\`\`\n\n### Behavior\n${opts.behavior}\n\n### Input Impedance\n${opts.inputImpedance || 'High'}\n\n${opts.bandwidth ? `### Bandwidth\n${opts.bandwidth}\n\n` : ''}### PCB Notes\n- Place decoupling caps (100nF) close to op-amp power pins\n- Keep feedback loop short to minimize noise pickup\n- Use ground plane for low-noise operation\n- Separate analog and digital grounds, connect at single point`,
    validation: { valid: true, warnings: [], errors: [] },
    powerAnalysis: {
      totalCurrent: `Op-amp quiescent: ~1 mA per amplifier`,
      powerDissipation: `${((opts.Vcc || 12) * 0.001).toFixed(1)} mW quiescent (signal-dependent additional)`,
    },
  };
}

module.exports = { generateAnalogCircuit };
