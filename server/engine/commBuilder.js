/**
 * Communication Interface Builder — UART/RS232/RS485, I2C bus design,
 * SPI bus, CAN bus, RF front-end.
 */

function generateCommCircuit(input) {
  const { commType = 'uart_rs232', params = {} } = input;

  const builders = {
    uart_rs232: buildRS232,
    uart_rs485: buildRS485,
    i2c_bus: buildI2CBus,
    spi_bus: buildSPIBus,
    can_bus: buildCANBus,
    level_shifter: buildLevelShifter,
  };

  const builder = builders[commType];
  if (!builder) throw new Error(`Unknown comm circuit: ${commType}`);
  return builder(params);
}

function buildRS232(params) {
  const baud = parseInt(params.baudRate) || 9600;
  const Vlogic = parseFloat(params.vlogic) || 3.3;

  return makeCommResult('RS232 Level Converter', {
    components: [
      { id: 'U1', name: 'MAX3232 Level Converter', category: 'ic', type: 'level_converter', value: 'MAX3232', quantity: 1 },
      { id: 'C1', name: 'C = 100nF (charge pump)', category: 'passive', type: 'capacitor', value: '100 nF', quantity: 4 },
      { id: 'C_decoup', name: 'C = 100nF (decoupling)', category: 'passive', type: 'capacitor', value: '100 nF', quantity: 1 },
      { id: 'CONN', name: 'DB9 Connector', category: 'mechanical', type: 'connector', value: 'DB9 Female', quantity: 1 },
    ],
    specs: `Baud: ${baud} | Logic: ${Vlogic}V → RS232 (±12V)`,
    description: `RS232 interface using MAX3232 level converter. Converts ${Vlogic}V logic to ±12V RS232 levels.`,
    behavior: `TX/RX at ${baud} baud. MAX3232 charge-pump generates ±12V from ${Vlogic}V supply.\nStandard RS232 pinout: TX (pin 3), RX (pin 2), GND (pin 5).\nMax cable length: ~15m at ${baud} baud.`,
    protocol: `8N1 (8 data bits, no parity, 1 stop bit) — most common configuration.`,
  });
}

function buildRS485(params) {
  const baud = parseInt(params.baudRate) || 9600;
  const nodes = parseInt(params.nodes) || 32;

  return makeCommResult('RS485 Half-Duplex Bus', {
    components: [
      { id: 'U1', name: 'MAX485 Transceiver', category: 'ic', type: 'transceiver', value: 'MAX485', quantity: 1 },
      { id: 'R_term', name: 'R = 120Ω (termination)', category: 'passive', type: 'resistor', value: '120 Ω', quantity: 2 },
      { id: 'R_bias', name: 'R = 560Ω (bias)', category: 'passive', type: 'resistor', value: '560 Ω', quantity: 2 },
      { id: 'TVS', name: 'TVS diode pair', category: 'discrete', type: 'tvs', value: 'SMBJ6.0CA', quantity: 1 },
    ],
    specs: `Baud: ${baud} | Bus nodes: ${nodes} | Half-duplex`,
    description: `RS485 multi-drop bus supporting up to ${nodes} nodes. Max distance: ~1200m.`,
    behavior: `Differential signaling (A/B lines). DE/RE pin controls TX/RX direction.\n120Ω termination at each end of bus. Bias resistors prevent floating bus.\nMax speed: 10 Mbps (short cable) or ${baud} baud (long cable).`,
    protocol: `Modbus RTU compatible. Address each slave device uniquely.`,
  });
}

function buildI2CBus(params) {
  const devices = parseInt(params.devices) || 4;
  const speed = params.speed || 'standard';
  const Vcc = parseFloat(params.vcc) || 3.3;
  const speedHz = speed === 'fast' ? 400000 : speed === 'fastplus' ? 1000000 : 100000;
  const Rpu = speed === 'fast' ? 2200 : speed === 'fastplus' ? 1000 : 4700;

  return makeCommResult('I2C Bus Design', {
    components: [
      { id: 'R_sda', name: `SDA Pull-up = ${Rpu/1000}kΩ`, category: 'passive', type: 'resistor', value: `${Rpu/1000} kΩ`, quantity: 1 },
      { id: 'R_scl', name: `SCL Pull-up = ${Rpu/1000}kΩ`, category: 'passive', type: 'resistor', value: `${Rpu/1000} kΩ`, quantity: 1 },
      { id: 'C_filter', name: 'Bus filter = 100pF', category: 'passive', type: 'capacitor', value: '100 pF', quantity: 2 },
    ],
    specs: `Speed: ${speed} (${(speedHz/1000)}kHz) | Devices: ${devices} | Pull-ups: ${Rpu/1000}kΩ to ${Vcc}V`,
    description: `I2C bus for ${devices} devices at ${speed} mode (${(speedHz/1000)} kHz).`,
    behavior: `2-wire bus: SDA (data) + SCL (clock), both open-drain with ${Rpu/1000}kΩ pull-ups to ${Vcc}V.\nEach device has a unique 7-bit address. Master initiates all communication.\nBus capacitance limit: 400pF total (including trace + device capacitance).`,
    protocol: `Start → Address (7-bit) + R/W → ACK → Data → ACK → ... → Stop\nMulti-master supported. Arbitration by SDA line monitoring.`,
  });
}

function buildSPIBus(params) {
  const devices = parseInt(params.devices) || 3;
  const speed = parseFloat(params.speed) || 1000000;
  const Vcc = parseFloat(params.vcc) || 3.3;

  const csNames = Array.from({ length: devices }, (_, i) => `CS${i + 1}`);

  return makeCommResult('SPI Bus Design', {
    components: [
      { id: 'R_pu', name: 'CS pull-up = 10kΩ', category: 'passive', type: 'resistor', value: '10 kΩ', quantity: devices },
      { id: 'C_decoup', name: 'Decoupling = 100nF', category: 'passive', type: 'capacitor', value: '100 nF', quantity: devices },
    ],
    specs: `Speed: ${(speed / 1e6).toFixed(1)} MHz | Devices: ${devices} | CS: ${csNames.join(', ')}`,
    description: `SPI bus with ${devices} slave devices at ${(speed / 1e6).toFixed(1)} MHz.`,
    behavior: `4-wire bus: MOSI, MISO, SCK (shared) + individual CS per device.\nEach CS line has 10kΩ pull-up to keep devices deselected by default.\nCS lines: ${csNames.join(', ')}. Active-low select.\nFull-duplex: simultaneous send/receive.`,
    protocol: `CS LOW → Clock data on MOSI/MISO → CS HIGH.\nMode 0 (CPOL=0, CPHA=0) is most common. Check device datasheet.`,
  });
}

function buildCANBus(params) {
  const baud = parseInt(params.baudRate) || 500000;
  const nodes = parseInt(params.nodes) || 8;

  return makeCommResult('CAN Bus Interface', {
    components: [
      { id: 'U1', name: 'MCP2515 CAN Controller', category: 'ic', type: 'can_controller', value: 'MCP2515', quantity: 1 },
      { id: 'U2', name: 'MCP2551 CAN Transceiver', category: 'ic', type: 'can_transceiver', value: 'MCP2551', quantity: 1 },
      { id: 'R_term', name: 'R = 120Ω (termination)', category: 'passive', type: 'resistor', value: '120 Ω', quantity: 1 },
      { id: 'C_decoup', name: 'C = 100nF', category: 'passive', type: 'capacitor', value: '100 nF', quantity: 2 },
      { id: 'Y1', name: 'Crystal 8MHz', category: 'passive', type: 'crystal', value: '8 MHz', quantity: 1 },
      { id: 'C_xtal', name: 'Crystal load caps', category: 'passive', type: 'capacitor', value: '22 pF', quantity: 2 },
    ],
    specs: `Baud: ${(baud / 1000)}kbps | Nodes: ${nodes} | Differential bus`,
    description: `CAN 2.0B bus interface using MCP2515 + MCP2551. Up to ${nodes} nodes.`,
    behavior: `Differential bus (CAN_H, CAN_L). 120Ω termination at each end.\nMCP2515 interfaces to MCU via SPI. MCP2551 handles physical layer.\nMax bus length: ~40m at 1Mbps, ~1km at 50kbps.\nBuilt-in error detection and retransmission.`,
    protocol: `Standard/Extended frames with 11/29-bit identifiers.\nPriority-based arbitration. Error frames for fault handling.\nMessage-based (not address-based).`,
  });
}

function buildLevelShifter(params) {
  const Vlow = parseFloat(params.vlow) || 3.3;
  const Vhigh = parseFloat(params.vhigh) || 5;
  const channels = parseInt(params.channels) || 4;
  const bidir = params.bidirectional !== false;

  return makeCommResult(`${bidir ? 'Bidirectional' : 'Unidirectional'} Level Shifter`, {
    components: bidir ? [
      { id: 'Q_n', name: 'BSS138 N-MOSFET', category: 'discrete', type: 'mosfet_n', value: 'BSS138', quantity: channels },
      { id: 'R_low', name: `R = 10kΩ (${Vlow}V side)`, category: 'passive', type: 'resistor', value: '10 kΩ', quantity: channels },
      { id: 'R_high', name: `R = 10kΩ (${Vhigh}V side)`, category: 'passive', type: 'resistor', value: '10 kΩ', quantity: channels },
    ] : [
      { id: 'R_div1', name: 'R1 = 1kΩ', category: 'passive', type: 'resistor', value: '1 kΩ', quantity: channels },
      { id: 'R_div2', name: 'R2 = 2kΩ', category: 'passive', type: 'resistor', value: '2 kΩ', quantity: channels },
    ],
    specs: `${Vlow}V ↔ ${Vhigh}V | ${channels} channel(s) | ${bidir ? 'Bidirectional' : 'Unidirectional'}`,
    description: `Level shifts signals between ${Vlow}V and ${Vhigh}V logic domains.${bidir ? ' Bidirectional using BSS138 MOSFET technique.' : ' Resistor divider (high→low only).'}`,
    behavior: bidir
      ? `BSS138 MOSFET with pull-ups on both sides. Works for I2C, SPI, UART.\nLow side drives LOW → MOSFET ON → pulls high side LOW.\nHigh side drives LOW → body diode conducts → pulls low side LOW.\nBoth sides HIGH → pull-ups hold lines HIGH.`
      : `Resistor divider: Vout = Vin × R2/(R1+R2) = ${Vhigh}V × ${2}/${3} = ${(Vhigh * 2 / 3).toFixed(2)}V.\nOne-direction only (${Vhigh}V → ${Vlow}V). Signal degradation at high frequencies.`,
    protocol: `Compatible with: ${bidir ? 'I2C, SPI, UART, general GPIO' : 'UART RX, digital inputs only'}`,
  });
}

// ─── Helpers ─────────────────────────────────────────────

function makeCommResult(title, opts) {
  return {
    platform: { id: 'communication', name: 'Communication Interface' },
    components: opts.components,
    connections: [],
    pinAssignments: [],
    netlist: {
      version: '1.0', platform: 'communication', generatedAt: new Date().toISOString(),
      nets: {}, statistics: { totalNodes: opts.components.length },
    },
    code: `${title}\n${'═'.repeat(40)}\n\n── Specifications ──\n${opts.specs}\n\n── Components ──\n${opts.components.map(c => `• ${c.name} (×${c.quantity})`).join('\n')}\n\n── Protocol Details ──\n${opts.protocol || 'N/A'}\n\n── Behavior ──\n${opts.behavior}`,
    explanation: `## ${title}\n\n${opts.description}\n\n### Operation\n${opts.behavior}\n\n### Protocol\n${opts.protocol || 'See datasheet'}\n\n### PCB Layout\n- Keep differential pairs (if any) matched in length\n- Route signals away from high-current switching traces\n- Use ground plane under signal traces\n- Place termination resistors at bus endpoints\n- Decoupling caps close to IC power pins`,
    validation: { valid: true, warnings: [], errors: [] },
    powerAnalysis: {
      totalCurrent: 'Depends on transceiver IC (typically 10-50mA active)',
      powerDissipation: 'Low (signal-level circuits)',
    },
  };
}

module.exports = { generateCommCircuit };
