/**
 * PCBGuide — PCB layout recommendations, stackup, routing, and placement.
 */
export default function PCBGuide({ result }) {
  if (!result) return null;

  const platform = result.platform || {};
  const components = result.components || [];
  const connections = result.connections || [];

  const hasI2C = components.some(c => c.protocol === 'i2c');
  const hasSPI = components.some(c => c.protocol === 'spi');
  const hasAnalog = components.some(c => c.protocol === 'analog');
  const hasHighPower = components.some(c => (c.current?.max || 0) > 500);
  const hasRF = components.some(c => ['radio', 'lora', 'bluetooth', 'wifi'].includes(c.type));

  const sections = [
    {
      title: 'Board Stackup',
      icon: '📐',
      items: [
        'Use a minimum 2-layer board (top: signal + components, bottom: ground plane)',
        hasAnalog ? '⚠️ Consider 4-layer stackup for analog/digital separation' : null,
        hasRF ? '⚠️ RF circuits require controlled impedance traces (50Ω typical)' : null,
        'Copper weight: 1oz (35µm) for signal, 2oz for power if high-current',
        'Standard FR4 material (1.6mm thickness) is suitable for most designs',
      ].filter(Boolean),
    },
    {
      title: 'Ground Plane Strategy',
      icon: '🌍',
      items: [
        'Maintain an unbroken ground plane on bottom layer',
        'Do NOT route signals across ground plane splits',
        hasAnalog ? '⚠️ Separate analog and digital ground regions — connect at single point near ADC' : null,
        hasHighPower ? '⚠️ Use star grounding for power and signal grounds' : null,
        'Place GND vias near every IC ground pin',
        'Use copper pour for GND fill on unused areas (both layers)',
      ].filter(Boolean),
    },
    {
      title: 'Power Distribution',
      icon: '⚡',
      items: [
        `Main supply: ${platform.operatingVoltage || 5}V — use wide traces (≥40mil for power, ≥10mil for signals)`,
        'Place bulk capacitor (100µF+) near power input connector',
        'Place 100nF ceramic decoupling cap beside EVERY IC — as close as possible!',
        hasHighPower ? '⚠️ High-current paths need thick traces or copper pours: I = 1A needs ~20mil @ 1oz Cu (external)' : null,
        'Separate voltage regulators from sensitive analog circuits',
        components.some(c => c.category === 'power') ? 'Place voltage regulators near power input, with space for thermal relief' : null,
      ].filter(Boolean),
    },
    {
      title: 'Component Placement',
      icon: '📦',
      items: [
        `Place ${platform.name || 'MCU'} centrally — all peripherals radiate outward`,
        'Connectors on board edges',
        hasI2C ? 'I2C devices: cluster near MCU, keep bus traces short (<30cm total)' : null,
        hasSPI ? 'SPI devices: keep MISO/MOSI/SCK traces matched in length' : null,
        hasAnalog ? '⚠️ Analog sensors: place away from switching power supplies and digital noise sources' : null,
        hasRF ? '⚠️ RF module: place at board edge, keep clearance zone around antenna (no copper underneath)' : null,
        'LEDs / actuators: near board edge for accessibility',
        'Test points: add pads for GND, VCC, and key signals',
      ].filter(Boolean),
    },
    {
      title: 'Routing Guidelines',
      icon: '🔀',
      items: [
        'Signal traces: 8-10mil (0.2-0.25mm) minimum width',
        'Power traces: 20-40mil (0.5-1mm) depending on current',
        hasI2C ? 'I2C: SDA/SCL can be longer (~30cm max), but add pull-ups at MCU end' : null,
        hasSPI ? 'SPI: Keep clock (SCK) trace short, guard with ground traces' : null,
        hasAnalog ? '⚠️ Analog signals: route away from clock/digital lines, guard with GND traces on both sides' : null,
        'Avoid sharp 90° trace bends — use 45° chamfers',
        'Minimize via count on signal paths',
        hasRF ? 'RF traces: use coplanar waveguide or microstrip (50Ω impedance), matched length' : null,
        'Keep return path in mind: signals and their return current should flow in parallel on adjacent layers',
      ].filter(Boolean),
    },
    {
      title: 'Decoupling & Bypass',
      icon: '🔌',
      items: [
        'Every IC needs its own 100nF (0.1µF) ceramic capacitor — closest to VCC/GND pins',
        'Bulk capacitor (10-100µF) near power regulator output',
        'Place capacitors on same side as IC (don\'t route through vias if possible)',
        'Crystal load capacitors right next to crystal, short trace to MCU pins',
        hasAnalog ? 'Add extra filtering (10µF + 100nF) on analog supply pin' : null,
      ].filter(Boolean),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-ink-200 rounded-xl p-5">
        <h3 className="text-lg font-bold text-ink mb-1">PCB Layout Guide</h3>
        <p className="text-sm text-ink-400">
          Auto-generated layout recommendations for your {platform.name || 'circuit'} design with {components.length} components and {connections.length} connections.
        </p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {hasI2C && <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/20">I2C Bus</span>}
          {hasSPI && <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 border border-amber-500/20">SPI Bus</span>}
          {hasAnalog && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/20">Analog</span>}
          {hasHighPower && <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-300 border border-red-500/20">High Power</span>}
          {hasRF && <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">RF/Wireless</span>}
        </div>
      </div>

      {/* Sections grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-surface-800/40 border border-ink-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <span>{section.icon}</span>
              <span>{section.title}</span>
            </h4>
            <ul className="space-y-2">
              {section.items.map((item, i) => (
                <li key={i} className={`text-xs leading-relaxed flex gap-2 ${item.startsWith('⚠️') ? 'text-orange-300' : 'text-ink-400'}`}>
                  <span className="mt-1 flex-shrink-0">{item.startsWith('⚠️') ? '' : '•'}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
