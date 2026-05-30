/**
 * Protection Circuit Builder — ESD, overcurrent, overvoltage,
 * reverse polarity, opto-isolation.
 */

function generateProtectionCircuit(input) {
  const { protectionType = 'esd', params = {} } = input;

  const builders = {
    esd: buildESDProtection,
    overcurrent: buildOvercurrentProtection,
    overvoltage: buildOvervoltageProtection,
    crowbar: buildCrowbarProtection,
    opto_isolation: buildOptoIsolation,
    full_input: buildFullInputProtection,
  };

  const builder = builders[protectionType];
  if (!builder) throw new Error(`Unknown protection circuit: ${protectionType}`);
  return builder(params);
}

function buildESDProtection(params) {
  const Vwork = parseFloat(params.vwork) || 5;
  const channels = parseInt(params.channels) || 4;
  const tvsVoltage = Math.ceil(Vwork * 1.2);

  return makeProtResult('ESD Protection Circuit', {
    components: [
      { id: 'TVS1', name: `TVS Diode (${tvsVoltage}V)`, category: 'discrete', type: 'tvs', value: `SMBJ${tvsVoltage}A`, quantity: channels },
      { id: 'R_series', name: 'Series R = 22Ω', category: 'passive', type: 'resistor', value: '22 Ω', quantity: channels },
      { id: 'C_filter', name: 'Filter C = 100pF', category: 'passive', type: 'capacitor', value: '100 pF', quantity: channels },
    ],
    specs: `Working voltage: ${Vwork}V | Channels: ${channels} | TVS: ${tvsVoltage}V clamp`,
    description: `ESD protection for ${channels} signal lines at ${Vwork}V. TVS diodes clamp transients to ${tvsVoltage}V.`,
    behavior: `During ESD event: TVS diode clamps voltage, series resistor limits current, capacitor filters high-frequency noise.\nStandby current: <1µA per channel. Response time: <1ns.`,
  });
}

function buildOvercurrentProtection(params) {
  const Itrip = parseFloat(params.itrip) || 0.5;
  const Vwork = parseFloat(params.vwork) || 5;
  const type = params.fuseType || 'polyfuse';

  return makeProtResult('Overcurrent Protection', {
    components: type === 'polyfuse' ? [
      { id: 'PF1', name: `Polyfuse ${Itrip}A`, category: 'discrete', type: 'polyfuse', value: `${Itrip}A PTC`, quantity: 1 },
      { id: 'LED', name: 'Status LED', category: 'actuator', type: 'led', value: 'Red LED', quantity: 1 },
      { id: 'R_led', name: 'R = 1kΩ (LED)', category: 'passive', type: 'resistor', value: '1 kΩ', quantity: 1 },
    ] : [
      { id: 'F1', name: `Fuse ${Itrip}A`, category: 'discrete', type: 'fuse', value: `${Itrip}A glass fuse`, quantity: 1 },
      { id: 'Holder', name: 'Fuse holder', category: 'mechanical', type: 'holder', value: 'PCB mount', quantity: 1 },
    ],
    specs: `Trip current: ${Itrip}A | Working voltage: ${Vwork}V | Type: ${type}`,
    description: `${type === 'polyfuse' ? 'Resettable PTC' : 'Glass'} fuse protection. Trips at ${Itrip}A.`,
    behavior: type === 'polyfuse'
      ? `Polyfuse increases resistance when current exceeds ${Itrip}A. Self-resets when fault is removed. Hold current: ~${(Itrip * 0.6).toFixed(2)}A.`
      : `Glass fuse opens permanently at ${Itrip}A. Must be replaced after trip.`,
  });
}

function buildOvervoltageProtection(params) {
  const Vclamp = parseFloat(params.vclamp) || 5.5;
  const Vwork = parseFloat(params.vwork) || 5;

  return makeProtResult('Overvoltage Protection (Clamping)', {
    components: [
      { id: 'TVS1', name: `TVS Diode (${Vclamp}V)`, category: 'discrete', type: 'tvs', value: `SMBJ${Math.ceil(Vclamp)}A`, quantity: 1 },
      { id: 'F1', name: 'Polyfuse 500mA', category: 'discrete', type: 'polyfuse', value: '500mA PTC', quantity: 1 },
      { id: 'D1', name: 'Schottky Diode', category: 'discrete', type: 'diode', value: '1N5819', quantity: 1 },
    ],
    specs: `Working: ${Vwork}V | Clamp: ${Vclamp}V`,
    description: `Clamps input voltage to ${Vclamp}V. Polyfuse limits continuous overcurrent.`,
    behavior: `Normal: TVS is off (<1µA leakage). Overvoltage: TVS conducts, clamping to ${Vclamp}V. Polyfuse trips if sustained.`,
  });
}

function buildCrowbarProtection(params) {
  const Vtrip = parseFloat(params.vtrip) || 6;
  const Vwork = parseFloat(params.vwork) || 5;

  return makeProtResult('SCR Crowbar Overvoltage Protection', {
    components: [
      { id: 'SCR1', name: 'SCR (TYN612)', category: 'discrete', type: 'scr', value: 'TYN612', quantity: 1 },
      { id: 'D_zener', name: `Zener (${Vtrip}V)`, category: 'discrete', type: 'zener', value: `${Vtrip}V Zener`, quantity: 1 },
      { id: 'R1', name: 'R1 = 1 kΩ (gate)', category: 'passive', type: 'resistor', value: '1 kΩ', quantity: 1 },
      { id: 'F1', name: 'Fuse (upstream)', category: 'discrete', type: 'fuse', value: '1A fuse', quantity: 1 },
    ],
    specs: `Trip: ${Vtrip}V | Working: ${Vwork}V`,
    description: `Crowbar circuit: shorts the supply through SCR when voltage exceeds ${Vtrip}V, blowing the upstream fuse.`,
    behavior: `When V > ${Vtrip}V: Zener conducts → triggers SCR gate → SCR latches ON → supply is shorted → fuse blows.\nThis is a destructive-to-fuse, protective-to-load approach.`,
  });
}

function buildOptoIsolation(params) {
  const Viso = parseFloat(params.visolation) || 3750;
  const channels = parseInt(params.channels) || 1;

  return makeProtResult('Opto-Isolation Circuit', {
    components: [
      { id: 'U1', name: 'Optocoupler (PC817)', category: 'discrete', type: 'optocoupler', value: 'PC817', quantity: channels },
      { id: 'R_led', name: 'R = 220Ω (LED side)', category: 'passive', type: 'resistor', value: '220 Ω', quantity: channels },
      { id: 'R_pull', name: 'R = 10kΩ (collector pull-up)', category: 'passive', type: 'resistor', value: '10 kΩ', quantity: channels },
    ],
    specs: `Isolation: ${Viso}V | Channels: ${channels}`,
    description: `Galvanic isolation for ${channels} signal channel(s). ${Viso}V isolation rating.`,
    behavior: `Input side: LED inside optocoupler is driven through current-limiting resistor.\nOutput side: Phototransistor conducts when LED is lit. Pull-up on collector provides output signal.\nIsolation: up to ${Viso}Vrms between input and output grounds.`,
  });
}

function buildFullInputProtection(params) {
  const Vwork = parseFloat(params.vwork) || 12;
  const Imax = parseFloat(params.imax) || 2;

  return makeProtResult('Full Input Protection (Combo)', {
    components: [
      { id: 'F1', name: 'Polyfuse 2A', category: 'discrete', type: 'polyfuse', value: '2A PTC', quantity: 1 },
      { id: 'Q1', name: 'P-MOSFET (reverse polarity)', category: 'discrete', type: 'mosfet_p', value: 'IRF9540', quantity: 1 },
      { id: 'TVS1', name: `TVS (${Math.ceil(Vwork * 1.3)}V)`, category: 'discrete', type: 'tvs', value: `SMBJ${Math.ceil(Vwork * 1.3)}A`, quantity: 1 },
      { id: 'R_gate', name: 'Rg = 100kΩ', category: 'passive', type: 'resistor', value: '100 kΩ', quantity: 1 },
      { id: 'C_bulk', name: 'C = 100µF (bulk)', category: 'passive', type: 'capacitor', value: '100 µF', quantity: 1 },
      { id: 'C_ceramic', name: 'C = 100nF (ceramic)', category: 'passive', type: 'capacitor', value: '100 nF', quantity: 1 },
    ],
    specs: `Working: ${Vwork}V | Max current: ${Imax}A`,
    description: `Comprehensive input protection: reverse polarity (P-MOSFET) + overcurrent (polyfuse) + overvoltage (TVS) + filtering.`,
    behavior: `1. Polyfuse limits continuous overcurrent to ~${Imax}A\n2. P-MOSFET blocks reverse polarity (virtually zero voltage drop when correct)\n3. TVS clamps transient spikes above ${Math.ceil(Vwork * 1.3)}V\n4. Bulk + ceramic caps filter noise`,
  });
}

// ─── Helpers ─────────────────────────────────────────────

function makeProtResult(title, opts) {
  return {
    platform: { id: 'protection', name: 'Protection Circuit' },
    components: opts.components,
    connections: [],
    pinAssignments: [],
    netlist: {
      version: '1.0', platform: 'protection', generatedAt: new Date().toISOString(),
      nets: {}, statistics: { totalNodes: opts.components.length },
    },
    code: `${title}\n${'═'.repeat(40)}\n\n── Specifications ──\n${opts.specs}\n\n── Components ──\n${opts.components.map(c => `• ${c.name} (×${c.quantity})`).join('\n')}\n\n── Design Notes ──\n${opts.behavior}`,
    explanation: `## ${title}\n\n${opts.description}\n\n### How It Works\n${opts.behavior}\n\n### PCB Layout Notes\n- Place protection components as close to the input connector as possible\n- Use short, wide traces for current-carrying paths\n- Ground connections should be direct to ground plane\n- TVS diodes must have minimal trace inductance to be effective`,
    validation: { valid: true, warnings: [], errors: [] },
    powerAnalysis: {
      totalCurrent: 'Negligible standby current',
      powerDissipation: 'Near zero in normal operation',
      notes: 'Protection components only dissipate power during fault conditions',
    },
  };
}

module.exports = { generateProtectionCircuit };
