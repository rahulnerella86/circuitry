import { useState, useEffect } from 'react';
import * as api from '../utils/api';

const DOMAINS = [
  { id: 'microcontroller', label: 'Microcontroller', icon: '💻', desc: 'Arduino, ESP32, Sensors' },
  { id: 'boolean_logic', label: 'Logic Gates', icon: '🔣', desc: 'Boolean expressions to gates' },
  { id: 'analog_filter', label: 'Analog Filter', icon: '📈', desc: 'RC/RLC filter design' },
  { id: 'digital_filter', label: 'Digital Filter', icon: '📉', desc: 'DSP and Z-transform' },
  { id: 'electric', label: 'Electric Circuit', icon: '⚡', desc: 'Passive network topologies' },
  { id: 'passive', label: 'Passive Circuits', icon: '🔌', desc: 'R/L/C networks, dividers, matching' },
  { id: 'analog', label: 'Analog Design', icon: '🎛️', desc: 'Op-amps, BJT/MOSFETs, comparators' },
  { id: 'power', label: 'Power Electronics', icon: '🔋', desc: 'LDOs, buck/boost, battery chargers' },
  { id: 'protection', label: 'Protection', icon: '🛡️', desc: 'ESD, overcurrent, overvoltage' },
  { id: 'communication', label: 'Communication', icon: '📡', desc: 'RS232, I2C, SPI, CAN, level shifts' },
  { id: 'timing', label: 'Timing & Clocks', icon: '⏱️', desc: '555 timers, oscillators' },
  { id: 'nlm', label: 'AI Synthesis (NLM)', icon: '🧠', desc: 'Natural language circuit design' },
];

const CIRCUIT_TYPES = [
  { id: 'digital', label: 'Digital', icon: '🔲', desc: 'Digital I/O circuits' },
  { id: 'analog', label: 'Analog', icon: '📈', desc: 'Analog sensor circuits' },
  { id: 'embedded', label: 'Embedded', icon: '🔧', desc: 'Full embedded systems' },
  { id: 'filter', label: 'Filter', icon: '🔀', desc: 'Signal processing' },
];

const FEATURES = [
  { id: 'iot', label: 'IoT / WiFi', icon: '🌐', desc: 'Internet connectivity' },
  { id: 'display', label: 'Display', icon: '🖥️', desc: 'Visual output' },
  { id: 'automation', label: 'Automation', icon: '⚙️', desc: 'Auto-control logic' },
];

const ParamInput = ({ config, updateConfig, paramKey, label, placeholder }) => {
  const params = config.params || {};

  return (
    <div>
      <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink-500 mb-1">{label}</label>
      <input
        type="text"
        className="w-full p-2 bg-white border-2 border-ink-200 text-ink text-sm font-mono focus:border-ink-900 focus:outline-none transition-colors"
        value={params[paramKey] || ''}
        placeholder={placeholder}
        onChange={(e) => updateConfig('params', { ...params, [paramKey]: e.target.value })}
      />
    </div>
  );
};

const ComponentChipWithQty = ({ comp, configKey, config, updateConfig }) => {
  const arr = config[configKey] || [];
  const count = arr.filter(id => id === comp.id).length;
  const isSelected = count > 0;

  const addOne = (e) => {
    e.stopPropagation();
    updateConfig(configKey, [...arr, comp.id]);
  };
  const removeOne = (e) => {
    e.stopPropagation();
    const idx = arr.lastIndexOf(comp.id);
    if (idx !== -1) {
      const copy = [...arr];
      copy.splice(idx, 1);
      updateConfig(configKey, copy);
    }
  };
  const toggleFirst = () => {
    if (isSelected) {
      updateConfig(configKey, arr.filter(id => id !== comp.id));
    } else {
      updateConfig(configKey, [...arr, comp.id]);
    }
  };

  return (
    <div className={`component-chip inline-flex items-center gap-1 ${isSelected ? 'selected' : ''}`}>
      <button onClick={toggleFirst} className="whitespace-nowrap">
        {comp.name}
      </button>
      {isSelected && (
        <span className="inline-flex items-center gap-0.5 ml-1">
          <button
            onClick={removeOne}
            className="w-5 h-5 rounded-full bg-ink-100 hover:bg-red-50 text-ink-400 hover:text-red-600 flex items-center justify-center text-xs font-bold transition-colors"
            title="Remove one"
          >−</button>
          <span className="text-xs font-bold text-ink-900 min-w-[16px] text-center">{count}</span>
          <button
            onClick={addOne}
            className="w-5 h-5 rounded-full bg-ink-100 hover:bg-green-50 text-ink-400 hover:text-green-600 flex items-center justify-center text-xs font-bold transition-colors"
            title="Add one more"
          >+</button>
        </span>
      )}
    </div>
  );
};

export default function InputForm({ config, updateConfig, toggleArrayItem, onGenerate, loading, isValid, error }) {
  const [platforms, setPlatforms] = useState([]);
  const [components, setComponents] = useState([]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    api.fetchPlatforms().then(data => setPlatforms(data.platforms || [])).catch(() => {});
    api.fetchComponents().then(data => setComponents(data.components || [])).catch(() => {});
  }, []);

  const sensors = components.filter(c => c.category === 'sensor');
  const actuators = components.filter(c => c.category === 'actuator');
  const displays = components.filter(c => c.category === 'display');
  const comms = components.filter(c => c.category === 'communication');
  const discretes = components.filter(c => c.category === 'discrete');
  const power = components.filter(c => c.category === 'power');

  let steps = [{ num: 0, label: 'Domain' }];
  
  if (config.domain === 'microcontroller') {
    steps.push(
      { num: 1, label: 'Platform' },
      { num: 2, label: 'Components' },
      { num: 3, label: 'Features' }
    );
  } else if (config.domain === 'boolean_logic') {
    steps.push({ num: 1, label: 'Equation' });
  } else if (config.domain === 'analog_filter' || config.domain === 'digital_filter' || 
             ['passive', 'analog', 'power', 'protection', 'communication', 'timing'].includes(config.domain)) {
    steps.push({ num: 1, label: 'Configuration' });
  } else if (config.domain === 'electric') {
    steps.push({ num: 1, label: 'Topology' });
  } else if (config.domain === 'nlm') {
    steps.push({ num: 1, label: 'Requirements' });
  }

  const isStepComplete = (s) => {
    if (s === 0) return !!config.domain;
    if (config.domain === 'microcontroller') {
      if (s === 1) return !!config.platform;
      if (s === 2) return config.sensors?.length > 0 || config.actuators?.length > 0;
      if (s === 3) return true;
    } else if (config.domain === 'boolean_logic') {
      if (s === 1) return config.logicMode === 'predefined' ? !!config.logicTopology : !!(config.equation && config.equation.trim());
    } else if (config.domain === 'analog_filter' || config.domain === 'digital_filter') {
      if (s === 1) return !!config.filterType;
    } else if (config.domain === 'electric') {
      if (s === 1) return !!config.topology;
    } else if (['passive', 'analog', 'power', 'protection', 'communication', 'timing'].includes(config.domain)) {
      if (s === 1) {
        if (config.domain === 'passive') return !!config.passiveType;
        if (config.domain === 'analog') return !!config.analogType;
        if (config.domain === 'power') return !!config.powerType;
        if (config.domain === 'protection') return !!config.protectionType;
        if (config.domain === 'communication') return !!config.commType;
        if (config.domain === 'timing') return !!config.timingType;
      }
    } else if (config.domain === 'nlm') {
      if (s === 1) return config.query && config.query.trim().length > 10;
    }
    return false;
  };

  const platformMeta = {
    arduino_uno: { icon: '🔵', color: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/40' },
    esp32: { icon: '🟢', color: 'from-emerald-500/20 to-emerald-600/20', border: 'border-emerald-500/40' },
    esp8266: { icon: '🟡', color: 'from-amber-500/20 to-amber-600/20', border: 'border-amber-500/40' },
  };

  return (
    <div className="p-4 lg:p-5 space-y-5 bg-white">
      {/* Step Indicator */}
      <div className="flex items-center gap-0 px-2 overflow-x-auto pb-2">
        <button
          onClick={() => {
            if (step > 0) {
              setStep(s => Math.max(0, s - 1));
            } else {
              document.getElementById('root')?.scrollIntoView({ behavior: 'smooth' });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-ink-50 hover:bg-ink-100 text-ink-500 transition-all mr-3 flex-shrink-0"
          title="Go Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {steps.map((s, idx) => (
          <div key={s.num} className="flex items-center flex-1 last:flex-none min-w-[30px]">
            <button
              onClick={() => setStep(s.num)}
              className={`step-dot relative flex-shrink-0 ${step === s.num ? 'active' : ''} ${isStepComplete(s.num) && step !== s.num ? 'completed' : ''}`}
              title={s.label}
            >
              {isStepComplete(s.num) && step !== s.num ? '✓' : s.num}
            </button>
            {idx < steps.length - 1 && (
              <div className={`step-line flex-1 min-w-[10px] ${isStepComplete(s.num) ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Domain Selection */}
      {step === 0 && (
        <div className="animate-fade-in space-y-3">
          <div>
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-ink mb-1">Select Domain</h3>
            <p className="text-xs text-ink-500">Choose the type of circuit generation</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {DOMAINS.map(d => (
              <button
                key={d.id}
                onClick={() => { updateConfig('domain', d.id); setStep(1); }}
                className={`platform-card w-full text-left flex items-center gap-3 py-3 ${config.domain === d.id ? 'selected' : ''}`}
              >
                <div className="text-2xl w-10 text-center">{d.icon}</div>
                <div className="flex-1">
                  <div className="font-mono text-sm font-bold text-ink">{d.label}</div>
                  <div className="text-[10px] text-ink-400 mt-0.5">{d.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Domain: Boolean Logic */}
      {config.domain === 'boolean_logic' && step === 1 && (
        <div className="animate-fade-in space-y-4">
          <div>
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-ink mb-1">Circuit Type</h3>
            <p className="text-xs text-ink-500">Choose how to generate your logic circuit</p>
          </div>
          
          <div className="flex border-2 border-ink-200 p-0.5">
            <button
              className={`flex-1 py-1.5 text-sm font-mono font-bold uppercase tracking-wider transition-all ${config.logicMode !== 'predefined' ? 'bg-ink-900 text-ink' : 'text-ink-400 hover:text-ink-900'}`}
              onClick={() => updateConfig('logicMode', 'custom')}
            >
              Custom Equation
            </button>
            <button
              className={`flex-1 py-1.5 text-sm font-mono font-bold uppercase tracking-wider transition-all ${config.logicMode === 'predefined' ? 'bg-ink-900 text-ink' : 'text-ink-400 hover:text-ink-900'}`}
              onClick={() => updateConfig('logicMode', 'predefined')}
            >
              Predefined Circuit
            </button>
          </div>

          {config.logicMode !== 'predefined' ? (
            <div className="animate-fade-in space-y-2 mt-4">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink-500">Boolean Expression</label>
              <textarea
                className="w-full h-24 p-3 bg-white border-2 border-ink-200 text-ink font-mono text-sm focus:border-ink-900 focus:outline-none transition-colors"
                placeholder="A & (B | C)"
                value={config.equation || ''}
                onChange={(e) => updateConfig('equation', e.target.value)}
              />
            </div>
          ) : (
            <div className="animate-fade-in space-y-3 mt-4">
              <label className="block text-xs font-semibold text-ink-400">Category</label>
              <select
                className="w-full p-2 bg-white border-2 border-ink-200 text-ink text-sm font-mono focus:border-ink-900 focus:outline-none transition-colors"
                value={config.logicCategory || ''}
                onChange={(e) => { updateConfig('logicCategory', e.target.value); updateConfig('logicTopology', ''); }}
              >
                <option value="">— Choose Category —</option>
                <option value="basic_gates">1. Basic Logic Gates</option>
                <option value="mux_demux">2. Multiplexing / Routing</option>
                <option value="arithmetic">3. Arithmetic Circuits</option>
                <option value="encoding">4. Encoding / Decoding</option>
                <option value="comparison">5. Comparison & Error Detection</option>
                <option value="sequential">6. Sequential Circuits (Flip-Flops)</option>
                <option value="registers">7. Registers</option>
                <option value="counters">8. Counters</option>
                <option value="control">9. Control Systems</option>
                <option value="advanced">10. Advanced Blocks</option>
              </select>

              {config.logicCategory && (
                <>
                  <label className="block text-xs font-semibold text-ink-400 mt-2">Select Circuit</label>
                  <div className="grid grid-cols-2 gap-2">
                    {({
                      basic_gates: [
                        { id: 'gate_and', label: 'AND' }, { id: 'gate_or', label: 'OR' }, { id: 'gate_not', label: 'NOT' },
                        { id: 'gate_nand', label: 'NAND' }, { id: 'gate_nor', label: 'NOR' }, { id: 'gate_xor', label: 'XOR' }, { id: 'gate_xnor', label: 'XNOR' },
                      ],
                      mux_demux: [
                        { id: 'mux_2_1', label: '2:1 MUX' }, { id: 'mux_4_1', label: '4:1 MUX' }, { id: 'mux_8_1', label: '8:1 MUX' }, { id: 'mux_16_1', label: '16:1 MUX' },
                        { id: 'demux_1_2', label: '1:2 DEMUX' }, { id: 'demux_1_4', label: '1:4 DEMUX' }, { id: 'demux_1_8', label: '1:8 DEMUX' },
                      ],
                      arithmetic: [
                        { id: 'half_adder', label: 'Half Adder' }, { id: 'full_adder', label: 'Full Adder' },
                        { id: 'half_subtractor', label: 'Half Subtractor' }, { id: 'full_subtractor', label: 'Full Subtractor' },
                        { id: 'ripple_carry_adder', label: 'Ripple Carry Adder' }, { id: 'carry_lookahead', label: 'Carry Lookahead Adder' },
                      ],
                      encoding: [
                        { id: 'encoder', label: 'Encoder (4:2)' }, { id: 'priority_encoder', label: 'Priority Encoder' },
                        { id: 'decoder_2_4', label: '2→4 Decoder' }, { id: 'decoder_3_8', label: '3→8 Decoder' }, { id: 'decoder_4_16', label: '4→16 Decoder' },
                        { id: 'bcd_7seg', label: 'BCD → 7-Seg' }, { id: 'gray_converter', label: 'Binary ↔ Gray' },
                      ],
                      comparison: [
                        { id: 'comparator', label: 'Magnitude Comparator' }, { id: 'parity_gen', label: 'Parity Generator' }, { id: 'parity_checker', label: 'Parity Checker' },
                      ],
                      sequential: [
                        { id: 'ff_sr', label: 'SR Flip-Flop' }, { id: 'ff_jk', label: 'JK Flip-Flop' }, { id: 'ff_d', label: 'D Flip-Flop' }, { id: 'ff_t', label: 'T Flip-Flop' },
                      ],
                      registers: [
                        { id: 'reg_siso', label: 'SISO' }, { id: 'reg_sipo', label: 'SIPO' }, { id: 'reg_piso', label: 'PISO' }, { id: 'reg_pipo', label: 'PIPO' },
                        { id: 'reg_universal', label: 'Universal Shift Register' },
                      ],
                      counters: [
                        { id: 'counter_ripple', label: 'Ripple Counter' }, { id: 'counter_sync', label: 'Synchronous Counter' },
                        { id: 'counter_updown', label: 'Up/Down Counter' }, { id: 'counter_modn', label: 'Mod-N Counter' },
                        { id: 'counter_ring', label: 'Ring Counter' }, { id: 'counter_johnson', label: 'Johnson Counter' },
                      ],
                      control: [
                        { id: 'moore_machine', label: 'Moore Machine' }, { id: 'mealy_machine', label: 'Mealy Machine' },
                      ],
                      advanced: [
                        { id: 'alu', label: 'ALU' }, { id: 'barrel_shifter', label: 'Barrel Shifter' },
                        { id: 'ram', label: 'RAM' }, { id: 'rom', label: 'ROM' }, { id: 'pla', label: 'PLA' }, { id: 'pal', label: 'PAL' },
                      ],
                    }[config.logicCategory] || []).map(t => (
                      <button
                        key={t.id}
                        onClick={() => updateConfig('logicTopology', t.id)}
                        className={`platform-card text-center py-3 ${config.logicTopology === t.id ? 'selected bg-ink-100' : 'bg-ink-50'}`}
                      >
                        <div className="font-semibold text-sm text-ink">{t.label}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Domain: Filters */}
      {(config.domain === 'analog_filter' || config.domain === 'digital_filter') && step === 1 && (
        <div className="animate-fade-in space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink mb-1">
              {config.domain === 'analog_filter' ? 'Analog' : 'Digital'} Filter Parameters
            </h3>
            <p className="text-xs text-ink-400">Select category, filter type, and set frequency</p>
          </div>
          <div className="space-y-3">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs text-ink-500 mb-1">Category</label>
              <select
                className="w-full p-2 bg-white border-2 border-ink-200 text-ink text-sm font-mono focus:border-ink-900 focus:outline-none transition-colors"
                value={config.filterCategory || ''}
                onChange={(e) => { updateConfig('filterCategory', e.target.value); updateConfig('filterType', ''); }}
              >
                <option value="">— Choose Category —</option>
                {config.domain === 'analog_filter' ? (
                  <>
                    <option value="a_response">Response Type</option>
                    <option value="a_circuit">Circuit Type</option>
                    <option value="a_approx">Approximation</option>
                    <option value="a_order">Filter Order</option>
                    <option value="a_special">Special Analog</option>
                  </>
                ) : (
                  <>
                    <option value="d_type">FIR / IIR</option>
                    <option value="d_response">Digital Response Type</option>
                    <option value="d_structure">Structure / Form</option>
                    <option value="d_design">Design Method</option>
                    <option value="d_phase">Phase & Adaptive</option>
                    <option value="d_advanced">Advanced Filters</option>
                  </>
                )}
              </select>
            </div>

            {/* Filter Type Buttons */}
            {config.filterCategory && (
              <div>
                <label className="block text-xs text-ink-500 mb-1">Filter Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {({
                    a_response: [
                      { id: 'low_pass', label: 'Low Pass (LPF)' }, { id: 'high_pass', label: 'High Pass (HPF)' },
                      { id: 'band_pass', label: 'Band Pass (BPF)' }, { id: 'band_stop', label: 'Band Stop / Notch' },
                      { id: 'all_pass', label: 'All-Pass' },
                    ],
                    a_circuit: [
                      { id: 'rc_filter', label: 'RC Filter' }, { id: 'rl_filter', label: 'RL Filter' },
                      { id: 'rlc_filter', label: 'RLC Filter' }, { id: 'passive_filter', label: 'Passive Filter' },
                      { id: 'active_filter', label: 'Active Filter' },
                    ],
                    a_approx: [
                      { id: 'butterworth', label: 'Butterworth' }, { id: 'chebyshev_i', label: 'Chebyshev Type I' },
                      { id: 'chebyshev_ii', label: 'Chebyshev Type II' }, { id: 'elliptic', label: 'Elliptic (Cauer)' },
                      { id: 'bessel', label: 'Bessel' },
                    ],
                    a_order: [
                      { id: 'first_order', label: 'First-Order' }, { id: 'second_order', label: 'Second-Order' },
                      { id: 'higher_order', label: 'Higher-Order (4th+)' },
                    ],
                    a_special: [
                      { id: 'tuned_amplifier', label: 'Tuned Amplifier' }, { id: 'switched_cap', label: 'Switched Capacitor' },
                      { id: 'vcf', label: 'Voltage-Controlled (VCF)' },
                    ],
                    d_type: [
                      { id: 'fir', label: 'FIR Filter' }, { id: 'iir', label: 'IIR Filter' },
                    ],
                    d_response: [
                      { id: 'digital_lpf', label: 'Digital LPF' }, { id: 'digital_hpf', label: 'Digital HPF' },
                      { id: 'digital_bpf', label: 'Digital BPF' }, { id: 'digital_bsf', label: 'Digital Notch' },
                      { id: 'digital_apf', label: 'Digital All-Pass' },
                    ],
                    d_structure: [
                      { id: 'direct_form_1', label: 'Direct Form I' }, { id: 'direct_form_2', label: 'Direct Form II' },
                      { id: 'transposed', label: 'Transposed Form' }, { id: 'cascade', label: 'Cascade (SOS)' },
                      { id: 'parallel', label: 'Parallel Form' }, { id: 'lattice', label: 'Lattice' },
                    ],
                    d_design: [
                      { id: 'window_method', label: 'Window Method' }, { id: 'freq_sampling', label: 'Freq Sampling' },
                      { id: 'bilinear', label: 'Bilinear Transform' }, { id: 'impulse_invariance', label: 'Impulse Invariance' },
                    ],
                    d_phase: [
                      { id: 'linear_phase', label: 'Linear Phase' }, { id: 'nonlinear_phase', label: 'Non-Linear Phase' },
                      { id: 'adaptive_lms', label: 'Adaptive (LMS)' }, { id: 'adaptive_rls', label: 'Adaptive (RLS)' },
                    ],
                    d_advanced: [
                      { id: 'kalman', label: 'Kalman Filter' }, { id: 'wiener', label: 'Wiener Filter' },
                      { id: 'multirate_dec', label: 'Decimation' }, { id: 'multirate_int', label: 'Interpolation' },
                      { id: 'comb', label: 'Comb Filter' }, { id: 'moving_average', label: 'Moving Average' },
                    ],
                  }[config.filterCategory] || []).map(t => (
                    <button
                      key={t.id}
                      onClick={() => updateConfig('filterType', t.id)}
                      className={`platform-card text-center py-2.5 ${config.filterType === t.id ? 'selected bg-ink-100' : 'bg-ink-50'}`}
                    >
                      <div className="font-semibold text-xs text-ink">{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Frequency Input */}
            <div>
              <label className="block text-xs text-ink-500 mb-1">Cutoff / Center Frequency (Hz)</label>
              <input
                type="number"
                className="w-full p-2 bg-white border-2 border-ink-200 text-ink text-sm font-mono focus:border-ink-900 focus:outline-none transition-colors"
                value={config.frequency || '1000'}
                onChange={(e) => updateConfig('frequency', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Domain: Electric Circuit */}
      {config.domain === 'electric' && step === 1 && (
        <div className="animate-fade-in space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink mb-1">Circuit Topology</h3>
            <p className="text-xs text-ink-400">Select a passive circuit network</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'voltage_divider', label: 'Voltage Divider' },
              { id: 'series_rlc', label: 'Series RLC' },
              { id: 'wheatstone', label: 'Wheatstone Bridge' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => updateConfig('topology', t.id)}
                className={`platform-card text-center py-3 ${config.topology === t.id ? 'selected bg-ink-100' : 'bg-ink-50'}`}
              >
                <div className="font-semibold text-sm text-ink">{t.label}</div>
              </button>
            ))}
          </div>

          {/* Dynamic Params */}
          {config.topology && (
            <div className="mt-4 p-4 bg-ink-50 rounded-lg border border-white/5">
              <h4 className="text-sm font-semibold text-ink-600 mb-3">Component Values</h4>
              <div className="grid grid-cols-2 gap-3">
                {config.topology === 'voltage_divider' && (
                  <>
                    <ParamInput config={config} updateConfig={updateConfig} paramKey="Vin" label="V_in (V)" placeholder="5.0" />
                    <ParamInput config={config} updateConfig={updateConfig} paramKey="R1" label="R1 (Ω)" placeholder="10k" />
                    <ParamInput config={config} updateConfig={updateConfig} paramKey="R2" label="R2 (Ω)" placeholder="10k" />
                  </>
                )}
                {config.topology === 'series_rlc' && (
                  <>
                    <ParamInput config={config} updateConfig={updateConfig} paramKey="Vin" label="V_in (ac)" placeholder="5.0" />
                    <ParamInput config={config} updateConfig={updateConfig} paramKey="R" label="R (Ω)" placeholder="100" />
                    <ParamInput config={config} updateConfig={updateConfig} paramKey="L" label="L (H)" placeholder="1m" />
                    <ParamInput config={config} updateConfig={updateConfig} paramKey="C" label="C (F)" placeholder="1u" />
                  </>
                )}
                {config.topology === 'wheatstone' && (
                  <>
                    <ParamInput config={config} updateConfig={updateConfig} paramKey="Vin" label="V_in (V)" placeholder="5.0" />
                    <ParamInput config={config} updateConfig={updateConfig} paramKey="R1" label="R1 (Ω)" placeholder="100" />
                    <ParamInput config={config} updateConfig={updateConfig} paramKey="R2" label="R2 (Ω)" placeholder="100" />
                    <ParamInput config={config} updateConfig={updateConfig} paramKey="R3" label="R3 (Ω)" placeholder="100" />
                    <ParamInput config={config} updateConfig={updateConfig} paramKey="Rx" label="Rx (Ω)" placeholder="120" />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- New Domains Steps --- */}
      {config.domain === 'passive' && step === 1 && (
        <div className="animate-fade-in space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink mb-1">Passive Circuit</h3>
            <p className="text-xs text-ink-400">Choose topology and parameters</p>
          </div>
          <select
            className="w-full p-2 bg-white border-2 border-ink-200 text-ink text-sm font-mono focus:border-ink-900 focus:outline-none transition-colors"
            value={config.passiveType || ''}
            onChange={(e) => updateConfig('passiveType', e.target.value)}
          >
            <option value="">— Select Type —</option>
            <option value="rc_lpf">RC Low-Pass Filter</option>
            <option value="rc_hpf">RC High-Pass Filter</option>
            <option value="rlc_bandpass">RLC Band-Pass Filter</option>
            <option value="voltage_divider">Voltage Divider</option>
            <option value="wheatstone_bridge">Wheatstone Bridge</option>
            <option value="impedance_match">Impedance Matching (L-Network)</option>
          </select>
          {config.passiveType === 'rc_lpf' && (
            <div className="grid grid-cols-2 gap-3 mt-3 animate-fade-in">
              <ParamInput config={config} updateConfig={updateConfig} paramKey="cutoffFreq" label="Cutoff Freq (Hz)" placeholder="1000" />
              <ParamInput config={config} updateConfig={updateConfig} paramKey="capacitance" label="Capacitor (F)" placeholder="100e-9" />
            </div>
          )}
          {config.passiveType === 'voltage_divider' && (
            <div className="grid grid-cols-2 gap-3 mt-3 animate-fade-in">
              <ParamInput config={config} updateConfig={updateConfig} paramKey="inputVoltage" label="Vin (V)" placeholder="12" />
              <ParamInput config={config} updateConfig={updateConfig} paramKey="outputVoltage" label="Vout (V)" placeholder="3.3" />
              <ParamInput config={config} updateConfig={updateConfig} paramKey="loadCurrent" label="Load Current (A)" placeholder="0.001" />
            </div>
          )}
        </div>
      )}

      {config.domain === 'analog' && step === 1 && (
        <div className="animate-fade-in space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink mb-1">Analog Circuit</h3>
            <p className="text-xs text-ink-400">Configure amplifier or active circuit</p>
          </div>
          <select
            className="w-full p-2 bg-white border-2 border-ink-200 text-ink text-sm font-mono focus:border-ink-900 focus:outline-none transition-colors"
            value={config.analogType || ''}
            onChange={(e) => updateConfig('analogType', e.target.value)}
          >
            <option value="">— Select Type —</option>
            <option value="opamp_inverting">Op-Amp Inverting</option>
            <option value="opamp_noninverting">Op-Amp Non-Inverting</option>
            <option value="opamp_differential">Op-Amp Differential</option>
            <option value="bjt_ce_amp">BJT Common Emitter</option>
            <option value="mosfet_switch">MOSFET Switch</option>
          </select>
          {config.analogType?.includes('opamp') && (
            <div className="grid grid-cols-2 gap-3 mt-3 animate-fade-in">
              <ParamInput config={config} updateConfig={updateConfig} paramKey="gain" label="Gain (V/V)" placeholder="10" />
              <ParamInput config={config} updateConfig={updateConfig} paramKey="vcc" label="Vcc Supply (V)" placeholder="12" />
            </div>
          )}
        </div>
      )}

      {config.domain === 'power' && step === 1 && (
        <div className="animate-fade-in space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink mb-1">Power Electronics</h3>
            <p className="text-xs text-ink-400">Design power supply or regulator</p>
          </div>
          <select
            className="w-full p-2 bg-white border-2 border-ink-200 text-ink text-sm font-mono focus:border-ink-900 focus:outline-none transition-colors"
            value={config.powerType || ''}
            onChange={(e) => updateConfig('powerType', e.target.value)}
          >
            <option value="">— Select Type —</option>
            <option value="ldo">LDO Linear Regulator</option>
            <option value="buck">Buck Step-Down Converter</option>
            <option value="boost">Boost Step-Up Converter</option>
            <option value="battery_charger">LiPo Battery Charger</option>
          </select>
          <div className="grid grid-cols-2 gap-3 mt-3 animate-fade-in">
             <ParamInput config={config} updateConfig={updateConfig} paramKey="vin" label="Vin (V)" placeholder="12" />
             <ParamInput config={config} updateConfig={updateConfig} paramKey="vout" label="Vout / Vbat (V)" placeholder="5" />
             <ParamInput config={config} updateConfig={updateConfig} paramKey="iout" label="Iout (A)" placeholder="1" />
          </div>
        </div>
      )}

      {config.domain === 'protection' && step === 1 && (
        <div className="animate-fade-in space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink mb-1">Protection Circuit</h3>
            <p className="text-xs text-ink-400">Add safety to your designs</p>
          </div>
          <select
            className="w-full p-2 bg-white border-2 border-ink-200 text-ink text-sm font-mono focus:border-ink-900 focus:outline-none transition-colors"
            value={config.protectionType || ''}
            onChange={(e) => updateConfig('protectionType', e.target.value)}
          >
            <option value="">— Select Type —</option>
            <option value="esd">ESD TVS Protection</option>
            <option value="overcurrent">Polyfuse Overcurrent</option>
            <option value="full_input">Full Input Protection Combo</option>
          </select>
          <div className="grid grid-cols-2 gap-3 mt-3 animate-fade-in">
             <ParamInput config={config} updateConfig={updateConfig} paramKey="vwork" label="Working Voltage (V)" placeholder="5" />
             <ParamInput config={config} updateConfig={updateConfig} paramKey="imax" label="Max Current (A)" placeholder="2" />
          </div>
        </div>
      )}

      {config.domain === 'communication' && step === 1 && (
        <div className="animate-fade-in space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink mb-1">Communication</h3>
            <p className="text-xs text-ink-400">Interfaces and buses</p>
          </div>
          <select
            className="w-full p-2 bg-white border-2 border-ink-200 text-ink text-sm font-mono focus:border-ink-900 focus:outline-none transition-colors"
            value={config.commType || ''}
            onChange={(e) => updateConfig('commType', e.target.value)}
          >
            <option value="">— Select Type —</option>
            <option value="uart_rs232">RS232 Level Converter</option>
            <option value="uart_rs485">RS485 Bus Interface</option>
            <option value="i2c_bus">I2C Bus + Pull-ups</option>
            <option value="can_bus">CAN Bus Transceiver</option>
            <option value="level_shifter">Bidirectional Level Shifter</option>
          </select>
        </div>
      )}

      {config.domain === 'timing' && step === 1 && (
        <div className="animate-fade-in space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink mb-1">Timing & Clock</h3>
            <p className="text-xs text-ink-400">Oscillators and timers</p>
          </div>
          <select
            className="w-full p-2 bg-white border-2 border-ink-200 text-ink text-sm font-mono focus:border-ink-900 focus:outline-none transition-colors"
            value={config.timingType || ''}
            onChange={(e) => updateConfig('timingType', e.target.value)}
          >
            <option value="">— Select Type —</option>
            <option value="555_astable">555 Timer (Astable Oscillator)</option>
            <option value="555_pwm">555 Timer (PWM Gen)</option>
            <option value="rc_oscillator">Wien-Bridge Sine Oscillator</option>
          </select>
          <div className="grid grid-cols-2 gap-3 mt-3 animate-fade-in">
             <ParamInput config={config} updateConfig={updateConfig} paramKey="frequency" label="Frequency (Hz)" placeholder="1000" />
             <ParamInput config={config} updateConfig={updateConfig} paramKey="capacitance" label="Timing Capacitor (F)" placeholder="100e-9" />
          </div>
        </div>
      )}

      {/* Domain: NLM */}
      {config.domain === 'nlm' && step === 1 && (
        <div className="animate-fade-in space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink mb-1">Natural Language Requirements</h3>
            <p className="text-xs text-ink-400">Describe the circuit you want to build in plain English.</p>
          </div>
          <textarea
            className="w-full h-32 p-3 bg-white border-2 border-ink-200 text-ink font-mono text-sm focus:border-ink-900 focus:outline-none transition-colors"
            placeholder="e.g., I need a high efficiency power supply to step down from 12V to 1.8V for a portable IoT device..."
            value={config.query || ''}
            onChange={(e) => updateConfig('query', e.target.value)}
          />
          
          <div className="p-4 bg-ink-50 rounded-lg border border-white/5 space-y-3">
            <h4 className="text-sm font-semibold text-ink-600">Optimization Targets</h4>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.constraints?.lowPower || false}
                  onChange={(e) => updateConfig('constraints', { ...config.constraints, lowPower: e.target.checked })}
                  className="w-4 h-4 text-ink-900 bg-white border-ink-300 focus:ring-ink-900"
                />
                <span className="text-sm text-ink font-medium">Prioritize Low Power (Battery operation)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.constraints?.highPerformance || false}
                  onChange={(e) => updateConfig('constraints', { ...config.constraints, highPerformance: e.target.checked })}
                  className="w-4 h-4 text-ink-900 bg-white border-ink-300 focus:ring-ink-900"
                />
                <span className="text-sm text-ink font-medium">Prioritize High Performance (Speed/Latency)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.constraints?.lowCost || false}
                  onChange={(e) => updateConfig('constraints', { ...config.constraints, lowCost: e.target.checked })}
                  className="w-4 h-4 text-ink-900 bg-white border-ink-300 focus:ring-ink-900"
                />
                <span className="text-sm text-ink font-medium">Prioritize Low Cost</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Microcontroller Steps */}
      {config.domain === 'microcontroller' && step === 1 && (
        <div className="animate-fade-in space-y-3">
          <div>
            <h3 className="text-base font-semibold text-ink mb-1">Select Platform</h3>
            <p className="text-xs text-ink-400">Choose your microcontroller board</p>
          </div>

          <div className="space-y-2">
            {platforms.map(p => {
              const meta = platformMeta[p.id] || platformMeta.arduino_uno;
              return (
                <button
                  key={p.id}
                  id={`platform-${p.id}`}
                  onClick={() => { updateConfig('platform', p.id); setStep(2); }}
                  className={`platform-card w-full text-left ${config.platform === p.id ? 'selected' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-xl flex-shrink-0`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink text-sm">{p.name}</div>
                      <div className="text-xs text-ink-400 mt-0.5">{p.mcu} · {p.operatingVoltage}V</div>
                    </div>
                    {config.platform === p.id && (
                      <div className="text-ink-700 mt-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {config.domain === 'microcontroller' && step === 2 && (
        <div className="animate-fade-in space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink mb-1">Select Components</h3>
            <p className="text-xs text-ink-400">
              Choose sensors and actuators for your circuit
            </p>
          </div>

           {/* Sensors */}
          <div>
            <h4 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Sensors
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {sensors.map(s => (
                <ComponentChipWithQty key={s.id} comp={s} configKey="sensors" config={config} updateConfig={updateConfig} />
              ))}
            </div>
          </div>

          {/* Actuators */}
          <div>
            <h4 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
              Actuators
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {actuators.map(a => (
                <ComponentChipWithQty key={a.id} comp={a} configKey="actuators" config={config} updateConfig={updateConfig} />
              ))}
            </div>
          </div>

          {/* Displays */}
          {displays.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                Displays
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {displays.map(d => (
                  <ComponentChipWithQty key={d.id} comp={d} configKey="displays" config={config} updateConfig={updateConfig} />
                ))}
              </div>
            </div>
          )}

          {/* Communication */}
          {comms.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Communication Modules
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {comms.map(c => (
                  <ComponentChipWithQty key={c.id} comp={c} configKey="communication" config={config} updateConfig={updateConfig} />
                ))}
              </div>
            </div>
          )}

          {/* Discrete & Power */}
          <div className="grid grid-cols-2 gap-4">
            {discretes.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  Discretes
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {discretes.map(d => (
                    <ComponentChipWithQty key={d.id} comp={d} configKey="discretes" config={config} updateConfig={updateConfig} />
                  ))}
                </div>
              </div>
            )}
            {power.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                  Power
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {power.map(p => (
                    <ComponentChipWithQty key={p.id} comp={p} configKey="power" config={config} updateConfig={updateConfig} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {(config.sensors?.length > 0 || config.actuators?.length > 0 || 
            config.displays?.length > 0 || config.communication?.length > 0 ||
            config.discretes?.length > 0 || config.power?.length > 0) && (
            <button
              onClick={() => setStep(3)}
              className="btn-primary w-full mt-6 py-3 flex items-center justify-center gap-2 group"
            >
              <span>Next Step</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}

      {config.domain === 'microcontroller' && step === 3 && (
        <div className="animate-fade-in space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink mb-1">Additional Features</h3>
            <p className="text-xs text-ink-400">Enable optional features for your circuit</p>
          </div>

          <div className="space-y-2">
            {FEATURES.map(f => (
              <button
                key={f.id}
                onClick={() => toggleArrayItem('features', f.id)}
                className={`platform-card w-full text-left flex items-center gap-3 py-3 ${
                  config.features?.includes(f.id) ? 'selected' : ''
                }`}
              >
                <span className="text-xl">{f.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm text-ink">{f.label}</div>
                  <div className="text-[10px] text-ink-400">{f.desc}</div>
                </div>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  config.features?.includes(f.id)
                    ? 'bg-ink-900 border-ink-900'
                    : 'border-ink-300'
                }`}>
                  {config.features?.includes(f.id) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer Area with Generate Button */}
      {step > 0 && isStepComplete(step) && (
        <div className="pt-4 border-t border-white/5 space-y-3">
          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            id="btn-generate"
            onClick={() => onGenerate()}
            disabled={!isValid || loading}
            className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
          >
            {loading ? (
              <>
                <div className="spinner w-5 h-5 border-2"></div>
                Generating...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
                </svg>
                Generate Circuit
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
