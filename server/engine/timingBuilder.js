/**
 * Timing Circuit Builder — 555 timer, crystal oscillators,
 * RC oscillators, watchdog timers.
 */

function generateTimingCircuit(input) {
  const { timingType = '555_astable', params = {} } = input;

  const builders = {
    '555_astable': build555Astable,
    '555_monostable': build555Monostable,
    '555_pwm': build555PWM,
    rc_oscillator: buildRCOscillator,
    relaxation: buildRelaxationOscillator,
  };

  const builder = builders[timingType];
  if (!builder) throw new Error(`Unknown timing circuit: ${timingType}`);
  return builder(params);
}

function build555Astable(params) {
  const freq = parseFloat(params.frequency) || 1000;
  const duty = parseFloat(params.dutyCycle) || 50;
  const C = parseFloat(params.capacitance) || 100e-9;

  // For standard 555 astable: duty > 50% always (without diode mod)
  // T_high = 0.693 × (R1 + R2) × C
  // T_low  = 0.693 × R2 × C
  // freq   = 1.44 / ((R1 + 2×R2) × C)
  const R1R2sum = 1.44 / (freq * C);
  let R2, R1;

  if (duty <= 50) {
    // Diode-modified 555 for duty ≤ 50%
    R2 = 1 / (freq * C * 0.693 * 2);
    R1 = R1R2sum - 2 * R2;
    if (R1 < 100) R1 = 100;
  } else {
    const T = 1 / freq;
    const T_high = T * (duty / 100);
    const T_low = T - T_high;
    R2 = T_low / (0.693 * C);
    R1 = T_high / (0.693 * C) - R2;
    if (R1 < 100) R1 = 100;
  }

  const actualFreq = 1.44 / ((R1 + 2 * R2) * C);
  const actualDuty = ((R1 + R2) / (R1 + 2 * R2)) * 100;

  return makeTimingResult('555 Timer — Astable (Free-Running)', {
    components: [
      { id: 'U1', name: 'NE555 Timer', category: 'ic', type: 'timer', value: 'NE555', quantity: 1, partNumber: 'NE555' },
      { id: 'R1', name: `R1 = ${fmtR(R1)}`, category: 'passive', type: 'resistor', value: fmtR(R1), quantity: 1 },
      { id: 'R2', name: `R2 = ${fmtR(R2)}`, category: 'passive', type: 'resistor', value: fmtR(R2), quantity: 1 },
      { id: 'C1', name: `C1 = ${fmtC(C)}`, category: 'passive', type: 'capacitor', value: fmtC(C), quantity: 1 },
      { id: 'C_bypass', name: 'C = 10nF (pin 5 bypass)', category: 'passive', type: 'capacitor', value: '10 nF', quantity: 1 },
      { id: 'C_decoup', name: 'C = 100nF (decoupling)', category: 'passive', type: 'capacitor', value: '100 nF', quantity: 1 },
    ],
    specs: {
      'Frequency': `${actualFreq.toFixed(1)} Hz (target: ${freq} Hz)`,
      'Duty Cycle': `${actualDuty.toFixed(1)}% (target: ${duty}%)`,
      'R1': fmtR(R1),
      'R2': fmtR(R2),
      'C1': fmtC(C),
      'T_high': `${(0.693 * (R1 + R2) * C * 1000).toFixed(3)} ms`,
      'T_low': `${(0.693 * R2 * C * 1000).toFixed(3)} ms`,
      'Period': `${(1 / actualFreq * 1000).toFixed(3)} ms`,
    },
    description: `Free-running oscillator at **${actualFreq.toFixed(1)} Hz** with **${actualDuty.toFixed(1)}%** duty cycle.`,
    behavior: `Pin 2 (TRIG) and Pin 6 (THRESH) connected together.\nCapacitor charges through R1+R2, discharges through R2.\nOutput toggles between Vcc and 0V.\n\nApplications: Clock generation, LED blinker, tone generator, PWM.`,
    pinout: `Pin 1: GND\nPin 2: TRIGGER (to C1)\nPin 3: OUTPUT\nPin 4: RESET (to Vcc)\nPin 5: CONTROL (10nF to GND)\nPin 6: THRESHOLD (to C1)\nPin 7: DISCHARGE (between R1 and R2)\nPin 8: Vcc (5-15V)`,
  });
}

function build555Monostable(params) {
  const pulseWidth = parseFloat(params.pulseWidth) || 0.001;
  const C = parseFloat(params.capacitance) || 10e-6;
  const R = pulseWidth / (1.1 * C);

  return makeTimingResult('555 Timer — Monostable (One-Shot)', {
    components: [
      { id: 'U1', name: 'NE555 Timer', category: 'ic', type: 'timer', value: 'NE555', quantity: 1 },
      { id: 'R1', name: `R = ${fmtR(R)}`, category: 'passive', type: 'resistor', value: fmtR(R), quantity: 1 },
      { id: 'C1', name: `C = ${fmtC(C)}`, category: 'passive', type: 'capacitor', value: fmtC(C), quantity: 1 },
      { id: 'C_bypass', name: 'C = 10nF (pin 5)', category: 'passive', type: 'capacitor', value: '10 nF', quantity: 1 },
      { id: 'R_trigger', name: 'R = 10kΩ (trigger pull-up)', category: 'passive', type: 'resistor', value: '10 kΩ', quantity: 1 },
    ],
    specs: {
      'Pulse Width': `${(pulseWidth * 1000).toFixed(3)} ms`,
      'R': fmtR(R),
      'C': fmtC(C),
    },
    description: `One-shot pulse generator. Outputs a **${(pulseWidth * 1000).toFixed(3)} ms** pulse on each trigger.`,
    behavior: `Trigger (pin 2) falling edge → output goes HIGH for T = 1.1 × R × C.\nRetrigger-proof: ignores trigger during output pulse.\n\nApplications: Debouncing, pulse stretching, time delays.`,
    pinout: `Pin 2: TRIGGER (active-low, pulled high via 10kΩ)\nPin 3: OUTPUT (pulse)\nPin 6: THRESHOLD\nPin 7: DISCHARGE`,
  });
}

function build555PWM(params) {
  const freq = parseFloat(params.frequency) || 1000;
  const C = parseFloat(params.capacitance) || 100e-9;
  const R = 1.44 / (freq * C);

  return makeTimingResult('555 Timer — PWM Generator', {
    components: [
      { id: 'U1', name: 'NE555 Timer', category: 'ic', type: 'timer', value: 'NE555', quantity: 1 },
      { id: 'R1', name: `R = ${fmtR(R)}`, category: 'passive', type: 'resistor', value: fmtR(R), quantity: 1 },
      { id: 'D1', name: 'Diode (1N4148)', category: 'discrete', type: 'diode', value: '1N4148', quantity: 1 },
      { id: 'D2', name: 'Diode (1N4148)', category: 'discrete', type: 'diode', value: '1N4148', quantity: 1 },
      { id: 'C1', name: `C = ${fmtC(C)}`, category: 'passive', type: 'capacitor', value: fmtC(C), quantity: 1 },
      { id: 'POT', name: 'Potentiometer (100kΩ)', category: 'passive', type: 'potentiometer', value: '100 kΩ', quantity: 1 },
    ],
    specs: {
      'Frequency': `${freq} Hz`,
      'Duty Cycle': 'Adjustable 1-99% via potentiometer',
      'R': fmtR(R),
      'C': fmtC(C),
    },
    description: `Variable duty-cycle PWM at **${freq} Hz**. Duty adjusted by potentiometer.`,
    behavior: `Diode-modified astable circuit. D1 bypasses top half of pot during charge, D2 bypasses bottom half during discharge.\nThis allows near 0-100% duty cycle adjustment at constant frequency.\n\nApplications: LED dimming, motor speed control, heater control.`,
    pinout: `Same as astable, with diodes modifying charge/discharge paths.`,
  });
}

function buildRCOscillator(params) {
  const freq = parseFloat(params.frequency) || 1000;
  const C = parseFloat(params.capacitance) || 100e-9;
  const R = 1 / (2 * Math.PI * freq * C);

  return makeTimingResult('RC Oscillator (Op-Amp Wien Bridge)', {
    components: [
      { id: 'U1', name: 'Op-Amp (LM358)', category: 'ic', type: 'op_amp', value: 'LM358', quantity: 1 },
      { id: 'R1', name: `R = ${fmtR(R)} (×2, frequency set)`, category: 'passive', type: 'resistor', value: fmtR(R), quantity: 2 },
      { id: 'C1', name: `C = ${fmtC(C)} (×2, frequency set)`, category: 'passive', type: 'capacitor', value: fmtC(C), quantity: 2 },
      { id: 'Rf', name: 'Rf = 20kΩ (gain)', category: 'passive', type: 'resistor', value: '20 kΩ', quantity: 1 },
      { id: 'Rg', name: 'Rg = 10kΩ (gain)', category: 'passive', type: 'resistor', value: '10 kΩ', quantity: 1 },
      { id: 'D_limit', name: 'Diode pair (amplitude limit)', category: 'discrete', type: 'diode', value: '1N4148', quantity: 2 },
    ],
    specs: {
      'Frequency': `${freq.toFixed(1)} Hz`,
      'R': fmtR(R),
      'C': fmtC(C),
      'Gain': '3 (minimum for oscillation)',
    },
    description: `Wien-bridge RC oscillator at **${freq.toFixed(1)} Hz**. Sine wave output.`,
    behavior: `Positive feedback via RC network (series + parallel) sets frequency.\nNegative feedback via Rf/Rg sets gain = 3 for sustained oscillation.\nDiode pair limits amplitude for clean sinusoidal output.\n\nf = 1 / (2πRC) = ${freq.toFixed(1)} Hz`,
    pinout: `Op-amp based — no pinout needed. Use single or dual supply.`,
  });
}

function buildRelaxationOscillator(params) {
  const freq = parseFloat(params.frequency) || 500;
  const C = parseFloat(params.capacitance) || 1e-6;
  const R = 1 / (2 * freq * C);

  return makeTimingResult('Relaxation Oscillator (Schmitt Trigger)', {
    components: [
      { id: 'U1', name: 'Schmitt Trigger (74HC14)', category: 'ic', type: 'logic', value: '74HC14', quantity: 1 },
      { id: 'R1', name: `R = ${fmtR(R)}`, category: 'passive', type: 'resistor', value: fmtR(R), quantity: 1 },
      { id: 'C1', name: `C = ${fmtC(C)}`, category: 'passive', type: 'capacitor', value: fmtC(C), quantity: 1 },
    ],
    specs: {
      'Frequency': `~${freq.toFixed(0)} Hz`,
      'R': fmtR(R),
      'C': fmtC(C),
    },
    description: `Simple square wave oscillator using a Schmitt trigger inverter at **~${freq.toFixed(0)} Hz**.`,
    behavior: `Capacitor charges through R. When voltage reaches upper threshold, output goes LOW.\nCapacitor then discharges through R. When voltage reaches lower threshold, output goes HIGH.\nHysteresis provides clean switching.\n\nf ≈ 1 / (2RC) = ${freq.toFixed(0)} Hz (approximate, depends on hysteresis)`,
    pinout: `Input of inverter to RC junction. Output from inverter. Feedback through R.`,
  });
}

// ─── Helpers ─────────────────────────────────────────────

function fmtR(val) {
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)} MΩ`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(2)} kΩ`;
  return `${val.toFixed(1)} Ω`;
}

function fmtC(val) {
  if (val >= 1e-3) return `${(val * 1e3).toFixed(1)} mF`;
  if (val >= 1e-6) return `${(val * 1e6).toFixed(1)} µF`;
  if (val >= 1e-9) return `${(val * 1e9).toFixed(1)} nF`;
  return `${(val * 1e12).toFixed(1)} pF`;
}

function makeTimingResult(title, opts) {
  const specsText = typeof opts.specs === 'string'
    ? opts.specs
    : Object.entries(opts.specs).map(([k, v]) => `${k}: ${v}`).join('\n');

  return {
    platform: { id: 'timing', name: 'Timing Circuit' },
    components: opts.components,
    connections: [],
    pinAssignments: [],
    netlist: {
      version: '1.0', platform: 'timing', generatedAt: new Date().toISOString(),
      nets: {}, statistics: { totalNodes: opts.components.length },
    },
    code: `${title}\n${'═'.repeat(40)}\n\n── Specifications ──\n${specsText}\n\n── Components ──\n${opts.components.map(c => `• ${c.name} (×${c.quantity})`).join('\n')}\n\n── Pinout ──\n${opts.pinout || 'See schematic'}\n\n── Operation ──\n${opts.behavior}`,
    explanation: `## ${title}\n\n${opts.description}\n\n### Operation\n${opts.behavior}\n\n### Pin Configuration\n\`\`\`\n${opts.pinout || 'See datasheet'}\n\`\`\`\n\n### PCB Layout\n- Keep timing components (R, C) close to IC\n- Use ceramic capacitors for timing (low ESR)\n- Bypass pin 5 (555) to GND with 10nF\n- Add 100nF decoupling on Vcc\n- Avoid running noisy digital signals near timing components`,
    validation: { valid: true, warnings: [], errors: [] },
    powerAnalysis: {
      totalCurrent: 'NE555: ~3mA quiescent, up to 200mA output',
      powerDissipation: 'Signal-dependent',
    },
  };
}

module.exports = { generateTimingCircuit };
