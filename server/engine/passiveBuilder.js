/**
 * Passive Circuit Builder — Designs passive networks:
 * RC, RL, RLC, Wheatstone Bridge, Crystal Oscillators,
 * Resistor Networks, Impedance Matching
 */

function generatePassiveCircuit(input) {
  const { passiveType = 'rc_lpf', params = {} } = input;

  const builders = {
    rc_lpf: buildRCLowPass,
    rc_hpf: buildRCHighPass,
    rl_lpf: buildRLLowPass,
    rl_hpf: buildRLHighPass,
    rlc_bandpass: buildRLCBandPass,
    rlc_notch: buildRLCNotch,
    voltage_divider: buildVoltageDivider,
    wheatstone_bridge: buildWheatstoneBridge,
    crystal_oscillator: buildCrystalOscillator,
    resistor_series: buildResistorSeries,
    resistor_parallel: buildResistorParallel,
    impedance_match: buildImpedanceMatch,
  };

  const builder = builders[passiveType];
  if (!builder) {
    throw new Error(`Unknown passive circuit type: ${passiveType}`);
  }

  return builder(params);
}

function buildRCLowPass(params) {
  const fc = parseFloat(params.cutoffFreq) || 1000;
  const C = parseFloat(params.capacitance) || 100e-9;
  const R = 1 / (2 * Math.PI * fc * C);

  return {
    platform: { id: 'passive', name: 'Passive Circuit' },
    components: [
      { id: 'R1', name: `R1 = ${formatValue(R, 'Ω')}`, category: 'passive', type: 'resistor', value: formatValue(R, 'Ω'), quantity: 1 },
      { id: 'C1', name: `C1 = ${formatValue(C, 'F')}`, category: 'passive', type: 'capacitor', value: formatValue(C, 'F'), quantity: 1 },
    ],
    connections: [
      { id: 'c1', from: { node: 'VIN', pin: '+' }, to: { node: 'R1', pin: 'P1' }, type: 'signal', label: 'Input', color: '#3b82f6' },
      { id: 'c2', from: { node: 'R1', pin: 'P2' }, to: { node: 'C1', pin: 'P1' }, type: 'signal', label: 'Output node', color: '#3b82f6' },
      { id: 'c3', from: { node: 'C1', pin: 'P2' }, to: { node: 'GND', pin: 'GND' }, type: 'ground', label: 'GND', color: '#1f2937' },
      { id: 'c4', from: { node: 'R1', pin: 'P2' }, to: { node: 'VOUT', pin: '+' }, type: 'signal', label: 'Output', color: '#10b981' },
    ],
    netlist: buildPassiveNetlist([
      { net: 'IN', components: ['VIN+', 'R1.P1'] },
      { net: 'OUT', components: ['R1.P2', 'C1.P1', 'VOUT+'] },
      { net: 'GND', components: ['VIN-', 'C1.P2', 'VOUT-'] },
    ]),
    code: generateTransferFunction('RC Low-Pass', fc, R, C, null, 'H(s) = 1 / (1 + sRC)'),
    explanation: generatePassiveExplanation('RC Low-Pass Filter', fc, {
      description: `A first-order RC low-pass filter with a cutoff frequency of **${fc.toFixed(1)} Hz**.`,
      components: `R = ${formatValue(R, 'Ω')}, C = ${formatValue(C, 'F')}`,
      behavior: `Passes frequencies below ${fc.toFixed(1)} Hz and attenuates frequencies above it at -20 dB/decade.`,
      formula: `fc = 1 / (2πRC) = ${fc.toFixed(1)} Hz`,
      rolloff: '-20 dB/decade (first order)',
      phaseShift: `-45° at cutoff, approaches -90° at high frequencies`,
    }),
    validation: { valid: true, warnings: [], errors: [] },
    powerAnalysis: {
      totalCurrent: 'Signal-dependent',
      powerDissipation: 'Negligible (passive)',
      notes: 'No DC power consumption. AC power dissipation in R depends on signal amplitude.',
    },
  };
}

function buildRCHighPass(params) {
  const fc = parseFloat(params.cutoffFreq) || 1000;
  const C = parseFloat(params.capacitance) || 100e-9;
  const R = 1 / (2 * Math.PI * fc * C);

  return {
    platform: { id: 'passive', name: 'Passive Circuit' },
    components: [
      { id: 'C1', name: `C1 = ${formatValue(C, 'F')}`, category: 'passive', type: 'capacitor', value: formatValue(C, 'F'), quantity: 1 },
      { id: 'R1', name: `R1 = ${formatValue(R, 'Ω')}`, category: 'passive', type: 'resistor', value: formatValue(R, 'Ω'), quantity: 1 },
    ],
    connections: [
      { id: 'c1', from: { node: 'VIN', pin: '+' }, to: { node: 'C1', pin: 'P1' }, type: 'signal', label: 'Input', color: '#3b82f6' },
      { id: 'c2', from: { node: 'C1', pin: 'P2' }, to: { node: 'R1', pin: 'P1' }, type: 'signal', label: 'Output node', color: '#3b82f6' },
      { id: 'c3', from: { node: 'R1', pin: 'P2' }, to: { node: 'GND', pin: 'GND' }, type: 'ground', label: 'GND', color: '#1f2937' },
      { id: 'c4', from: { node: 'C1', pin: 'P2' }, to: { node: 'VOUT', pin: '+' }, type: 'signal', label: 'Output', color: '#10b981' },
    ],
    netlist: buildPassiveNetlist([
      { net: 'IN', components: ['VIN+', 'C1.P1'] },
      { net: 'OUT', components: ['C1.P2', 'R1.P1', 'VOUT+'] },
      { net: 'GND', components: ['VIN-', 'R1.P2', 'VOUT-'] },
    ]),
    code: generateTransferFunction('RC High-Pass', fc, R, C, null, 'H(s) = sRC / (1 + sRC)'),
    explanation: generatePassiveExplanation('RC High-Pass Filter', fc, {
      description: `A first-order RC high-pass filter with a cutoff frequency of **${fc.toFixed(1)} Hz**.`,
      components: `R = ${formatValue(R, 'Ω')}, C = ${formatValue(C, 'F')}`,
      behavior: `Passes frequencies above ${fc.toFixed(1)} Hz and attenuates lower frequencies at -20 dB/decade.`,
      formula: `fc = 1 / (2πRC) = ${fc.toFixed(1)} Hz`,
      rolloff: '-20 dB/decade (first order)',
      phaseShift: `+45° at cutoff, approaches 0° at high frequencies`,
    }),
    validation: { valid: true, warnings: [], errors: [] },
    powerAnalysis: { totalCurrent: 'Signal-dependent', powerDissipation: 'Negligible (passive)' },
  };
}

function buildRLLowPass(params) {
  const fc = parseFloat(params.cutoffFreq) || 1000;
  const L = parseFloat(params.inductance) || 10e-3;
  const R = 2 * Math.PI * fc * L;

  return {
    platform: { id: 'passive', name: 'Passive Circuit' },
    components: [
      { id: 'R1', name: `R1 = ${formatValue(R, 'Ω')}`, category: 'passive', type: 'resistor', value: formatValue(R, 'Ω'), quantity: 1 },
      { id: 'L1', name: `L1 = ${formatValue(L, 'H')}`, category: 'passive', type: 'inductor', value: formatValue(L, 'H'), quantity: 1 },
    ],
    connections: [
      { id: 'c1', from: { node: 'VIN', pin: '+' }, to: { node: 'L1', pin: 'P1' }, type: 'signal', label: 'Input', color: '#3b82f6' },
      { id: 'c2', from: { node: 'L1', pin: 'P2' }, to: { node: 'R1', pin: 'P1' }, type: 'signal', label: 'Node', color: '#3b82f6' },
      { id: 'c3', from: { node: 'R1', pin: 'P2' }, to: { node: 'GND', pin: 'GND' }, type: 'ground', label: 'GND', color: '#1f2937' },
    ],
    netlist: buildPassiveNetlist([
      { net: 'IN', components: ['VIN+', 'L1.P1'] },
      { net: 'OUT', components: ['L1.P2', 'R1.P1', 'VOUT+'] },
      { net: 'GND', components: ['VIN-', 'R1.P2', 'VOUT-'] },
    ]),
    code: generateTransferFunction('RL Low-Pass', fc, R, null, L, 'H(s) = R / (R + sL)'),
    explanation: generatePassiveExplanation('RL Low-Pass Filter', fc, {
      description: `A first-order RL low-pass filter with cutoff at **${fc.toFixed(1)} Hz**.`,
      components: `R = ${formatValue(R, 'Ω')}, L = ${formatValue(L, 'H')}`,
      behavior: `Passes frequencies below ${fc.toFixed(1)} Hz.`,
      formula: `fc = R / (2πL) = ${fc.toFixed(1)} Hz`,
    }),
    validation: { valid: true, warnings: [], errors: [] },
    powerAnalysis: { totalCurrent: 'Signal-dependent', powerDissipation: 'Negligible (passive)' },
  };
}

function buildRLHighPass(params) {
  const fc = parseFloat(params.cutoffFreq) || 1000;
  const L = parseFloat(params.inductance) || 10e-3;
  const R = 2 * Math.PI * fc * L;

  return {
    platform: { id: 'passive', name: 'Passive Circuit' },
    components: [
      { id: 'L1', name: `L1 = ${formatValue(L, 'H')}`, category: 'passive', type: 'inductor', value: formatValue(L, 'H'), quantity: 1 },
      { id: 'R1', name: `R1 = ${formatValue(R, 'Ω')}`, category: 'passive', type: 'resistor', value: formatValue(R, 'Ω'), quantity: 1 },
    ],
    connections: [
      { id: 'c1', from: { node: 'VIN', pin: '+' }, to: { node: 'R1', pin: 'P1' }, type: 'signal', label: 'Input', color: '#3b82f6' },
      { id: 'c2', from: { node: 'R1', pin: 'P2' }, to: { node: 'L1', pin: 'P1' }, type: 'signal', label: 'Node', color: '#3b82f6' },
      { id: 'c3', from: { node: 'L1', pin: 'P2' }, to: { node: 'GND', pin: 'GND' }, type: 'ground', label: 'GND', color: '#1f2937' },
    ],
    netlist: buildPassiveNetlist([
      { net: 'IN', components: ['VIN+', 'R1.P1'] },
      { net: 'OUT', components: ['R1.P2', 'L1.P1', 'VOUT+'] },
      { net: 'GND', components: ['VIN-', 'L1.P2', 'VOUT-'] },
    ]),
    code: generateTransferFunction('RL High-Pass', fc, R, null, L, 'H(s) = sL / (R + sL)'),
    explanation: generatePassiveExplanation('RL High-Pass Filter', fc, {
      description: `A first-order RL high-pass filter with cutoff at **${fc.toFixed(1)} Hz**.`,
      components: `R = ${formatValue(R, 'Ω')}, L = ${formatValue(L, 'H')}`,
      behavior: `Passes frequencies above ${fc.toFixed(1)} Hz.`,
      formula: `fc = R / (2πL) = ${fc.toFixed(1)} Hz`,
    }),
    validation: { valid: true, warnings: [], errors: [] },
    powerAnalysis: { totalCurrent: 'Signal-dependent', powerDissipation: 'Negligible (passive)' },
  };
}

function buildRLCBandPass(params) {
  const fc = parseFloat(params.centerFreq) || 1000;
  const Q = parseFloat(params.qualityFactor) || 5;
  const C = parseFloat(params.capacitance) || 100e-9;
  const L = 1 / (Math.pow(2 * Math.PI * fc, 2) * C);
  const R = (2 * Math.PI * fc * L) / Q;
  const bw = fc / Q;

  return {
    platform: { id: 'passive', name: 'Passive Circuit' },
    components: [
      { id: 'R1', name: `R1 = ${formatValue(R, 'Ω')}`, category: 'passive', type: 'resistor', value: formatValue(R, 'Ω'), quantity: 1 },
      { id: 'L1', name: `L1 = ${formatValue(L, 'H')}`, category: 'passive', type: 'inductor', value: formatValue(L, 'H'), quantity: 1 },
      { id: 'C1', name: `C1 = ${formatValue(C, 'F')}`, category: 'passive', type: 'capacitor', value: formatValue(C, 'F'), quantity: 1 },
    ],
    connections: [
      { id: 'c1', from: { node: 'VIN', pin: '+' }, to: { node: 'R1', pin: 'P1' }, type: 'signal', label: 'Input', color: '#3b82f6' },
      { id: 'c2', from: { node: 'R1', pin: 'P2' }, to: { node: 'L1', pin: 'P1' }, type: 'signal', label: 'R→L', color: '#8b5cf6' },
      { id: 'c3', from: { node: 'L1', pin: 'P2' }, to: { node: 'C1', pin: 'P1' }, type: 'signal', label: 'L→C', color: '#8b5cf6' },
      { id: 'c4', from: { node: 'C1', pin: 'P2' }, to: { node: 'GND', pin: 'GND' }, type: 'ground', label: 'GND', color: '#1f2937' },
    ],
    netlist: buildPassiveNetlist([
      { net: 'IN', components: ['VIN+', 'R1.P1'] },
      { net: 'N1', components: ['R1.P2', 'L1.P1'] },
      { net: 'OUT', components: ['L1.P2', 'C1.P1', 'VOUT+'] },
      { net: 'GND', components: ['VIN-', 'C1.P2', 'VOUT-'] },
    ]),
    code: generateTransferFunction('RLC Band-Pass', fc, R, C, L,
      `H(s) = sRC / (s²LC + sRC + 1)\nCenter: ${fc.toFixed(1)} Hz | BW: ${bw.toFixed(1)} Hz | Q: ${Q}`),
    explanation: generatePassiveExplanation('RLC Band-Pass Filter', fc, {
      description: `A second-order RLC band-pass filter centered at **${fc.toFixed(1)} Hz**.`,
      components: `R = ${formatValue(R, 'Ω')}, L = ${formatValue(L, 'H')}, C = ${formatValue(C, 'F')}`,
      behavior: `Passes a band of frequencies around ${fc.toFixed(1)} Hz with bandwidth ${bw.toFixed(1)} Hz.`,
      formula: `fc = 1 / (2π√(LC)) = ${fc.toFixed(1)} Hz\nQ = ${Q} | BW = fc/Q = ${bw.toFixed(1)} Hz`,
    }),
    validation: { valid: true, warnings: [], errors: [] },
    powerAnalysis: { totalCurrent: 'Signal-dependent', powerDissipation: 'Negligible (passive)' },
  };
}

function buildRLCNotch(params) {
  const fc = parseFloat(params.centerFreq) || 50;
  const C = parseFloat(params.capacitance) || 1e-6;
  const L = 1 / (Math.pow(2 * Math.PI * fc, 2) * C);

  return {
    platform: { id: 'passive', name: 'Passive Circuit' },
    components: [
      { id: 'L1', name: `L1 = ${formatValue(L, 'H')}`, category: 'passive', type: 'inductor', value: formatValue(L, 'H'), quantity: 1 },
      { id: 'C1', name: `C1 = ${formatValue(C, 'F')}`, category: 'passive', type: 'capacitor', value: formatValue(C, 'F'), quantity: 1 },
    ],
    connections: [
      { id: 'c1', from: { node: 'VIN', pin: '+' }, to: { node: 'VOUT', pin: '+' }, type: 'signal', label: 'Through', color: '#3b82f6' },
      { id: 'c2', from: { node: 'VIN', pin: '+' }, to: { node: 'L1', pin: 'P1' }, type: 'signal', label: 'L branch', color: '#8b5cf6' },
      { id: 'c3', from: { node: 'L1', pin: 'P2' }, to: { node: 'C1', pin: 'P1' }, type: 'signal', label: 'LC series', color: '#8b5cf6' },
      { id: 'c4', from: { node: 'C1', pin: 'P2' }, to: { node: 'GND', pin: 'GND' }, type: 'ground', label: 'GND', color: '#1f2937' },
    ],
    netlist: buildPassiveNetlist([
      { net: 'IN/OUT', components: ['VIN+', 'VOUT+', 'L1.P1'] },
      { net: 'N1', components: ['L1.P2', 'C1.P1'] },
      { net: 'GND', components: ['VIN-', 'C1.P2', 'VOUT-'] },
    ]),
    code: generateTransferFunction('RLC Notch', fc, null, C, L,
      `Notch frequency: ${fc.toFixed(1)} Hz\nRejects a narrow band around the center frequency.`),
    explanation: generatePassiveExplanation('RLC Notch (Band-Stop) Filter', fc, {
      description: `A notch filter that rejects signals at **${fc.toFixed(1)} Hz** (e.g., 50/60Hz mains hum).`,
      components: `L = ${formatValue(L, 'H')}, C = ${formatValue(C, 'F')}`,
      behavior: `Blocks a narrow frequency band around ${fc.toFixed(1)} Hz while passing all others.`,
      formula: `fc = 1 / (2π√(LC)) = ${fc.toFixed(1)} Hz`,
    }),
    validation: { valid: true, warnings: [], errors: [] },
    powerAnalysis: { totalCurrent: 'Signal-dependent', powerDissipation: 'Negligible (passive)' },
  };
}

function buildVoltageDivider(params) {
  const vin = parseFloat(params.inputVoltage) || 12;
  const vout = parseFloat(params.outputVoltage) || 3.3;
  const iLoad = parseFloat(params.loadCurrent) || 0.001;
  const R2 = vout / iLoad;
  const R1 = (vin - vout) / iLoad;

  return {
    platform: { id: 'passive', name: 'Passive Circuit' },
    components: [
      { id: 'R1', name: `R1 = ${formatValue(R1, 'Ω')}`, category: 'passive', type: 'resistor', value: formatValue(R1, 'Ω'), quantity: 1 },
      { id: 'R2', name: `R2 = ${formatValue(R2, 'Ω')}`, category: 'passive', type: 'resistor', value: formatValue(R2, 'Ω'), quantity: 1 },
    ],
    connections: [
      { id: 'c1', from: { node: 'VIN', pin: '+' }, to: { node: 'R1', pin: 'P1' }, type: 'power', label: `${vin}V`, color: '#ef4444' },
      { id: 'c2', from: { node: 'R1', pin: 'P2' }, to: { node: 'R2', pin: 'P1' }, type: 'signal', label: `${vout.toFixed(2)}V out`, color: '#10b981' },
      { id: 'c3', from: { node: 'R2', pin: 'P2' }, to: { node: 'GND', pin: 'GND' }, type: 'ground', label: 'GND', color: '#1f2937' },
    ],
    netlist: buildPassiveNetlist([
      { net: 'VIN', components: ['VIN+', 'R1.P1'] },
      { net: 'VOUT', components: ['R1.P2', 'R2.P1'] },
      { net: 'GND', components: ['R2.P2', 'VIN-'] },
    ]),
    code: `Voltage Divider Calculator\n─────────────────────────\nVin  = ${vin}V\nVout = ${vout.toFixed(2)}V\n\nR1 = ${formatValue(R1, 'Ω')}\nR2 = ${formatValue(R2, 'Ω')}\n\nFormula: Vout = Vin × R2 / (R1 + R2)\nRatio:   ${(vout / vin * 100).toFixed(1)}%\n\nPower dissipated in R1: ${((vin - vout) * iLoad * 1000).toFixed(2)} mW\nPower dissipated in R2: ${(vout * iLoad * 1000).toFixed(2)} mW\nTotal power: ${(vin * iLoad * 1000).toFixed(2)} mW`,
    explanation: generatePassiveExplanation('Voltage Divider', null, {
      description: `Divides **${vin}V** down to **${vout.toFixed(2)}V** using two resistors.`,
      components: `R1 = ${formatValue(R1, 'Ω')}, R2 = ${formatValue(R2, 'Ω')}`,
      behavior: `Output voltage = ${vout.toFixed(2)}V (${(vout / vin * 100).toFixed(1)}% of input). Note: output is load-sensitive.`,
      formula: `Vout = Vin × R2 / (R1 + R2)`,
    }),
    validation: {
      valid: vout < vin,
      warnings: vout / vin > 0.9 ? ['High ratio — consider using a regulator for stability'] : [],
      errors: vout >= vin ? ['Output voltage must be less than input voltage'] : [],
    },
    powerAnalysis: {
      totalCurrent: `${(iLoad * 1000).toFixed(2)} mA`,
      powerDissipation: `${(vin * iLoad * 1000).toFixed(2)} mW total`,
    },
  };
}

function buildWheatstoneBridge(params) {
  const R1 = parseFloat(params.r1) || 1000;
  const R2 = parseFloat(params.r2) || 1000;
  const R3 = parseFloat(params.r3) || 1000;
  const Rx = parseFloat(params.rx) || 1000;
  const balanced = Math.abs((R1 * Rx) - (R2 * R3)) < 0.01;
  const Vbridge = balanced ? 0 : 'Unbalanced';

  return {
    platform: { id: 'passive', name: 'Passive Circuit' },
    components: [
      { id: 'R1', name: `R1 = ${formatValue(R1, 'Ω')}`, category: 'passive', type: 'resistor', value: formatValue(R1, 'Ω'), quantity: 1 },
      { id: 'R2', name: `R2 = ${formatValue(R2, 'Ω')}`, category: 'passive', type: 'resistor', value: formatValue(R2, 'Ω'), quantity: 1 },
      { id: 'R3', name: `R3 = ${formatValue(R3, 'Ω')}`, category: 'passive', type: 'resistor', value: formatValue(R3, 'Ω'), quantity: 1 },
      { id: 'Rx', name: `Rx = ${formatValue(Rx, 'Ω')} (unknown)`, category: 'passive', type: 'resistor', value: formatValue(Rx, 'Ω'), quantity: 1 },
    ],
    connections: [
      { id: 'c1', from: { node: 'VIN', pin: '+' }, to: { node: 'R1', pin: 'P1' }, type: 'power', label: 'Vin', color: '#ef4444' },
      { id: 'c2', from: { node: 'VIN', pin: '+' }, to: { node: 'R3', pin: 'P1' }, type: 'power', label: 'Vin', color: '#ef4444' },
      { id: 'c3', from: { node: 'R1', pin: 'P2' }, to: { node: 'R2', pin: 'P1' }, type: 'signal', label: 'VA', color: '#3b82f6' },
      { id: 'c4', from: { node: 'R3', pin: 'P2' }, to: { node: 'Rx', pin: 'P1' }, type: 'signal', label: 'VB', color: '#3b82f6' },
      { id: 'c5', from: { node: 'R2', pin: 'P2' }, to: { node: 'GND', pin: 'GND' }, type: 'ground', label: 'GND', color: '#1f2937' },
      { id: 'c6', from: { node: 'Rx', pin: 'P2' }, to: { node: 'GND', pin: 'GND' }, type: 'ground', label: 'GND', color: '#1f2937' },
    ],
    netlist: buildPassiveNetlist([
      { net: 'VIN', components: ['VIN+', 'R1.P1', 'R3.P1'] },
      { net: 'VA', components: ['R1.P2', 'R2.P1'] },
      { net: 'VB', components: ['R3.P2', 'Rx.P1'] },
      { net: 'GND', components: ['R2.P2', 'Rx.P2', 'VIN-'] },
    ]),
    code: `Wheatstone Bridge\n─────────────────\nR1 = ${formatValue(R1, 'Ω')}  |  R2 = ${formatValue(R2, 'Ω')}\nR3 = ${formatValue(R3, 'Ω')}  |  Rx = ${formatValue(Rx, 'Ω')}\n\nBalance condition: R1×Rx = R2×R3\n${R1}×${Rx} = ${R1 * Rx}  vs  ${R2}×${R3} = ${R2 * R3}\nBridge is: ${balanced ? 'BALANCED ✓' : 'UNBALANCED'}\n\nFor balance: Rx = R2×R3/R1 = ${(R2 * R3 / R1).toFixed(1)}Ω`,
    explanation: generatePassiveExplanation('Wheatstone Bridge', null, {
      description: `A Wheatstone bridge for precision resistance measurement.`,
      components: `R1=${formatValue(R1, 'Ω')}, R2=${formatValue(R2, 'Ω')}, R3=${formatValue(R3, 'Ω')}, Rx=${formatValue(Rx, 'Ω')}`,
      behavior: `Bridge is ${balanced ? 'balanced (Vab = 0)' : 'unbalanced'}. Used for sensing small resistance changes.`,
      formula: `Balance: R1×Rx = R2×R3`,
    }),
    validation: { valid: true, warnings: [], errors: [] },
  };
}

function buildCrystalOscillator(params) {
  const freq = parseFloat(params.frequency) || 16e6;
  const CL = parseFloat(params.loadCapacitance) || 18e-12;
  const Cstray = 5e-12;
  const C1C2 = 2 * (CL - Cstray);
  const C1 = C1C2;

  return {
    platform: { id: 'passive', name: 'Passive Circuit' },
    components: [
      { id: 'Y1', name: `Crystal ${formatFreq(freq)}`, category: 'passive', type: 'crystal', value: formatFreq(freq), quantity: 1 },
      { id: 'C1', name: `C1 = ${formatValue(C1, 'F')}`, category: 'passive', type: 'capacitor', value: formatValue(C1, 'F'), quantity: 1 },
      { id: 'C2', name: `C2 = ${formatValue(C1, 'F')}`, category: 'passive', type: 'capacitor', value: formatValue(C1, 'F'), quantity: 1 },
    ],
    connections: [
      { id: 'c1', from: { node: 'MCU', pin: 'XTAL1' }, to: { node: 'Y1', pin: 'P1' }, type: 'signal', label: 'XTAL1', color: '#f59e0b' },
      { id: 'c2', from: { node: 'MCU', pin: 'XTAL2' }, to: { node: 'Y1', pin: 'P2' }, type: 'signal', label: 'XTAL2', color: '#f59e0b' },
      { id: 'c3', from: { node: 'Y1', pin: 'P1' }, to: { node: 'C1', pin: 'P1' }, type: 'signal', label: 'Load C1', color: '#8b5cf6' },
      { id: 'c4', from: { node: 'Y1', pin: 'P2' }, to: { node: 'C2', pin: 'P1' }, type: 'signal', label: 'Load C2', color: '#8b5cf6' },
      { id: 'c5', from: { node: 'C1', pin: 'P2' }, to: { node: 'GND', pin: 'GND' }, type: 'ground', label: 'GND', color: '#1f2937' },
      { id: 'c6', from: { node: 'C2', pin: 'P2' }, to: { node: 'GND', pin: 'GND' }, type: 'ground', label: 'GND', color: '#1f2937' },
    ],
    netlist: buildPassiveNetlist([
      { net: 'XTAL1', components: ['MCU.XTAL1', 'Y1.P1', 'C1.P1'] },
      { net: 'XTAL2', components: ['MCU.XTAL2', 'Y1.P2', 'C2.P1'] },
      { net: 'GND', components: ['C1.P2', 'C2.P2'] },
    ]),
    code: `Crystal Oscillator Design\n─────────────────────────\nFrequency: ${formatFreq(freq)}\nLoad Capacitance (CL): ${formatValue(CL, 'F')}\nStray Capacitance: ~${formatValue(Cstray, 'F')}\n\nC1 = C2 = 2 × (CL - Cstray) = ${formatValue(C1, 'F')}\n\nPlace crystal and load caps as close to MCU as possible.\nKeep traces short to minimize stray capacitance.`,
    explanation: generatePassiveExplanation('Crystal Oscillator', null, {
      description: `Crystal oscillator circuit for ${formatFreq(freq)} clock generation.`,
      components: `Crystal: ${formatFreq(freq)}, C1 = C2 = ${formatValue(C1, 'F')}`,
      behavior: `Provides a stable clock reference at ${formatFreq(freq)} for the MCU.`,
      formula: `C_load = (C1 × C2) / (C1 + C2) + C_stray`,
    }),
    validation: { valid: true, warnings: [], errors: [] },
  };
}

function buildResistorSeries(params) {
  const values = (params.resistors || '1000,2200,4700').split(',').map(v => parseFloat(v.trim()));
  const total = values.reduce((a, b) => a + b, 0);

  return {
    platform: { id: 'passive', name: 'Passive Circuit' },
    components: values.map((v, i) => ({
      id: `R${i + 1}`, name: `R${i + 1} = ${formatValue(v, 'Ω')}`, category: 'passive', type: 'resistor', value: formatValue(v, 'Ω'), quantity: 1,
    })),
    connections: values.map((_, i) => ({
      id: `c${i + 1}`,
      from: { node: i === 0 ? 'VIN' : `R${i}`, pin: i === 0 ? '+' : 'P2' },
      to: { node: `R${i + 1}`, pin: 'P1' },
      type: 'signal', label: `Series`, color: '#3b82f6',
    })),
    netlist: buildPassiveNetlist([]),
    code: `Series Resistor Network\n─────────────────────\n${values.map((v, i) => `R${i + 1} = ${formatValue(v, 'Ω')}`).join('\n')}\n\nTotal: R_total = ${values.map(v => formatValue(v, 'Ω')).join(' + ')} = ${formatValue(total, 'Ω')}`,
    explanation: generatePassiveExplanation('Series Resistor Network', null, {
      description: `Series combination of ${values.length} resistors.`,
      components: values.map((v, i) => `R${i + 1}=${formatValue(v, 'Ω')}`).join(', '),
      behavior: `Total resistance: ${formatValue(total, 'Ω')}`,
      formula: `R_total = R1 + R2 + ... = ${formatValue(total, 'Ω')}`,
    }),
    validation: { valid: true, warnings: [], errors: [] },
  };
}

function buildResistorParallel(params) {
  const values = (params.resistors || '1000,2200,4700').split(',').map(v => parseFloat(v.trim()));
  const total = 1 / values.reduce((a, b) => a + 1 / b, 0);

  return {
    platform: { id: 'passive', name: 'Passive Circuit' },
    components: values.map((v, i) => ({
      id: `R${i + 1}`, name: `R${i + 1} = ${formatValue(v, 'Ω')}`, category: 'passive', type: 'resistor', value: formatValue(v, 'Ω'), quantity: 1,
    })),
    connections: [],
    netlist: buildPassiveNetlist([]),
    code: `Parallel Resistor Network\n───────────────────────\n${values.map((v, i) => `R${i + 1} = ${formatValue(v, 'Ω')}`).join('\n')}\n\nTotal: 1/R = ${values.map(v => `1/${formatValue(v, 'Ω')}`).join(' + ')}\nR_total = ${formatValue(total, 'Ω')}`,
    explanation: generatePassiveExplanation('Parallel Resistor Network', null, {
      description: `Parallel combination of ${values.length} resistors.`,
      components: values.map((v, i) => `R${i + 1}=${formatValue(v, 'Ω')}`).join(', '),
      behavior: `Total resistance: ${formatValue(total, 'Ω')}`,
      formula: `1/R_total = 1/R1 + 1/R2 + ... → ${formatValue(total, 'Ω')}`,
    }),
    validation: { valid: true, warnings: [], errors: [] },
  };
}

function buildImpedanceMatch(params) {
  const Zs = parseFloat(params.sourceImpedance) || 50;
  const Zl = parseFloat(params.loadImpedance) || 75;
  const fc = parseFloat(params.frequency) || 100e6;
  const Q = Math.sqrt(Math.max(Zl, Zs) / Math.min(Zl, Zs) - 1);
  let L, C;
  if (Zl > Zs) {
    L = (Q * Zs) / (2 * Math.PI * fc);
    C = Q / (2 * Math.PI * fc * Zl);
  } else {
    L = (Q * Zl) / (2 * Math.PI * fc);
    C = Q / (2 * Math.PI * fc * Zs);
  }

  return {
    platform: { id: 'passive', name: 'Passive Circuit' },
    components: [
      { id: 'L1', name: `L1 = ${formatValue(L, 'H')}`, category: 'passive', type: 'inductor', value: formatValue(L, 'H'), quantity: 1 },
      { id: 'C1', name: `C1 = ${formatValue(C, 'F')}`, category: 'passive', type: 'capacitor', value: formatValue(C, 'F'), quantity: 1 },
    ],
    connections: [],
    netlist: buildPassiveNetlist([]),
    code: `L-Network Impedance Match\n─────────────────────────\nSource: ${Zs}Ω → Load: ${Zl}Ω at ${formatFreq(fc)}\n\nQ = √(Zmax/Zmin - 1) = ${Q.toFixed(3)}\nL = ${formatValue(L, 'H')}\nC = ${formatValue(C, 'F')}\n\nTopology: ${Zl > Zs ? 'L in series, C in shunt' : 'C in series, L in shunt'}`,
    explanation: generatePassiveExplanation('L-Network Impedance Matching', null, {
      description: `Matches ${Zs}Ω source to ${Zl}Ω load at ${formatFreq(fc)}.`,
      components: `L = ${formatValue(L, 'H')}, C = ${formatValue(C, 'F')}`,
      behavior: `Achieves maximum power transfer between source and load.`,
      formula: `Q = √(Zmax/Zmin - 1) = ${Q.toFixed(3)}`,
    }),
    validation: { valid: true, warnings: [], errors: [] },
  };
}

// ─── Helpers ─────────────────────────────────────────────

function formatValue(val, unit) {
  if (unit === 'Ω') {
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)} MΩ`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(2)} kΩ`;
    return `${val.toFixed(2)} Ω`;
  }
  if (unit === 'F') {
    if (val >= 1e-3) return `${(val * 1e3).toFixed(2)} mF`;
    if (val >= 1e-6) return `${(val * 1e6).toFixed(2)} µF`;
    if (val >= 1e-9) return `${(val * 1e9).toFixed(2)} nF`;
    return `${(val * 1e12).toFixed(2)} pF`;
  }
  if (unit === 'H') {
    if (val >= 1) return `${val.toFixed(3)} H`;
    if (val >= 1e-3) return `${(val * 1e3).toFixed(2)} mH`;
    if (val >= 1e-6) return `${(val * 1e6).toFixed(2)} µH`;
    return `${(val * 1e9).toFixed(2)} nH`;
  }
  return val.toString();
}

function formatFreq(f) {
  if (f >= 1e9) return `${(f / 1e9).toFixed(2)} GHz`;
  if (f >= 1e6) return `${(f / 1e6).toFixed(2)} MHz`;
  if (f >= 1e3) return `${(f / 1e3).toFixed(2)} kHz`;
  return `${f.toFixed(2)} Hz`;
}

function buildPassiveNetlist(nets) {
  const result = {};
  nets.forEach((n, i) => {
    result[n.net || `NET_${i}`] = { name: n.net, connections: n.components.map(c => ({ component: c })) };
  });
  return {
    version: '1.0',
    platform: 'passive',
    generatedAt: new Date().toISOString(),
    nets: result,
    statistics: { totalNets: nets.length },
  };
}

function generateTransferFunction(name, fc, R, C, L, formula) {
  let text = `${name} — Transfer Function\n${'─'.repeat(40)}\n`;
  if (fc) text += `Cutoff/Center Frequency: ${formatFreq(fc)}\n`;
  if (R) text += `R = ${formatValue(R, 'Ω')}\n`;
  if (C) text += `C = ${formatValue(C, 'F')}\n`;
  if (L) text += `L = ${formatValue(L, 'H')}\n`;
  text += `\n${formula}\n`;
  return text;
}

function generatePassiveExplanation(title, fc, details) {
  let text = `## ${title}\n\n`;
  text += `${details.description}\n\n`;
  text += `### Components\n${details.components}\n\n`;
  if (details.behavior) text += `### Behavior\n${details.behavior}\n\n`;
  if (details.formula) text += `### Design Equations\n\`\`\`\n${details.formula}\n\`\`\`\n\n`;
  if (details.rolloff) text += `**Roll-off:** ${details.rolloff}\n\n`;
  if (details.phaseShift) text += `**Phase shift:** ${details.phaseShift}\n\n`;
  text += `### PCB Layout Notes\n`;
  text += `- Keep component leads short to minimize parasitic inductance\n`;
  text += `- Use ground plane for consistent return path\n`;
  if (fc && fc > 1e6) text += `- Consider SMD components for high-frequency operation\n`;
  return text;
}

module.exports = { generatePassiveCircuit };
