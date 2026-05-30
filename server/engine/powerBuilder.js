/**
 * Power Electronics Builder — LDO, Buck, Boost, Battery management,
 * solar harvesting circuits.
 */

function generatePowerCircuit(input) {
  const { powerType = 'ldo', params = {} } = input;

  const builders = {
    ldo: buildLDO,
    buck: buildBuckConverter,
    boost: buildBoostConverter,
    battery_charger: buildBatteryCharger,
    solar_harvest: buildSolarHarvest,
    reverse_polarity: buildReversePolarity,
  };

  const builder = builders[powerType];
  if (!builder) throw new Error(`Unknown power circuit: ${powerType}`);
  return builder(params);
}

function buildLDO(params) {
  const Vin = parseFloat(params.vin) || 9;
  const Vout = parseFloat(params.vout) || 3.3;
  const Iout = parseFloat(params.iout) || 0.5;
  const dropout = 1.2;
  const Pdiss = (Vin - Vout) * Iout;
  const regulator = Vout <= 3.3 ? 'AMS1117-3.3' : 'LM7805';

  return makePowerResult('LDO Voltage Regulator', {
    components: [
      { id: 'U1', name: `${regulator}`, category: 'power', type: 'ldo', value: regulator, quantity: 1, partNumber: regulator },
      { id: 'Cin', name: 'Cin = 10 µF (input)', category: 'passive', type: 'capacitor', value: '10 µF electrolytic', quantity: 1 },
      { id: 'Cout', name: 'Cout = 22 µF (output)', category: 'passive', type: 'capacitor', value: '22 µF electrolytic', quantity: 1 },
      { id: 'C_ceramic', name: 'C = 100 nF (ceramic)', category: 'passive', type: 'capacitor', value: '100 nF', quantity: 2 },
    ],
    specs: { Vin, Vout, Iout, dropout, efficiency: (Vout / Vin * 100).toFixed(1), Pdiss },
    description: `Linear regulator: ${Vin}V → ${Vout}V at ${Iout}A using ${regulator}.`,
    behavior: `Efficiency: ${(Vout / Vin * 100).toFixed(1)}%. Power dissipated as heat: ${Pdiss.toFixed(2)}W.${Pdiss > 1 ? '\n⚠️ Heat sink required!' : ''}`,
    warnings: [
      ...(Vin - Vout < dropout ? [`Input voltage too low. Minimum Vin = ${Vout + dropout}V for ${dropout}V dropout.`] : []),
      ...(Pdiss > 1 ? [`High power dissipation (${Pdiss.toFixed(2)}W). Consider a buck converter for better efficiency.`] : []),
      ...(Pdiss > 2 ? [`⚠️ ${Pdiss.toFixed(1)}W will require significant heat sinking. Strongly recommend switching regulator.`] : []),
    ],
    thermalNotes: `Junction temp rise: ~${(Pdiss * 65).toFixed(0)}°C above ambient (TO-220, no heatsink).\n${Pdiss > 0.5 ? 'Heat sink recommended: θ_sa < ' + ((150 - 40) / Pdiss - 5).toFixed(0) + ' °C/W' : 'No heatsink needed.'}`,
  });
}

function buildBuckConverter(params) {
  const Vin = parseFloat(params.vin) || 12;
  const Vout = parseFloat(params.vout) || 5;
  const Iout = parseFloat(params.iout) || 2;
  const fsw = parseFloat(params.fsw) || 500000;
  const D = Vout / Vin;
  const rippleI = 0.3 * Iout;
  const L = (Vin - Vout) * D / (fsw * rippleI);
  const rippleV = 0.01 * Vout;
  const Cout = rippleI / (8 * fsw * rippleV);
  const efficiency = 0.88;
  const Pin = Vout * Iout / efficiency;

  return makePowerResult('Buck (Step-Down) Converter', {
    components: [
      { id: 'U1', name: 'Buck Controller IC', category: 'power', type: 'buck', value: 'LM2596 / MP1584', quantity: 1 },
      { id: 'L1', name: `L = ${fmtH(L)}`, category: 'passive', type: 'inductor', value: fmtH(L), quantity: 1 },
      { id: 'Cout', name: `Cout = ${fmtC(Cout)}`, category: 'passive', type: 'capacitor', value: fmtC(Cout), quantity: 1 },
      { id: 'Cin', name: 'Cin = 100 µF', category: 'passive', type: 'capacitor', value: '100 µF', quantity: 1 },
      { id: 'D1', name: 'Schottky diode (SS34)', category: 'discrete', type: 'diode', value: 'SS34', quantity: 1 },
      { id: 'Rfb1', name: 'Rfb1 (feedback)', category: 'passive', type: 'resistor', value: 'Datasheet-specified', quantity: 1 },
      { id: 'Rfb2', name: 'Rfb2 (feedback)', category: 'passive', type: 'resistor', value: 'Datasheet-specified', quantity: 1 },
    ],
    specs: { Vin, Vout, Iout, D, fsw, L, Cout, efficiency: efficiency * 100, Pin },
    description: `Buck converter: ${Vin}V → ${Vout}V at ${Iout}A. Duty cycle = ${(D * 100).toFixed(1)}%.`,
    behavior: `Switching frequency: ${(fsw / 1000).toFixed(0)} kHz. Estimated efficiency: ~${(efficiency * 100).toFixed(0)}%.\nInductor: ${fmtH(L)} (30% ripple current). Output ripple: <${(rippleV * 1000).toFixed(0)} mV.`,
    warnings: Vout >= Vin ? ['Output must be less than input for buck topology!'] : [],
    thermalNotes: `Input power: ${Pin.toFixed(2)}W. Heat: ${(Pin * (1 - efficiency)).toFixed(2)}W dissipated in IC + inductor.`,
  });
}

function buildBoostConverter(params) {
  const Vin = parseFloat(params.vin) || 3.7;
  const Vout = parseFloat(params.vout) || 5;
  const Iout = parseFloat(params.iout) || 0.5;
  const fsw = parseFloat(params.fsw) || 500000;
  const D = 1 - (Vin / Vout);
  const efficiency = 0.85;
  const Iin = Vout * Iout / (Vin * efficiency);
  const L = (Vin * D) / (fsw * 0.3 * Iin);

  return makePowerResult('Boost (Step-Up) Converter', {
    components: [
      { id: 'U1', name: 'Boost Controller (MT3608)', category: 'power', type: 'boost', value: 'MT3608', quantity: 1 },
      { id: 'L1', name: `L = ${fmtH(L)}`, category: 'passive', type: 'inductor', value: fmtH(L), quantity: 1 },
      { id: 'Cout', name: 'Cout = 100 µF', category: 'passive', type: 'capacitor', value: '100 µF', quantity: 1 },
      { id: 'Cin', name: 'Cin = 10 µF', category: 'passive', type: 'capacitor', value: '10 µF', quantity: 1 },
      { id: 'D1', name: 'Schottky diode (SS14)', category: 'discrete', type: 'diode', value: 'SS14', quantity: 1 },
    ],
    specs: { Vin, Vout, Iout, D, fsw, efficiency: efficiency * 100, Iin },
    description: `Boost converter: ${Vin}V → ${Vout}V at ${Iout}A. Duty cycle = ${(D * 100).toFixed(1)}%.`,
    behavior: `Input current: ${Iin.toFixed(2)}A. Efficiency: ~${(efficiency * 100).toFixed(0)}%.`,
    warnings: Vout <= Vin ? ['Output must be greater than input for boost topology!'] : [],
    thermalNotes: `Power in: ${(Vin * Iin).toFixed(2)}W. Losses: ${(Vin * Iin * (1 - efficiency)).toFixed(2)}W.`,
  });
}

function buildBatteryCharger(params) {
  const Vbat = parseFloat(params.vbat) || 4.2;
  const Ichg = parseFloat(params.ichg) || 1;
  const capacity = parseFloat(params.capacity) || 2000;
  const chargeTime = capacity / Ichg / 60;

  return makePowerResult('LiPo Battery Charger', {
    components: [
      { id: 'U1', name: 'TP4056 Charger Module', category: 'power', type: 'charger', value: 'TP4056', quantity: 1, partNumber: 'TP4056' },
      { id: 'BAT', name: `LiPo ${Vbat}V ${capacity}mAh`, category: 'power', type: 'battery', value: `${capacity}mAh`, quantity: 1 },
      { id: 'Rprog', name: `Rprog = ${(1200 / Ichg).toFixed(0)} Ω`, category: 'passive', type: 'resistor', value: `${(1200 / Ichg).toFixed(0)} Ω`, quantity: 1 },
      { id: 'Cin', name: 'Cin = 10 µF', category: 'passive', type: 'capacitor', value: '10 µF', quantity: 1 },
    ],
    specs: { Vbat, Ichg, capacity, chargeTime },
    description: `LiPo charger: CC/CV profile, ${Ichg}A charge current, for ${capacity}mAh battery.`,
    behavior: `Charge time: ~${chargeTime.toFixed(1)} hours.\nCC phase: charges at ${Ichg}A until ${Vbat}V.\nCV phase: holds ${Vbat}V, current tapers to ~${(Ichg * 0.1).toFixed(2)}A.`,
    warnings: Ichg > 1 ? [`Charge current ${Ichg}A may exceed TP4056 maximum. Use proper thermal management.`] : [],
    thermalNotes: `Max dissipation at peak: ~${(5 - 3.0) * Ichg}W (when battery is depleted).`,
  });
}

function buildSolarHarvest(params) {
  const Vpanel = parseFloat(params.vpanel) || 6;
  const Ipanel = parseFloat(params.ipanel) || 0.15;
  const Vbat = 4.2;

  return makePowerResult('Solar Energy Harvesting System', {
    components: [
      { id: 'PANEL', name: `Solar Panel ${Vpanel}V ${(Vpanel * Ipanel).toFixed(1)}W`, category: 'power', type: 'solar', value: `${Vpanel}V`, quantity: 1 },
      { id: 'D1', name: 'Schottky diode (1N5817)', category: 'discrete', type: 'diode', value: '1N5817', quantity: 1 },
      { id: 'U1', name: 'TP4056 Charger', category: 'power', type: 'charger', value: 'TP4056', quantity: 1 },
      { id: 'BAT', name: 'LiPo Battery 3.7V', category: 'power', type: 'battery', value: '3.7V LiPo', quantity: 1 },
      { id: 'U2', name: 'Boost/LDO (output reg)', category: 'power', type: 'regulator', value: 'MT3608 or AMS1117', quantity: 1 },
    ],
    specs: { Vpanel, Ipanel, Vbat, powerPanel: Vpanel * Ipanel },
    description: `Solar panel (${Vpanel}V, ${(Vpanel * Ipanel * 1000).toFixed(0)}mW) → LiPo battery → regulated output.`,
    behavior: `Solar panel charges LiPo via TP4056. Schottky diode prevents reverse current at night. Output regulated for MCU.`,
    warnings: [],
    thermalNotes: `Panel output varies with sunlight. Average ~4 hours effective charging per day.`,
  });
}

function buildReversePolarity(params) {
  const Vin = parseFloat(params.vin) || 12;
  const Imax = parseFloat(params.imax) || 2;

  return makePowerResult('Reverse Polarity Protection', {
    components: [
      { id: 'Q1', name: 'P-MOSFET (IRF9540)', category: 'discrete', type: 'mosfet_p', value: 'IRF9540', quantity: 1 },
      { id: 'R1', name: 'Rgs = 100 kΩ', category: 'passive', type: 'resistor', value: '100 kΩ', quantity: 1 },
      { id: 'D1', name: 'TVS Diode', category: 'discrete', type: 'protection', value: 'SMBJ15A', quantity: 1 },
    ],
    specs: { Vin, Imax },
    description: `P-MOSFET reverse polarity protection for ${Vin}V / ${Imax}A. Very low voltage drop (<50mV).`,
    behavior: `When polarity is correct, MOSFET body diode initially conducts, then Vgs pulls gate low → MOSFET fully ON (milliohm Rds). Reverse polarity: MOSFET stays OFF, blocking current.`,
    warnings: [],
    thermalNotes: `Power loss: I²×Rds(on) = ${(Imax * Imax * 0.05).toFixed(3)}W (negligible).`,
  });
}

// ─── Helpers ─────────────────────────────────────────────

function fmtH(val) {
  if (val >= 1) return `${val.toFixed(3)} H`;
  if (val >= 1e-3) return `${(val * 1e3).toFixed(1)} mH`;
  if (val >= 1e-6) return `${(val * 1e6).toFixed(1)} µH`;
  return `${(val * 1e9).toFixed(1)} nH`;
}

function fmtC(val) {
  if (val >= 1e-3) return `${(val * 1e3).toFixed(1)} mF`;
  if (val >= 1e-6) return `${(val * 1e6).toFixed(1)} µF`;
  if (val >= 1e-9) return `${(val * 1e9).toFixed(1)} nF`;
  return `${(val * 1e12).toFixed(1)} pF`;
}

function makePowerResult(title, opts) {
  return {
    platform: { id: 'power', name: 'Power Electronics' },
    components: opts.components,
    connections: [],
    pinAssignments: [],
    netlist: {
      version: '1.0', platform: 'power', generatedAt: new Date().toISOString(),
      nets: {}, statistics: { totalNodes: opts.components.length },
    },
    code: `${title}\n${'═'.repeat(40)}\n\n── Specifications ──\n${Object.entries(opts.specs).map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(3) : v}`).join('\n')}\n\n── Components ──\n${opts.components.map(c => `• ${c.name}`).join('\n')}\n\n── Thermal Notes ──\n${opts.thermalNotes}`,
    explanation: `## ${title}\n\n${opts.description}\n\n### Operation\n${opts.behavior}\n\n### Thermal Considerations\n${opts.thermalNotes}\n\n### PCB Layout\n- Input capacitor close to regulator input pin\n- Output capacitor close to output pin\n- Wide traces for power paths (≥${Math.ceil(opts.specs.Iout || opts.specs.Imax || 1)}A)\n- Ground plane recommended\n- Keep switching node area small (if applicable)`,
    validation: {
      valid: opts.warnings.length === 0,
      warnings: opts.warnings,
      errors: [],
    },
    powerAnalysis: {
      inputPower: opts.specs.Pin ? `${opts.specs.Pin.toFixed(2)}W` : `${(opts.specs.Vin * (opts.specs.Iout || 0.5)).toFixed(2)}W max`,
      outputPower: `${((opts.specs.Vout || 5) * (opts.specs.Iout || 0.5)).toFixed(2)}W`,
      efficiency: opts.specs.efficiency ? `${opts.specs.efficiency}%` : 'Linear (Vout/Vin)',
      thermalNotes: opts.thermalNotes,
    },
  };
}

module.exports = { generatePowerCircuit };
