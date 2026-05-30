/**
 * Boolean Logic Builder — Expanded with 10 categories of digital circuits.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeInput(id, name, x, y) {
  return { id, type: 'input', name, x, y };
}
function makeOutput(id, name, x, y) {
  return { id, type: 'output', name, x, y };
}
function makeGate(id, name, x, y) {
  return { id, type: 'component', name, category: 'logic', x, y };
}
function makeBlock(id, name, x, y) {
  return { id, type: 'component', name, category: 'block', x, y };
}
function wire(id, fromNode, fromPin, toNode, toPin, color, label) {
  return { id, from: { node: fromNode, pin: fromPin }, to: { node: toNode, pin: toPin }, type: 'signal', color: color || '#3b82f6', label: label || '' };
}

/**
 * Generate a block-level diagram: inputs -> central block -> outputs
 */
function blockDiagram({ blockId, blockName, inputs, outputs, description, truthTable }) {
  const nodes = [];
  const connections = [];
  const yStep = 60;
  const inX = 100, blockX = 400, outX = 700;
  const totalH = Math.max(inputs.length, outputs.length) * yStep;
  const blockY = totalH / 2;

  nodes.push(makeBlock(blockId, blockName, blockX, blockY));

  inputs.forEach((inp, i) => {
    const y = 60 + i * yStep;
    nodes.push(makeInput(`in_${inp}`, inp, inX, y));
    connections.push(wire(`ci_${i}`, `in_${inp}`, 'OUT', blockId, inp, '#3b82f6', inp));
  });

  outputs.forEach((out, i) => {
    const y = 60 + i * yStep;
    nodes.push(makeOutput(`out_${out}`, out, outX, y));
    connections.push(wire(`co_${i}`, blockId, out, `out_${out}`, 'IN', '#10b981', out));
  });

  const components = [{ id: blockId, name: blockName, category: 'logic', description, quantity: 1 }];

  return buildResult(nodes, connections, components, truthTable || '', description || '');
}

function buildResult(nodes, connections, components, code, explanation) {
  return {
    platform: 'logic',
    validation: { valid: true, warnings: [], errors: [] },
    components,
    supportComponents: [],
    pinAssignments: [],
    netlist: { version: '1.0', platform: 'logic', nets: {}, statistics: { totalConnections: connections.length, totalNodes: nodes.length } },
    connections, nodes, code,
    explanation
  };
}

// ─── 1. Basic Logic Gates ───────────────────────────────────────────────────

function gateSimple(gateName, expr) {
  const isNot = gateName === 'NOT';
  const nodes = [
    makeInput('in_A', 'A', 100, 100),
    ...(!isNot ? [makeInput('in_B', 'B', 100, 240)] : []),
    makeGate('gate', gateName, 350, isNot ? 100 : 170),
    makeOutput('out_Y', 'Y', 600, isNot ? 100 : 170)
  ];
  const connections = [
    wire('c1', 'in_A', 'OUT', 'gate', 'IN1', '#3b82f6', 'A'),
    ...(!isNot ? [wire('c2', 'in_B', 'OUT', 'gate', 'IN2', '#3b82f6', 'B')] : []),
    wire('c3', 'gate', 'OUT', 'out_Y', 'IN', '#10b981', `Y = ${expr}`)
  ];
  const tt = isNot
    ? 'A | Y\n--|--\n0 | 1\n1 | 0'
    : `A | B | Y\n--|---|--\n0 | 0 | ${gateName === 'AND' ? 0 : gateName === 'OR' ? 0 : gateName === 'NAND' ? 1 : gateName === 'NOR' ? 1 : gateName === 'XOR' ? 0 : 1}\n0 | 1 | ${gateName === 'AND' ? 0 : gateName === 'OR' ? 1 : gateName === 'NAND' ? 1 : gateName === 'NOR' ? 0 : gateName === 'XOR' ? 1 : 0}\n1 | 0 | ${gateName === 'AND' ? 0 : gateName === 'OR' ? 1 : gateName === 'NAND' ? 1 : gateName === 'NOR' ? 0 : gateName === 'XOR' ? 1 : 0}\n1 | 1 | ${gateName === 'AND' ? 1 : gateName === 'OR' ? 1 : gateName === 'NAND' ? 0 : gateName === 'NOR' ? 0 : gateName === 'XOR' ? 0 : 1}`;
  return buildResult(nodes, connections, [{ id: 'gate', name: `${gateName} Gate`, category: 'logic', quantity: 1 }], tt, `## ${gateName} Gate\n${expr}`);
}

// ─── TOPOLOGY REGISTRY ──────────────────────────────────────────────────────

const TOPOLOGIES = {
  // 1. Basic Gates
  gate_and:  () => gateSimple('AND', 'A AND B'),
  gate_or:   () => gateSimple('OR', 'A OR B'),
  gate_not:  () => gateSimple('NOT', 'NOT A'),
  gate_nand: () => gateSimple('NAND', 'NOT(A AND B)'),
  gate_nor:  () => gateSimple('NOR', 'NOT(A OR B)'),
  gate_xor:  () => gateSimple('XOR', 'A XOR B'),
  gate_xnor: () => gateSimple('XNOR', 'NOT(A XOR B)'),

  // 2. Multiplexing / Routing
  mux_2_1: () => {
    const nodes = [
      makeInput('in_d0', 'D0', 100, 100), makeInput('in_d1', 'D1', 100, 300),
      makeInput('in_sel', 'Sel', 100, 200),
      makeGate('gate_not', 'NOT', 250, 140), makeGate('gate_and1', 'AND', 400, 120),
      makeGate('gate_and2', 'AND', 400, 280), makeGate('gate_or', 'OR', 600, 200),
      makeOutput('out_y', 'Y', 800, 200)
    ];
    const connections = [
      wire('c1','in_d0','OUT','gate_and1','IN1','#3b82f6'),
      wire('c2','in_sel','OUT','gate_not','IN','#8b5cf6','Sel'),
      wire('c3','gate_not','OUT','gate_and1','IN2','#f43f5e','!Sel'),
      wire('c4','in_sel','OUT','gate_and2','IN1','#8b5cf6'),
      wire('c5','in_d1','OUT','gate_and2','IN2','#3b82f6'),
      wire('c6','gate_and1','OUT','gate_or','IN1','#10b981'),
      wire('c7','gate_and2','OUT','gate_or','IN2','#10b981'),
      wire('c8','gate_or','OUT','out_y','IN','#f59e0b','Y')
    ];
    return buildResult(nodes, connections,
      nodes.filter(n=>n.type==='component').map(n=>({id:n.id,name:n.name,category:'logic',quantity:1})),
      "Sel|D0|D1||Y\n 0 | 0| X||0\n 0 | 1| X||1\n 1 | X| 0||0\n 1 | X| 1||1",
      "## 2:1 MUX\nSelects D0 when Sel=0, D1 when Sel=1."
    );
  },
  mux_4_1:  () => blockDiagram({ blockId:'mux4', blockName:'4:1 MUX', inputs:['D0','D1','D2','D3','S0','S1'], outputs:['Y'], description:'4-to-1 Multiplexer. Selects one of 4 inputs.', truthTable:'S1|S0||Y\n0 |0 ||D0\n0 |1 ||D1\n1 |0 ||D2\n1 |1 ||D3' }),
  mux_8_1:  () => blockDiagram({ blockId:'mux8', blockName:'8:1 MUX', inputs:['D0','D1','D2','D3','D4','D5','D6','D7','S0','S1','S2'], outputs:['Y'], description:'8-to-1 Multiplexer.', truthTable:'S2|S1|S0||Y\n0 |0 |0 ||D0\n0 |0 |1 ||D1\n0 |1 |0 ||D2\n0 |1 |1 ||D3\n1 |0 |0 ||D4\n1 |0 |1 ||D5\n1 |1 |0 ||D6\n1 |1 |1 ||D7' }),
  mux_16_1: () => blockDiagram({ blockId:'mux16', blockName:'16:1 MUX', inputs:['D0-D15','S0','S1','S2','S3'], outputs:['Y'], description:'16-to-1 Multiplexer.', truthTable:'S3|S2|S1|S0||Y\n0 |0 |0 |0 ||D0\n0 |0 |0 |1 ||D1\n0 |0 |1 |0 ||D2\n0 |0 |1 |1 ||D3\n0 |1 |0 |0 ||D4\n0 |1 |0 |1 ||D5\n0 |1 |1 |0 ||D6\n0 |1 |1 |1 ||D7\n1 |0 |0 |0 ||D8\n1 |0 |0 |1 ||D9\n1 |0 |1 |0 ||D10\n1 |0 |1 |1 ||D11\n1 |1 |0 |0 ||D12\n1 |1 |0 |1 ||D13\n1 |1 |1 |0 ||D14\n1 |1 |1 |1 ||D15' }),
  demux_1_2:() => blockDiagram({ blockId:'dmx2', blockName:'1:2 DEMUX', inputs:['D','Sel'], outputs:['Y0','Y1'], description:'1-to-2 Demultiplexer.', truthTable:'Sel|D||Y0|Y1\n0  |0||0 |0\n0  |1||1 |0\n1  |0||0 |0\n1  |1||0 |1' }),
  demux_1_4:() => blockDiagram({ blockId:'dmx4', blockName:'1:4 DEMUX', inputs:['D','S0','S1'], outputs:['Y0','Y1','Y2','Y3'], description:'1-to-4 Demultiplexer.', truthTable:'S1|S0||Active Out\n0 |0 ||Y0 = D\n0 |1 ||Y1 = D\n1 |0 ||Y2 = D\n1 |1 ||Y3 = D' }),
  demux_1_8:() => blockDiagram({ blockId:'dmx8', blockName:'1:8 DEMUX', inputs:['D','S0','S1','S2'], outputs:['Y0','Y1','Y2','Y3','Y4','Y5','Y6','Y7'], description:'1-to-8 Demultiplexer.', truthTable:'S2|S1|S0||Active Out\n0 |0 |0 ||Y0 = D\n0 |0 |1 ||Y1 = D\n0 |1 |0 ||Y2 = D\n0 |1 |1 ||Y3 = D\n1 |0 |0 ||Y4 = D\n1 |0 |1 ||Y5 = D\n1 |1 |0 ||Y6 = D\n1 |1 |1 ||Y7 = D' }),

  // 3. Arithmetic Circuits
  half_adder: () => {
    const nodes = [
      makeInput('in_a','A',100,100), makeInput('in_b','B',100,240),
      makeGate('gate_xor','XOR',400,100), makeGate('gate_and','AND',400,240),
      makeOutput('out_sum','Sum',700,100), makeOutput('out_carry','Carry',700,240)
    ];
    const connections = [
      wire('c1','in_a','OUT','gate_xor','IN1','#3b82f6','A'), wire('c2','in_b','OUT','gate_xor','IN2','#3b82f6','B'),
      wire('c3','in_a','OUT','gate_and','IN1','#3b82f6','A'), wire('c4','in_b','OUT','gate_and','IN2','#3b82f6','B'),
      wire('c5','gate_xor','OUT','out_sum','IN','#10b981','Sum'), wire('c6','gate_and','OUT','out_carry','IN','#8b5cf6','Carry')
    ];
    return buildResult(nodes, connections, [{id:'gate_xor',name:'XOR Gate',category:'logic',quantity:1},{id:'gate_and',name:'AND Gate',category:'logic',quantity:1}],
      "A|B||Sum|Carry\n0|0||0|0\n0|1||1|0\n1|0||1|0\n1|1||0|1", "## Half Adder\nSum = A XOR B, Carry = A AND B.");
  },
  full_adder: () => {
    const nodes = [
      makeInput('in_a','A',100,80), makeInput('in_b','B',100,160), makeInput('in_cin','Cin',100,240),
      makeGate('xor1','XOR',300,120), makeGate('xor2','XOR',500,160),
      makeGate('and1','AND',300,280), makeGate('and2','AND',500,240),
      makeGate('or1','OR',700,260),
      makeOutput('out_sum','Sum',850,160), makeOutput('out_cout','Cout',850,260)
    ];
    const connections = [
      wire('c1','in_a','OUT','xor1','IN1','#3b82f6'), wire('c2','in_b','OUT','xor1','IN2','#3b82f6'),
      wire('c3','xor1','OUT','xor2','IN1','#14b89a'), wire('c4','in_cin','OUT','xor2','IN2','#8b5cf6'),
      wire('c5','xor2','OUT','out_sum','IN','#2dd4bf','Sum'),
      wire('c6','xor1','OUT','and2','IN1','#14b89a'), wire('c7','in_cin','OUT','and2','IN2','#8b5cf6'),
      wire('c8','in_a','OUT','and1','IN1','#3b82f6'), wire('c9','in_b','OUT','and1','IN2','#3b82f6'),
      wire('c10','and2','OUT','or1','IN1','#f59e0b'), wire('c11','and1','OUT','or1','IN2','#f59e0b'),
      wire('c12','or1','OUT','out_cout','IN','#ef4444','Cout')
    ];
    return buildResult(nodes, connections, nodes.filter(n=>n.type==='component').map(n=>({id:n.id,name:n.name+' Gate',category:'logic',quantity:1})),
      "A|B|Cin||Sum|Cout\n0|0|0||0|0\n0|0|1||1|0\n0|1|0||1|0\n0|1|1||0|1\n1|0|0||1|0\n1|0|1||0|1\n1|1|0||0|1\n1|1|1||1|1",
      "## Full Adder\nAdds A + B + Cin, outputs Sum and Cout.");
  },
  half_subtractor: () => {
    const nodes = [
      makeInput('in_a','A',100,100), makeInput('in_b','B',100,240),
      makeGate('xor','XOR',400,100), makeGate('not','NOT',250,240), makeGate('and','AND',400,280),
      makeOutput('out_diff','Diff',600,100), makeOutput('out_borr','Borrow',600,280)
    ];
    const connections = [
      wire('c1','in_a','OUT','xor','IN1','#3b82f6','A'), wire('c2','in_b','OUT','xor','IN2','#3b82f6','B'),
      wire('c3','in_a','OUT','not','IN','#3b82f6','A'), wire('c4','not','OUT','and','IN1','#f43f5e','!A'),
      wire('c5','in_b','OUT','and','IN2','#3b82f6','B'),
      wire('c6','xor','OUT','out_diff','IN','#10b981','Diff'), wire('c7','and','OUT','out_borr','IN','#8b5cf6','Borrow')
    ];
    return buildResult(nodes, connections, nodes.filter(n=>n.type==='component').map(n=>({id:n.id,name:n.name+' Gate',category:'logic',quantity:1})),
      "A|B||Diff|Borrow\n0|0||0|0\n0|1||1|1\n1|0||1|0\n1|1||0|0", "## Half Subtractor\nDiff = A XOR B, Borrow = !A AND B.");
  },
  full_subtractor: () => blockDiagram({ blockId:'fsub', blockName:'Full Subtractor', inputs:['A','B','Bin'], outputs:['Diff','Bout'], description:'Full Subtractor: Diff = A⊕B⊕Bin, Bout = (!A·B) + ((!A⊕B)·Bin)', truthTable:"A|B|Bin||Diff|Bout\n0|0|0||0|0\n0|0|1||1|1\n0|1|0||1|1\n0|1|1||0|1\n1|0|0||1|0\n1|0|1||0|0\n1|1|0||0|0\n1|1|1||1|1" }),
  ripple_carry_adder: () => blockDiagram({ blockId:'rca', blockName:'4-bit Ripple Carry Adder', inputs:['A3-A0','B3-B0','Cin'], outputs:['S3-S0','Cout'], description:'Cascaded full adders with carry propagation.', truthTable:'Bit|A|B|Cin||Sum|Cout\nEach|A|B|Cin||A⊕B⊕Cin|AB+(A⊕B)Cin\n0th |0|0|0  ||0  |0\n0th |1|1|0  ||0  |1\n0th |1|1|1  ||1  |1' }),
  carry_lookahead:    () => blockDiagram({ blockId:'cla', blockName:'4-bit Carry Lookahead Adder', inputs:['A3-A0','B3-B0','C0'], outputs:['S3-S0','C4','PG','GG'], description:'Uses generate/propagate for fast carry calculation.', truthTable:'A|B||G=AB|P=A⊕B\n0|0||0   |0\n0|1||0   |1\n1|0||0   |1\n1|1||1   |0\nCarry: C[i+1] = G[i] + P[i]·C[i]' }),

  // 4. Encoding / Decoding
  encoder:          () => blockDiagram({ blockId:'enc', blockName:'4:2 Encoder', inputs:['D0','D1','D2','D3'], outputs:['Y1','Y0'], description:'Encodes active input to binary output.', truthTable:'D3|D2|D1|D0||Y1|Y0\n0 |0 |0 |1 ||0 |0\n0 |0 |1 |0 ||0 |1\n0 |1 |0 |0 ||1 |0\n1 |0 |0 |0 ||1 |1' }),
  priority_encoder: () => blockDiagram({ blockId:'penc', blockName:'4:2 Priority Encoder', inputs:['D0','D1','D2','D3'], outputs:['Y1','Y0','V'], description:'Encodes highest-priority active input. V=valid.', truthTable:'D3|D2|D1|D0||Y1|Y0|V\n0 |0 |0 |0 ||X |X |0\n0 |0 |0 |1 ||0 |0 |1\n0 |0 |1 |X ||0 |1 |1\n0 |1 |X |X ||1 |0 |1\n1 |X |X |X ||1 |1 |1' }),
  decoder_2_4:      () => blockDiagram({ blockId:'dec24', blockName:'2→4 Decoder', inputs:['A0','A1','EN'], outputs:['Y0','Y1','Y2','Y3'], description:'Decodes 2-bit input to one of 4 outputs.', truthTable:'EN|A1|A0||Y0|Y1|Y2|Y3\n0 |X |X ||0 |0 |0 |0\n1 |0 |0 ||1 |0 |0 |0\n1 |0 |1 ||0 |1 |0 |0\n1 |1 |0 ||0 |0 |1 |0\n1 |1 |1 ||0 |0 |0 |1' }),
  decoder_3_8:      () => blockDiagram({ blockId:'dec38', blockName:'3→8 Decoder', inputs:['A0','A1','A2','EN'], outputs:['Y0','Y1','Y2','Y3','Y4','Y5','Y6','Y7'], description:'Decodes 3-bit input to one of 8 outputs.', truthTable:'EN|A2|A1|A0||Active\n0 |X |X |X ||None\n1 |0 |0 |0 ||Y0\n1 |0 |0 |1 ||Y1\n1 |0 |1 |0 ||Y2\n1 |0 |1 |1 ||Y3\n1 |1 |0 |0 ||Y4\n1 |1 |0 |1 ||Y5\n1 |1 |1 |0 ||Y6\n1 |1 |1 |1 ||Y7' }),
  decoder_4_16:     () => blockDiagram({ blockId:'dec416', blockName:'4→16 Decoder', inputs:['A0','A1','A2','A3','EN'], outputs:['Y0-Y15'], description:'Decodes 4-bit input to one of 16 outputs.', truthTable:'EN|A3|A2|A1|A0||Active\n0 |X |X |X |X ||None\n1 |0 |0 |0 |0 ||Y0\n1 |0 |0 |0 |1 ||Y1\n1 |1 |1 |1 |1 ||Y15' }),
  bcd_7seg:         () => blockDiagram({ blockId:'bcd7', blockName:'BCD to 7-Segment', inputs:['A','B','C','D'], outputs:['a','b','c','d','e','f','g'], description:'Converts BCD to 7-segment display signals.', truthTable:'D|C|B|A||a|b|c|d|e|f|g|Digit\n0|0|0|0||1|1|1|1|1|1|0|0\n0|0|0|1||0|1|1|0|0|0|0|1\n0|0|1|0||1|1|0|1|1|0|1|2\n0|0|1|1||1|1|1|1|0|0|1|3\n0|1|0|0||0|1|1|0|0|1|1|4\n0|1|0|1||1|0|1|1|0|1|1|5\n0|1|1|0||1|0|1|1|1|1|1|6\n0|1|1|1||1|1|1|0|0|0|0|7\n1|0|0|0||1|1|1|1|1|1|1|8\n1|0|0|1||1|1|1|1|0|1|1|9' }),
  gray_converter:   () => blockDiagram({ blockId:'gray', blockName:'Binary ↔ Gray Converter', inputs:['B3','B2','B1','B0'], outputs:['G3','G2','G1','G0'], description:'Converts between Binary and Gray code. G[i] = B[i] XOR B[i+1].', truthTable:'Binary||Gray\n0000  ||0000\n0001  ||0001\n0010  ||0011\n0011  ||0010\n0100  ||0110\n0101  ||0111\n0110  ||0101\n0111  ||0100\n1000  ||1100' }),

  // 5. Comparison & Error Detection
  comparator:     () => blockDiagram({ blockId:'cmp', blockName:'4-bit Magnitude Comparator', inputs:['A3-A0','B3-B0'], outputs:['A>B','A=B','A<B'], description:'Compares two 4-bit numbers.', truthTable:'Condition||A>B|A=B|A<B\nA > B    ||1  |0  |0\nA = B    ||0  |1  |0\nA < B    ||0  |0  |1' }),
  parity_gen:     () => blockDiagram({ blockId:'pgen', blockName:'Parity Generator', inputs:['D3','D2','D1','D0'], outputs:['P (even)','P (odd)'], description:'Generates even/odd parity bit for input data.', truthTable:'D3|D2|D1|D0||P_even|P_odd\n0 |0 |0 |0 ||0    |1\n0 |0 |0 |1 ||1    |0\n0 |0 |1 |0 ||1    |0\n0 |0 |1 |1 ||0    |1\n0 |1 |0 |0 ||1    |0\n1 |1 |1 |1 ||0    |1' }),
  parity_checker: () => blockDiagram({ blockId:'pchk', blockName:'Parity Checker', inputs:['D3','D2','D1','D0','P'], outputs:['Error'], description:'Checks parity and flags errors.', truthTable:'D3⊕D2⊕D1⊕D0⊕P||Error\nEven (0)        ||0\nOdd  (1)        ||1' }),

  // 6. Sequential Circuits (Flip-Flops)
  ff_sr: () => blockDiagram({ blockId:'srff', blockName:'SR Flip-Flop', inputs:['S','R','CLK'], outputs:['Q','Q̄'], description:'Set-Reset flip-flop. S=1→Q=1, R=1→Q=0.', truthTable:'S|R||Q\n0|0||Qprev\n0|1||0\n1|0||1\n1|1||Invalid' }),
  ff_jk: () => blockDiagram({ blockId:'jkff', blockName:'JK Flip-Flop', inputs:['J','K','CLK'], outputs:['Q','Q̄'], description:'Universal flip-flop. J=K=1 toggles output.', truthTable:'J|K||Q\n0|0||Qprev\n0|1||0\n1|0||1\n1|1||Toggle' }),
  ff_d:  () => blockDiagram({ blockId:'dff', blockName:'D Flip-Flop', inputs:['D','CLK'], outputs:['Q','Q̄'], description:'Data flip-flop. Q follows D on clock edge.', truthTable:'D||Q\n0||0\n1||1' }),
  ff_t:  () => blockDiagram({ blockId:'tff', blockName:'T Flip-Flop', inputs:['T','CLK'], outputs:['Q','Q̄'], description:'Toggle flip-flop. T=1 toggles Q.', truthTable:'T||Q\n0||Qprev\n1||Toggle' }),

  // 7. Registers
  reg_siso: () => blockDiagram({ blockId:'siso', blockName:'SISO Shift Register', inputs:['Serial In','CLK'], outputs:['Serial Out'], description:'Serial-In Serial-Out. Data shifts one bit per clock.', truthTable:'CLK↑|Serial In||Q3→Q2→Q1→Q0→Out\n1st |1        ||1,0,0,0→0\n2nd |0        ||0,1,0,0→0\n3rd |1        ||1,0,1,0→0\n4th |0        ||0,1,0,1→1' }),
  reg_sipo: () => blockDiagram({ blockId:'sipo', blockName:'SIPO Shift Register', inputs:['Serial In','CLK'], outputs:['Q3','Q2','Q1','Q0'], description:'Serial-In Parallel-Out. Loads serially, reads in parallel.', truthTable:'CLK↑|SIn||Q3|Q2|Q1|Q0\n1st |1  ||0 |0 |0 |1\n2nd |0  ||0 |0 |1 |0\n3rd |1  ||0 |1 |0 |1\n4th |1  ||1 |0 |1 |1' }),
  reg_piso: () => blockDiagram({ blockId:'piso', blockName:'PISO Shift Register', inputs:['D3','D2','D1','D0','LOAD','CLK'], outputs:['Serial Out'], description:'Parallel-In Serial-Out. Loads in parallel, shifts out serially.', truthTable:'LOAD|CLK↑||Action|Serial Out\n1   |↑   ||Load D3D2D1D0|D0\n0   |↑   ||Shift right  |D1\n0   |↑   ||Shift right  |D2\n0   |↑   ||Shift right  |D3' }),
  reg_pipo: () => blockDiagram({ blockId:'pipo', blockName:'PIPO Register', inputs:['D3','D2','D1','D0','CLK'], outputs:['Q3','Q2','Q1','Q0'], description:'Parallel-In Parallel-Out. Loads and reads in parallel.', truthTable:'CLK↑|D3|D2|D1|D0||Q3|Q2|Q1|Q0\n↑   |1 |0 |1 |0 ||1 |0 |1 |0\n↑   |0 |1 |1 |1 ||0 |1 |1 |1' }),
  reg_universal: () => blockDiagram({ blockId:'ureg', blockName:'Universal Shift Register', inputs:['D3-D0','Serial In','S1','S0','CLK','CLR'], outputs:['Q3','Q2','Q1','Q0'], description:'Supports SISO, SIPO, PISO, PIPO via mode select (S1,S0).', truthTable:'S1|S0||Mode\n0 |0 ||No change (hold)\n0 |1 ||Shift Right (SISO)\n1 |0 ||Shift Left\n1 |1 ||Parallel Load (PIPO)' }),

  // 8. Counters
  counter_ripple:  () => blockDiagram({ blockId:'rctr', blockName:'4-bit Ripple Counter', inputs:['CLK','CLR'], outputs:['Q3','Q2','Q1','Q0'], description:'Asynchronous counter. Each flip-flop clocked by previous stage.', truthTable:'CLK↑||Q3|Q2|Q1|Q0|Decimal\n0   ||0 |0 |0 |0 |0\n1   ||0 |0 |0 |1 |1\n2   ||0 |0 |1 |0 |2\n3   ||0 |0 |1 |1 |3\n15  ||1 |1 |1 |1 |15\n16  ||0 |0 |0 |0 |0 (reset)' }),
  counter_sync:    () => blockDiagram({ blockId:'sctr', blockName:'4-bit Synchronous Counter', inputs:['CLK','CLR','EN'], outputs:['Q3','Q2','Q1','Q0'], description:'All flip-flops share the same clock for glitch-free counting.', truthTable:'EN|CLR|CLK↑||Action\n0 |0  |↑   ||Hold\n1 |0  |↑   ||Count up\n1 |1  |↑   ||Reset to 0\nX |1  |X   ||Async clear' }),
  counter_updown:  () => blockDiagram({ blockId:'udctr', blockName:'Up/Down Counter', inputs:['CLK','UP/DN','CLR','EN'], outputs:['Q3','Q2','Q1','Q0'], description:'Counts up or down based on UP/DN control.', truthTable:'EN|UP/DN|CLK↑||Action\n0 |X    |↑   ||Hold\n1 |1    |↑   ||Count Up\n1 |0    |↑   ||Count Down' }),
  counter_modn:    () => blockDiagram({ blockId:'modn', blockName:'Mod-N Counter', inputs:['CLK','CLR'], outputs:['Q3-Q0','TC'], description:'Counts from 0 to N-1 then resets. TC = terminal count.', truthTable:'Count||Q3-Q0|TC\n0    ||0000 |0\n1    ||0001 |0\nN-2  ||N-2  |0\nN-1  ||N-1  |1 (reset next)' }),
  counter_ring:    () => blockDiagram({ blockId:'ring', blockName:'Ring Counter', inputs:['CLK','PRESET'], outputs:['Q3','Q2','Q1','Q0'], description:'Circulates a single 1-bit through the register. Only one output high at a time.', truthTable:'CLK↑||Q3|Q2|Q1|Q0\nInit ||1 |0 |0 |0\n1st  ||0 |1 |0 |0\n2nd  ||0 |0 |1 |0\n3rd  ||0 |0 |0 |1\n4th  ||1 |0 |0 |0' }),
  counter_johnson: () => blockDiagram({ blockId:'john', blockName:'Johnson Counter', inputs:['CLK','CLR'], outputs:['Q3','Q2','Q1','Q0'], description:'Twisted ring counter. Inverted output fed back. 2N unique states.', truthTable:'CLK↑||Q3|Q2|Q1|Q0\nInit ||0 |0 |0 |0\n1st  ||1 |0 |0 |0\n2nd  ||1 |1 |0 |0\n3rd  ||1 |1 |1 |0\n4th  ||1 |1 |1 |1\n5th  ||0 |1 |1 |1\n6th  ||0 |0 |1 |1\n7th  ||0 |0 |0 |1\n8th  ||0 |0 |0 |0' }),

  // 9. Control Systems
  moore_machine: () => blockDiagram({ blockId:'moore', blockName:'Moore State Machine', inputs:['Input','CLK','RST'], outputs:['Output','State'], description:'Output depends only on current state. Next-state logic + state register + output logic.', truthTable:'State|Input||Next State|Output\nS0   |0    ||S0       |0\nS0   |1    ||S1       |0\nS1   |0    ||S0       |1\nS1   |1    ||S1       |1' }),
  mealy_machine: () => blockDiagram({ blockId:'mealy', blockName:'Mealy State Machine', inputs:['Input','CLK','RST'], outputs:['Output','State'], description:'Output depends on current state AND input. Generally uses fewer states than Moore.', truthTable:'State|Input||Next State|Output\nS0   |0    ||S0       |0\nS0   |1    ||S1       |1\nS1   |0    ||S0       |0\nS1   |1    ||S1       |1' }),

  // 10. Advanced Blocks
  alu:            () => blockDiagram({ blockId:'alu', blockName:'4-bit ALU (74181-style)', inputs:['A3-A0','B3-B0','S3-S0','M','Cin'], outputs:['F3-F0','Cout','A=B'], description:'Performs 16 arithmetic and 16 logic operations based on select lines S and mode M.', truthTable:'M|S3-S0||Function (M=1 Logic)\n1|0000 ||F = !A\n1|0001 ||F = !(A+B)\n1|0110 ||F = A⊕B\n1|1001 ||F = A XNOR B\n1|1110 ||F = A+B (OR)\nM|S3-S0||Function (M=0 Arith)\n0|0000 ||F = A\n0|0110 ||F = A-B-1\n0|1001 ||F = A+B\n0|1100 ||F = A+A (2A)' }),
  barrel_shifter: () => blockDiagram({ blockId:'bshft', blockName:'Barrel Shifter', inputs:['D7-D0','Shift[2:0]','Dir'], outputs:['Y7-Y0'], description:'Shifts/rotates input by any amount in a single clock cycle.', truthTable:'Shift|Dir||Operation\n000  |0  ||No shift\n001  |0  ||Right 1\n010  |0  ||Right 2\n011  |0  ||Right 3\n001  |1  ||Left 1\n010  |1  ||Left 2' }),
  ram:            () => blockDiagram({ blockId:'ram', blockName:'Static RAM (16×4)', inputs:['A3-A0','D3-D0','WE','OE','CS'], outputs:['Q3-Q0'], description:'16 locations × 4-bit wide SRAM. WE=write, OE=output enable.', truthTable:'CS|WE|OE||Operation\n0 |X |X ||Disabled (Hi-Z)\n1 |0 |0 ||Hi-Z\n1 |0 |1 ||Read: Q = MEM[A]\n1 |1 |0 ||Write: MEM[A] = D\n1 |1 |1 ||Write (data on bus)' }),
  rom:            () => blockDiagram({ blockId:'rom', blockName:'ROM (16×4)', inputs:['A3-A0','CS'], outputs:['D3-D0'], description:'Read-only memory. 16 locations × 4-bit, pre-programmed.', truthTable:'CS|A3-A0||D3-D0\n0 |XXXX ||Hi-Z\n1 |0000 ||Data[0]\n1 |0001 ||Data[1]\n1 |1111 ||Data[15]' }),
  pla:            () => blockDiagram({ blockId:'pla', blockName:'PLA', inputs:['I3-I0'], outputs:['O3-O0'], description:'Programmable Logic Array. Programmable AND plane + programmable OR plane.', truthTable:'Input||AND Plane||OR Plane||Output\nI3-I0||Product terms||Sum terms||O3-O0\n(Fully programmable both planes)' }),
  pal:            () => blockDiagram({ blockId:'pal', blockName:'PAL', inputs:['I3-I0'], outputs:['O3-O0'], description:'Programmable Array Logic. Programmable AND plane + fixed OR plane.', truthTable:'Input||AND Plane||OR Plane||Output\nI3-I0||Programmable||Fixed   ||O3-O0\n(Only AND plane programmable)' }),
};

// ─── Main Entry ─────────────────────────────────────────────────────────────

// ─── Custom Boolean Parser & AST Logic ────────────────────────────────────────

const PRECEDENCE = { '!': 4, '~': 4, '&': 3, '*': 3, '^': 2, '|': 1, '+': 1 };
const isOp = (t) => Object.keys(PRECEDENCE).includes(t);
const isVar = (t) => /^[a-zA-Z_]\w*$/.test(t);

function tokenize(expr) {
  const spaced = expr.replace(/([&\|\^\!\~\(\)\*\+])/g, ' $1 ');
  return spaced.split(/\s+/).filter(t => t.length > 0);
}

function parseAST(tokens) {
  const opStack = [];
  const outQueue = [];

  const popOp = () => {
    const op = opStack.pop();
    if (op === '!' || op === '~') {
      if (outQueue.length === 0) throw new Error("Invalid Logic Syntax: Missing operand for NOT");
      const operand = outQueue.pop();
      outQueue.push({ type: 'NOT', child: operand });
    } else {
      if (outQueue.length < 2) throw new Error("Invalid Logic Syntax: Missing operands for " + op);
      const right = outQueue.pop();
      const left = outQueue.pop();
      const opName = (op === '&' || op === '*') ? 'AND' : (op === '|' || op === '+') ? 'OR' : 'XOR';
      outQueue.push({ type: 'OP', op: opName, left, right });
    }
  };
  
  for (const token of tokens) {
    if (isVar(token)) {
      outQueue.push({ type: 'VAR', name: token });
    } else if (isOp(token)) {
      while (opStack.length > 0 &&
             opStack[opStack.length - 1] !== '(' &&
             PRECEDENCE[opStack[opStack.length - 1]] >= PRECEDENCE[token] &&
             ['!', '~'].indexOf(token) === -1) { 
        popOp();
      }
      opStack.push(token);
    } else if (token === '(') {
      opStack.push(token);
    } else if (token === ')') {
      while (opStack.length > 0 && opStack[opStack.length - 1] !== '(') {
        popOp();
      }
      if (opStack[opStack.length - 1] === '(') {
        opStack.pop(); // discard (
      } else {
         throw new Error("Invalid Logic Syntax: Unmatched Parentheses");
      }
    }
  }

  while (opStack.length > 0) {
    if (opStack[opStack.length - 1] === '(') throw new Error('Invalid Logic Syntax: Unmatched Parentheses');
    popOp();
  }
  
  if (outQueue.length !== 1) throw new Error("Invalid Logic Syntax: Ill-formed expression");
  return outQueue[0];
}

function evaluateAST(ast, env) {
  if (!ast) return 0;
  if (ast.type === 'VAR') return env[ast.name] ? 1 : 0;
  if (ast.type === 'NOT') return 1 - evaluateAST(ast.child, env);
  
  const L = evaluateAST(ast.left, env);
  const R = evaluateAST(ast.right, env);
  if (ast.op === 'AND') return (L & R) ? 1 : 0;
  if (ast.op === 'OR') return (L | R) ? 1 : 0;
  if (ast.op === 'XOR') return (L ^ R) ? 1 : 0;
  return 0;
}

function getVariables(ast) {
  const vars = new Set();
  function walk(node) {
    if (!node) return;
    if (node.type === 'VAR') vars.add(node.name);
    if (node.type === 'NOT') walk(node.child);
    if (node.type === 'OP') { walk(node.left); walk(node.right); }
  }
  walk(ast);
  return Array.from(vars).sort();
}

function computeDepth(node) {
  if (!node) return 0;
  if (node.type === 'VAR') { node.depth = 0; return 0; }
  if (node.type === 'NOT') { node.depth = computeDepth(node.child) + 1; return node.depth; }
  if (node.type === 'OP') { node.depth = Math.max(computeDepth(node.left), computeDepth(node.right)) + 1; return node.depth; }
  return 0;
}

// ─── Main Orchestrator ──────────────────────────────────────────────────────

function generateBooleanCircuit(config) {
  const { equation, logicMode, logicTopology } = config;

  // Custom equation mode
  if (logicMode !== 'predefined') {
    if (!equation || equation.trim() === '') {
       throw new Error("No boolean expression provided");
    }

    // 1. Parse and extract Variables
    const tokens = tokenize(equation);
    const ast = parseAST(tokens);
    const vars = getVariables(ast);
    computeDepth(ast);

    // 2. Build Physical Nodes
    const nodes = [];
    const connections = [];
    const components = [];
    
    // Create unique physical inputs for each variable (left margin X = 100)
    const inputNodes = {};
    vars.forEach((v, idx) => {
       const y = 100 + idx * 80;
       nodes.push(makeInput(`in_${v}`, v, 100, y));
       inputNodes[v] = { id: `in_${v}`, pin: 'OUT', x: 100, y };
    });

    const isColliding = (x, y) => nodes.some(n => Math.abs(n.x - x) < 25 && Math.abs(n.y - y) < 40);
    let gateIdCounter = 0;

    function placeAST(node) {
      if (!node) return null;
      if (node.type === 'VAR') {
         // Feed from the standard initial variable node
         return inputNodes[node.name];
      }
      if (node.type === 'NOT') {
         const c = placeAST(node.child);
         const x = 100 + node.depth * 250;
         let y = c.y; 
         while (isColliding(x, y)) { y += 60; }
         const gId = `gate_${++gateIdCounter}`;
         nodes.push(makeGate(gId, 'NOT', x, y));
         components.push({ id: gId, name: 'NOT Gate', category: 'logic', quantity: 1 });
         connections.push(wire(`w_${gId}_in`, c.id, c.pin, gId, 'IN', '#3b82f6'));
         return { id: gId, pin: 'OUT', x, y };
      }
      if (node.type === 'OP') {
         const l = placeAST(node.left);
         const r = placeAST(node.right);
         const x = 100 + node.depth * 250;
         let y = (l.y + r.y) / 2;
         if (Math.abs(l.y - r.y) < 20) { y = Math.max(l.y, r.y) + 60; } // Disperse overlap
         while (isColliding(x, y)) { y += 60; }
         const gId = `gate_${++gateIdCounter}`;
         nodes.push(makeGate(gId, node.op, x, y));
         components.push({ id: gId, name: `${node.op} Gate`, category: 'logic', quantity: 1 });
         connections.push(wire(`w_${gId}_l`, l.id, l.pin, gId, 'IN1', '#3b82f6'));
         connections.push(wire(`w_${gId}_r`, r.id, r.pin, gId, 'IN2', '#3b82f6'));
         return { id: gId, pin: 'OUT', x, y };
      }
    }

    const finalNode = placeAST(ast);
    const outX = finalNode.x + 250;
    const outY = finalNode.y;
    nodes.push(makeOutput('out_Y', 'Y', outX, outY));
    connections.push(wire('w_out', finalNode.id, finalNode.pin, 'out_Y', 'IN', '#10b981', `Y=${equation}`));

    // 3. Build Dynamic Truth Table
    const numRows = Math.pow(2, vars.length);
    let truthTable = vars.join('|') + '||Y\n';
    for (let i = 0; i < numRows; i++) {
        // Build binary assignment
        const env = {};
        for (let b = 0; b < vars.length; b++) {
            // (i >> (vars.length - 1 - b)) extracts the top-most bit first to count correctly standard binary ordering
            env[vars[b]] = (i >> (vars.length - 1 - b)) & 1;
        }
        const yVal = evaluateAST(ast, env);
        truthTable += vars.map(v => env[v]).join('|') + '||' + yVal + '\n';
    }

    return buildResult(nodes, connections, components, truthTable, `## Parsed Circuit Expression\n${equation}`);
  }

  // Predefined topology
  const builder = TOPOLOGIES[logicTopology];
  if (!builder) {
    throw new Error(`Unknown topology: ${logicTopology}. Available: ${Object.keys(TOPOLOGIES).join(', ')}`);
  }
  return builder();
}

module.exports = { generateBooleanCircuit };
