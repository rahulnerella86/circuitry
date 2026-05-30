/**
 * Electric Circuit Builder
 * Generates predefined passive linear circuits with custom params.
 */

function parseVal(str, defaultVal) {
  if (!str) return defaultVal;
  const num = parseFloat(str);
  if (isNaN(num)) return defaultVal;
  
  const s = str.toLowerCase();
  if (s.includes('k')) return num * 1e3;
  if (s.includes('meg') || s.includes('mΩ')) return num * 1e6;
  if (s.includes('m') && !s.includes('meg')) return num * 1e-3;
  if (s.includes('u') || s.includes('µ')) return num * 1e-6;
  if (s.includes('n')) return num * 1e-9;
  if (s.includes('p')) return num * 1e-12;
  return num;
}

function generateElectricCircuit(config) {
  const { topology, params = {} } = config;

  const nodes = [];
  const connections = [];
  let codeStr = '';
  let title = '';

  nodes.push({ id: 'vsrc', type: 'input', name: 'V_source', x: 100, y: 300 });
  nodes.push({ id: 'gnd', type: 'ground', name: 'GND', x: 100, y: 500 });
  connections.push({ id: 'src_gnd', from: { node: 'vsrc', pin: 'GND' }, to: { node: 'gnd', pin: 'IN' }, type: 'ground', color: '#1f2937', label: '' });

  if (topology === 'voltage_divider') {
    title = 'Voltage Divider';
    const vIn = params.Vin || '5.0';
    const r1 = params.R1 || '10k';
    const r2 = params.R2 || '10k';
    
    nodes.push({ id: 'r1', type: 'component', category: 'passive', name: 'R1', value: r1 + 'Ω', x: 300, y: 200 });
    nodes.push({ id: 'r2', type: 'component', category: 'passive', name: 'R2', value: r2 + 'Ω', x: 300, y: 400 });
    nodes.push({ id: 'vout', type: 'output', name: 'V_out', x: 500, y: 300 });

    connections.push({ id: 'c1', from: { node: 'vsrc', pin: 'OUT' }, to: { node: 'r1', pin: 'P1' }, type: 'power', color: '#ef4444', label: "V_in = " + vIn + "V" });
    connections.push({ id: 'c2', from: { node: 'r1', pin: 'P2' }, to: { node: 'r2', pin: 'P1' }, type: 'signal', color: '#3b82f6', label: 'V_mid' });
    connections.push({ id: 'c3', from: { node: 'r1', pin: 'P2' }, to: { node: 'vout', pin: 'IN' }, type: 'signal', color: '#3b82f6', label: 'V_out' });
    connections.push({ id: 'c4', from: { node: 'r2', pin: 'P2' }, to: { node: 'gnd', pin: 'IN' }, type: 'ground', color: '#1f2937', label: 'GND' });

    const nVin = parseVal(vIn, 5.0);
    const nR1 = parseVal(r1, 10000);
    const nR2 = parseVal(r2, 10000);
    const nVout = nVin * (nR2 / (nR1 + nR2));

    codeStr = `
Topology: Voltage Divider
V_in = ${vIn} V
R1 = ${r1}Ω
R2 = ${r2}Ω

Formula: V_out = V_in * (R2 / (R1 + R2))
V_out = ${nVin} * (${nR2} / (${nR1} + ${nR2})) = ${nVout.toFixed(3)} V
    `.trim();

  } else if (topology === 'series_rlc') {
    title = 'Series RLC Circuit';
    const vIn = params.Vin || '5.0';
    const r = params.R || '100';
    const l = params.L || '1m';
    const c = params.C || '1u';

    nodes.push({ id: 'r', type: 'component', category: 'passive', name: 'R', value: r + 'Ω', x: 250, y: 200 });
    nodes.push({ id: 'l', type: 'component', category: 'passive', name: 'L', value: l + 'H', x: 400, y: 200 });
    nodes.push({ id: 'c', type: 'component', category: 'passive', name: 'C', value: c + 'F', x: 550, y: 200 });

    connections.push({ id: 'c1', from: { node: 'vsrc', pin: 'OUT' }, to: { node: 'r', pin: 'P1' }, type: 'power', color: '#ef4444', label: vIn + "V AC" });
    connections.push({ id: 'c2', from: { node: 'r', pin: 'P2' }, to: { node: 'l', pin: 'P1' }, type: 'signal', color: '#3b82f6', label: 'A' });
    connections.push({ id: 'c3', from: { node: 'l', pin: 'P2' }, to: { node: 'c', pin: 'P1' }, type: 'signal', color: '#f59e0b', label: 'B' });
    connections.push({ id: 'c4', from: { node: 'c', pin: 'P2' }, to: { node: 'gnd', pin: 'IN' }, type: 'ground', color: '#1f2937', label: 'GND' });

    const nL = parseVal(l, 1e-3);
    const nC = parseVal(c, 1e-6);
    const f0 = 1 / (2 * Math.PI * Math.sqrt(nL * nC));

    codeStr = `
Topology: Series RLC Circuit
V_in = ${vIn}V AC
R = ${r}Ω
L = ${l}H
C = ${c}F

Resonant Frequency f_0:
f_0 = 1 / (2 * pi * sqrt(L * C))
f_0 = 1 / (2 * 3.14159 * sqrt(${nL} * ${nC}))
f_0 = ${(f0 >= 1000 ? (f0/1000).toFixed(2) + ' kHz' : f0.toFixed(2) + ' Hz')}
    `.trim();

  } else if (topology === 'wheatstone') {
    title = 'Wheatstone Bridge';
    const vIn = params.Vin || '5.0';
    const r1 = params.R1 || '100';
    const r2 = params.R2 || '100';
    const r3 = params.R3 || '100';
    const rx = params.Rx || '120';

    nodes.push({ id: 'r1', type: 'component', category: 'passive', name: 'R1', value: r1 + 'Ω', x: 250, y: 150 });
    nodes.push({ id: 'r2', type: 'component', category: 'passive', name: 'R2', value: r2 + 'Ω', x: 250, y: 350 });
    nodes.push({ id: 'r3', type: 'component', category: 'passive', name: 'R3', value: r3 + 'Ω', x: 500, y: 150 });
    nodes.push({ id: 'rx', type: 'component', category: 'passive', name: 'Rx', value: rx + 'Ω', x: 500, y: 350 });
    
    nodes.push({ id: 'vmeter', type: 'output', name: 'V_g', x: 375, y: 250 });

    connections.push({ id: 'c1', from: { node: 'vsrc', pin: 'OUT' }, to: { node: 'r1', pin: 'P1' }, type: 'power', color: '#ef4444', label: 'V_in' });
    connections.push({ id: 'c2', from: { node: 'vsrc', pin: 'OUT' }, to: { node: 'r3', pin: 'P1' }, type: 'power', color: '#ef4444' });
    connections.push({ id: 'c3', from: { node: 'r1', pin: 'P2' }, to: { node: 'r2', pin: 'P1' }, type: 'signal', color: '#3b82f6', label: 'Node A' });
    connections.push({ id: 'c4', from: { node: 'r3', pin: 'P2' }, to: { node: 'rx', pin: 'P1' }, type: 'signal', color: '#3b82f6', label: 'Node B' });
    connections.push({ id: 'c5', from: { node: 'r2', pin: 'P2' }, to: { node: 'gnd', pin: 'IN' }, type: 'ground', color: '#1f2937' });
    connections.push({ id: 'c6', from: { node: 'rx', pin: 'P2' }, to: { node: 'gnd', pin: 'IN' }, type: 'ground', color: '#1f2937' });
    connections.push({ id: 'c7', from: { node: 'r1', pin: 'P2' }, to: { node: 'vmeter', pin: 'A' }, type: 'signal', color: '#f59e0b' });
    connections.push({ id: 'c8', from: { node: 'r3', pin: 'P2' }, to: { node: 'vmeter', pin: 'B' }, type: 'signal', color: '#f59e0b' });

    const nVin = parseVal(vIn, 5.0);
    const nR1 = parseVal(r1, 100);
    const nR2 = parseVal(r2, 100);
    const nR3 = parseVal(r3, 100);
    const nRx = parseVal(rx, 120);

    const vA = nVin * (nR2 / (nR1 + nR2));
    const vB = nVin * (nRx / (nR3 + nRx));
    const vG = vA - vB;

    codeStr = `
Topology: Wheatstone Bridge
V_in = ${vIn}V
R1 = ${r1}Ω, R2 = ${r2}Ω
R3 = ${r3}Ω, Rx = ${rx}Ω

Bridge Voltage V_g (Node A - Node B):
V_A = V_in * (R2 / (R1 + R2)) = ${(vA).toFixed(3)} V
V_B = V_in * (Rx / (R3 + Rx)) = ${(vB).toFixed(3)} V
V_g = V_A - V_B = ${(vG).toFixed(3)} V

${Math.abs(vG) < 0.001 ? 'STATUS: Bridge is BALANCED (V_g ~ 0V)' : 'STATUS: Bridge is UNBALANCED'}
    `.trim();

  } else {
    title = 'Custom / Unknown Topology';
  }

  return {
    platform: 'electric',
    validation: { valid: true, warnings: [], errors: [] },
    components: nodes.filter(n => n.type === 'component'),
    supportComponents: [],
    pinAssignments: [],
    netlist: { version: '1.0', platform: 'electric', nets: {}, statistics: { totalNets: connections.length } },
    connections,
    nodes,
    code: codeStr,
    explanation: "## Circuit Configured\nConfigured " + title + " successfully using custom parameters if provided."
  };
}

module.exports = { generateElectricCircuit };
