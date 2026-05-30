import { useMemo, useState } from 'react';
import { calculateLayout, getComponentSymbol, getWireColor } from '../utils/circuitRenderer';

const LegendOverlay = () => (
  <div className="absolute bottom-4 left-4 bg-white border-2 border-ink-200 p-4 shadow-sm z-10 w-44 pointer-events-none">
    <h3 className="font-mono text-[13px] font-bold uppercase tracking-[0.1em] text-ink mb-3">
      Schematic
    </h3>
    <hr className="border-ink-200 mb-3" />
    <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-3">
      Node Types
    </h4>
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-[#06b6d4]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        MCU
      </div>
      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-[#3b82f6]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        Sensor
      </div>
      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-[#f97316]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        Actuator
      </div>
      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-[#eab308]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        Power
      </div>
      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-[#a855f7]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        Module
      </div>
      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-[#ec4899]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        Display
      </div>
    </div>
    <hr className="border-ink-200 mb-3" />
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-[#22c55e]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        <span className="w-6 h-0.5 bg-[#22c55e] block"></span>
        Data
      </div>
      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-[#eab308]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        <span className="w-6 border-b-2 border-dashed border-[#eab308] block"></span>
        Power
      </div>
    </div>
  </div>
);

const renderNodeSymbol = (node) => {
  const name = (node.name || '').toUpperCase();
  const cat = (node.category || '').toLowerCase();

  // Gate detection
  const isNand = name.includes('NAND');
  const isNor = name.includes('NOR') && !name.includes('XNOR');
  const isXnor = name.includes('XNOR');
  const isAnd = !isNand && name.includes('AND');
  const isOr = !isNor && !isXnor && name.includes('OR') && !name.includes('XOR');
  const isXor = !isXnor && name.includes('XOR');
  const isNot = name.includes('NOT') || name.includes('INVERTER');

  // Passive detection
  const isResistor = name.match(/^R\d*$/) || name.includes('RESISTOR') || (cat === 'passive' && name === 'R');
  const isCapacitor = name.match(/^C\d*$/) || name.includes('CAPACITOR') || (cat === 'passive' && name === 'C');
  const isInductor = name.match(/^L\d*$/) || name.includes('INDUCTOR') || (cat === 'passive' && name === 'L');
  const isOpAmp = name.includes('OP-AMP') || name.includes('OPAMP') || name.includes('OP AMP') || cat === 'opamp';

  // DSP detection
  const isDelay = name.includes('Z⁻¹') || name.includes('Z-1') || name.includes('DELAY') || cat === 'delay';
  const isSummer = name.includes('Σ') || name.includes('ADDER') || name.includes('SUM') || cat === 'summer';
  const isMultiplier = cat === 'multiplier' || (name.startsWith('×') || name.startsWith('X '));
  const isBlock = cat === 'block' || cat === 'filter' || cat === 'dsp';
  const isFlipFlop = cat === 'flipflop' || name.includes('FLIP') || name.includes('LATCH');

  let stroke = '#1a1a1a';
  let fill = '#ffffff';

  // Category-based colors (all minimal black in this theme)
  if (cat === 'passive') stroke = '#1a1a1a';
  else if (cat === 'opamp') stroke = '#1a1a1a';
  else if (cat === 'delay') stroke = '#1a1a1a';
  else if (cat === 'summer') stroke = '#1a1a1a';
  else if (cat === 'multiplier') stroke = '#1a1a1a';
  else if (cat === 'logic') stroke = '#1a1a1a';

  let shape = <rect x="-30" y="-20" width="60" height="40" rx="4" fill={fill} stroke={stroke} strokeWidth="2" />;
  
  if (isOpAmp) {
    // Op-amp triangle
    shape = (
      <>
        <path d="M -25 -30 L -25 30 L 30 0 Z" fill={fill} stroke={stroke} strokeWidth="2" />
        <text x="-16" y="-8" fontSize="12" fill={stroke} fontWeight="bold" fontFamily="Space Mono">+</text>
        <text x="-16" y="14" fontSize="12" fill={stroke} fontWeight="bold" fontFamily="Space Mono">−</text>
      </>
    );
  } else if (isNand) {
    shape = (
      <>
        <path d="M -20 -20 L 0 -20 A 20 20 0 0 1 0 20 L -20 20 Z" fill={fill} stroke={stroke} strokeWidth="2" />
        <circle cx="24" cy="0" r="4" fill={fill} stroke={stroke} strokeWidth="2" />
      </>
    );
  } else if (isNor) {
    shape = (
      <>
        <path d="M -25 -20 Q 0 -20 20 0 Q 0 20 -25 20 Q -10 0 -25 -20" fill={fill} stroke={stroke} strokeWidth="2" />
        <circle cx="24" cy="0" r="4" fill={fill} stroke={stroke} strokeWidth="2" />
      </>
    );
  } else if (isXnor) {
    shape = (
      <>
        <path d="M -30 -20 Q -15 0 -30 20" fill="none" stroke={stroke} strokeWidth="2" />
        <path d="M -25 -20 Q 0 -20 20 0 Q 0 20 -25 20 Q -10 0 -25 -20" fill={fill} stroke={stroke} strokeWidth="2" />
        <circle cx="24" cy="0" r="4" fill={fill} stroke={stroke} strokeWidth="2" />
      </>
    );
  } else if (isAnd) {
    shape = <path d="M -20 -20 L 0 -20 A 20 20 0 0 1 0 20 L -20 20 Z" fill={fill} stroke={stroke} strokeWidth="2" />;
  } else if (isOr) {
    shape = <path d="M -25 -20 Q 0 -20 20 0 Q 0 20 -25 20 Q -10 0 -25 -20" fill={fill} stroke={stroke} strokeWidth="2" />;
  } else if (isXor) {
    shape = (
      <>
        <path d="M -30 -20 Q -15 0 -30 20" fill="none" stroke={stroke} strokeWidth="2" />
        <path d="M -25 -20 Q 0 -20 20 0 Q 0 20 -25 20 Q -10 0 -25 -20" fill={fill} stroke={stroke} strokeWidth="2" />
      </>
    );
  } else if (isNot) {
    shape = (
      <>
        <path d="M -15 -15 L 15 0 L -15 15 Z" fill={fill} stroke={stroke} strokeWidth="2" />
        <circle cx="20" cy="0" r="5" fill={fill} stroke={stroke} strokeWidth="2" />
      </>
    );
  } else if (isDelay) {
    shape = (
      <>
        <rect x="-22" y="-16" width="44" height="32" rx="4" fill="#ffffff" stroke={stroke} strokeWidth="2" />
        <text x="0" y="5" fontSize="13" fill={stroke} textAnchor="middle" fontWeight="bold" fontFamily="Space Mono">z⁻¹</text>
      </>
    );
  } else if (isSummer) {
    shape = (
      <>
        <circle cx="0" cy="0" r="16" fill="#ffffff" stroke={stroke} strokeWidth="2" />
        <text x="0" y="5" fontSize="16" fill={stroke} textAnchor="middle" fontWeight="bold" fontFamily="Space Mono">Σ</text>
      </>
    );
  } else if (isMultiplier) {
    shape = (
      <>
        <circle cx="0" cy="0" r="14" fill="#ffffff" stroke={stroke} strokeWidth="2" />
        <text x="0" y="5" fontSize="14" fill={stroke} textAnchor="middle" fontWeight="bold" fontFamily="Space Mono">×</text>
      </>
    );
  } else if (isResistor) {
    shape = <path d="M -20 0 L -15 -15 L -5 15 L 5 -15 L 15 15 L 20 0" fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />;
  } else if (isCapacitor) {
    shape = <path d="M -5 -15 L -5 15 M 5 -15 L 5 15" fill="none" stroke={stroke} strokeWidth="3" />;
  } else if (isInductor) {
    shape = <path d="M -20 0 Q -10 -15 0 0 Q 10 -15 20 0" fill="none" stroke={stroke} strokeWidth="2" />;
  } else if (isFlipFlop) {
    shape = (
      <>
        <rect x="-30" y="-25" width="60" height="50" rx="4" fill={fill} stroke={stroke} strokeWidth="2" />
        <text x="0" y="4" fontSize="10" fill={stroke} textAnchor="middle" fontWeight="600" fontFamily="Space Mono">{node.name}</text>
      </>
    );
  } else if (isBlock) {
    const w = Math.max(80, (node.name || '').length * 7 + 20);
    shape = (
      <>
        <rect x={-w/2} y="-25" width={w} height="50" rx="4" fill="#ffffff" stroke={stroke} strokeWidth="2" />
        <text x="0" y="5" fontSize="11" fill={stroke} textAnchor="middle" fontWeight="600" fontFamily="Space Mono">{node.name}</text>
      </>
    );
  } else if (node.type === 'input') {
    shape = <circle cx="0" cy="0" r="15" fill="#ffffff" stroke={stroke} strokeWidth="2" />;
  } else if (node.type === 'output') {
    shape = <circle cx="0" cy="0" r="15" fill="#ffffff" stroke={stroke} strokeWidth="2" />;
  } else if (node.type === 'ground') {
    shape = <path d="M -15 0 L 15 0 M -10 5 L 10 5 M -5 10 L 5 10" fill="none" stroke={stroke} strokeWidth="2" />;
  } else if (node.type === 'junction') {
    shape = <circle cx="0" cy="0" r="4" fill={stroke} stroke={stroke} strokeWidth="1" />;
  }

  const showNameAbove = !isBlock && !isFlipFlop && !isDelay;
  const showValueBelow = !isBlock && !isFlipFlop;

  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      {shape}
      {showNameAbove && (
        <text x="0" y="-30" fill="#525252" fontSize="10" textAnchor="middle" fontFamily="Space Mono">{node.name}</text>
      )}
      {showValueBelow && node.value && (
        <text x="0" y="30" fill="#1a1a1a" fontSize="11" textAnchor="middle" fontWeight="bold" fontFamily="Space Mono">
          {node.value}
        </text>
      )}
    </g>
  );
};

export default function CircuitDiagram({ result }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const userComponents = useMemo(() => {
    if (!result || !result.components) return [];
    return result.components.filter(c => c.category !== 'passive');
  }, [result]);

  const isMCU = result && typeof result.platform === 'object' && result.platform.id;

  const layout = useMemo(() => {
    if (!result || !isMCU) return null;
    return calculateLayout(result.platform.id, userComponents, result.pinAssignments || []);
  }, [result, userComponents, isMCU]);

  if (!result) {
    return <div className="text-ink-400 text-center py-20 font-mono text-sm">No circuit data</div>;
  }

  const svgWidth = 1000;
  const svgHeight = 700;
  const viewBox = `${-pan.x / zoom} ${-pan.y / zoom} ${svgWidth / zoom} ${svgHeight / zoom}`;

  if (!isMCU) {
    const truthTableLines = (result.code || '').split('\n').filter(l => l.includes('|'));
    const hasTruthTable = truthTableLines.length > 1;

    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-ink-900"></span>
            {result.domain === 'nlm' ? 'NLM Synthesized Circuit' :
             result.platform === 'logic' ? 'Logic Diagram' : 
             result.platform === 'analog' ? 'Analog Circuit' : 
             result.platform === 'electric' ? 'Electric Circuit' : 'Signal Processing Diagram'}
          </h2>
        </div>

        {/* SVG Canvas */}
        <div className="card overflow-hidden relative" style={{ height: '600px' }}>
          <LegendOverlay />
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1000 700"
            className="circuit-svg bg-bg-muted"
          >
            <defs>
              <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="1000" height="700" fill="url(#grid2)" />

            {/* Render Orthogonal Connections */}
            {result.connections && result.nodes && result.connections.map((conn, connIdx) => {
              const nodeFrom = result.nodes.find(n => n.id === conn.from.node);
              const nodeTo = result.nodes.find(n => n.id === conn.to.node);
              if (!nodeFrom || !nodeTo) return null;

              const x1 = nodeFrom.x + 20;
              const y1 = nodeFrom.y;
              const x2 = nodeTo.x - 20;
              const y2 = nodeTo.y;

              let path;
              const dy = Math.abs(y2 - y1);
              const dx = Math.abs(x2 - x1);

              if (conn.type === 'ground' || conn.type === 'power') {
                path = `M ${nodeFrom.x} ${nodeFrom.y} L ${nodeFrom.x} ${nodeTo.y} L ${nodeTo.x} ${nodeTo.y}`;
              } else if (dy < 5) {
                path = `M ${x1} ${y1} L ${x2} ${y2}`;
              } else if (dx < 5) {
                path = `M ${nodeFrom.x} ${y1} L ${nodeFrom.x} ${y2}`;
              } else {
                const offset = connIdx * 4;
                const midX = (x1 + x2) / 2 + offset;
                path = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
              }

              return (
                <g key={conn.id}>
                  <path
                    d={path}
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth="2"
                    opacity="0.8"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {conn.label && (
                    <text
                      x={(nodeFrom.x + nodeTo.x) / 2}
                      y={Math.min(y1, y2) - 8}
                      fill="#525252"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="Space Mono"
                    >
                      {conn.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Render Direct Nodes */}
            {result.nodes && result.nodes.map(node => (
              <g key={node.id}>
                {renderNodeSymbol(node)}
              </g>
            ))}
          </svg>
        </div>

        {/* Truth Table */}
        {hasTruthTable && (
          <div className="card p-5">
            <h3 className="font-mono text-sm font-bold text-ink mb-3 flex items-center gap-2 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-ink-900"></span>
              Truth Table
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse bp-table">
                <tbody>
                {truthTableLines.map((line, rowIdx) => {
                  const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0 && !c.match(/^-+$/));
                  if (cells.length === 0) return null;
                  const isSeparator = line.match(/^[\s|\\-]+$/);
                  if (isSeparator) return null;
                  const isHeader = rowIdx === 0;
                  return (
                    <tr key={rowIdx} className={isHeader ? 'bg-ink-100' : 'bg-white'}>
                      {cells.map((cell, cIdx) => {
                        const Tag = isHeader ? 'th' : 'td';
                        return (
                          <Tag
                            key={cIdx}
                            className={`px-3 py-1.5 border border-ink-200 text-center font-mono ${
                              isHeader ? 'font-bold text-ink-900 text-xs' : 'text-ink-600 text-xs'
                            }`}
                          >
                            {cell}
                          </Tag>
                        );
                      })}
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  const mcuPinPositions = {};
  if (isMCU && layout) {
    const pinsPerSide = { left: [], right: [], top: [], bottom: [] };
    
    result.pinAssignments.forEach((assignment) => {
      const baseId = assignment.componentId.replace(/_\d+$/, '');
      const comp = userComponents.find(c => c.id === assignment.componentId) || userComponents.find(c => c.id === baseId);
      if (!comp) return;
      const compPos = layout.positions[comp.id];
      if (!compPos) return;

      Object.values(assignment.pins).forEach(pinInfo => {
        if (!pinInfo || !pinInfo.pinId) return;
        if (!pinsPerSide[compPos.side].includes(pinInfo.pinId)) {
          pinsPerSide[compPos.side].push(pinInfo.pinId);
        }
      });
    });

    const mcuPos = layout.mcu;
    Object.keys(pinsPerSide).forEach(side => {
      const pins = pinsPerSide[side];
      const count = pins.length;
      if (count === 0) return;
      
      const isHorizontal = (side === 'top' || side === 'bottom');
      const maxSpan = isHorizontal ? mcuPos.width - 24 : mcuPos.height - 60;
      const spacing = Math.min(25, maxSpan / Math.max(count - 1, 1));
      const span = spacing * (count - 1);
      
      const startCoord = isHorizontal ? mcuPos.x - span / 2 : mcuPos.y - span / 2;

      pins.forEach((pinId, idx) => {
        let x, y;
        if (side === 'left') {
          x = mcuPos.x - mcuPos.width / 2;
          y = startCoord + idx * spacing;
        } else if (side === 'right') {
          x = mcuPos.x + mcuPos.width / 2;
          y = startCoord + idx * spacing;
        } else if (side === 'top') {
          x = startCoord + idx * spacing;
          y = mcuPos.y - mcuPos.height / 2;
        } else {
          x = startCoord + idx * spacing;
          y = mcuPos.y + mcuPos.height / 2;
        }
        mcuPinPositions[`${side}_${pinId}`] = { x, y };
      });
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-ink">
          <span className="w-2 h-2 rounded-full bg-ink-900"></span>
          Circuit Diagram
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="w-8 h-8 rounded border border-ink-200 flex items-center justify-center text-ink-500 hover:text-ink-900 hover:bg-ink-50 transition-all font-mono"
          >
            −
          </button>
          <span className="text-xs text-ink-500 w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="w-8 h-8 rounded border border-ink-200 flex items-center justify-center text-ink-500 hover:text-ink-900 hover:bg-ink-50 transition-all font-mono"
          >
            +
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="px-3 h-8 rounded border border-ink-200 text-xs font-mono uppercase tracking-wider text-ink-500 hover:text-ink-900 hover:bg-ink-50 transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="card overflow-hidden relative" style={{ height: '520px' }}>
        <LegendOverlay />
        <svg
          width="100%"
          height="100%"
          viewBox={viewBox}
          className="circuit-svg bg-bg-muted"
        >
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5"/>
            </pattern>
          </defs>

          <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

          {/* Power Rails */}
          <g opacity="0.8">
            <line x1="50" y1="30" x2="950" y2="30" stroke="#1a1a1a" strokeWidth="2" strokeDasharray="8,4" />
            <text x="55" y="25" fill="#1a1a1a" fontSize="10" fontFamily="Space Mono" fontWeight="600">VCC ({result.platform.operatingVoltage}V)</text>
            <line x1="50" y1="670" x2="950" y2="670" stroke="#737373" strokeWidth="2" strokeDasharray="8,4" />
            <text x="55" y="665" fill="#737373" fontSize="10" fontFamily="Space Mono" fontWeight="600">GND</text>
          </g>

          {/* Wires / Connections */}
          {result.connections
            .filter(conn => conn.type === 'signal')
            .map((conn) => {
              const compId = conn.from.node.replace('node_', '');
              const compPos = layout.positions[compId];
              if (!compPos) return null;

              const fromX = compPos.x;
              const fromY = compPos.y;
              const side = compPos.side;
              const pin = conn.to.pin;
              
              const pinTarget = mcuPinPositions[`${side}_${pin}`];
              if (!pinTarget) return null;

              const { x: toX, y: toY } = pinTarget;
              const wireColor = '#1a1a1a'; // Unified dark color
              const midX = (fromX + toX) / 2;

              let path;
              if (compPos.side === 'left' || compPos.side === 'right') {
                path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
              } else {
                const midY = (fromY + toY) / 2;
                path = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
              }

              return (
                <g key={conn.id}>
                  <path
                    d={path}
                    fill="none"
                    stroke={wireColor}
                    strokeWidth="1.5"
                    opacity="0.8"
                    strokeLinecap="round"
                    className="wire"
                  />
                  <text
                    x={toX + (compPos.side === 'left' ? -8 : compPos.side === 'right' ? 8 : 0)}
                    y={toY - 6}
                    fill={wireColor}
                    fontSize="8"
                    fontFamily="Space Mono"
                    textAnchor={compPos.side === 'left' ? 'end' : 'start'}
                  >
                    {conn.to.pin}
                  </text>
                </g>
              );
            })}

          {/* Power wires to VCC / GND */}
          {userComponents.map((comp) => {
            const pos = layout.positions[comp.id];
            if (!pos) return null;
            return (
              <g key={`power-${comp.id}`} opacity="0.6">
                <line x1={pos.x} y1={pos.y - 25} x2={pos.x} y2="30" stroke="#1a1a1a" strokeWidth="1" strokeDasharray="4,4" />
                <line x1={pos.x} y1={pos.y + 25} x2={pos.x} y2="670" stroke="#737373" strokeWidth="1" strokeDasharray="4,4" />
              </g>
            );
          })}

          {/* MCU Board */}
          <g>
            <rect
              x={layout.mcu.x - layout.mcu.width / 2 + 3}
              y={layout.mcu.y - layout.mcu.height / 2 + 3}
              width={layout.mcu.width}
              height={layout.mcu.height}
              rx="8"
              fill="rgba(0,0,0,0.05)"
            />
            <rect
              x={layout.mcu.x - layout.mcu.width / 2}
              y={layout.mcu.y - layout.mcu.height / 2}
              width={layout.mcu.width}
              height={layout.mcu.height}
              rx="8"
              fill="#ffffff"
              stroke="#1a1a1a"
              strokeWidth="2"
            />
            <rect
              x={layout.mcu.x - 25}
              y={layout.mcu.y - 18}
              width="50"
              height="36"
              rx="2"
              fill="#f5f5f5"
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <text
              x={layout.mcu.x}
              y={layout.mcu.y - layout.mcu.height / 2 + 24}
              textAnchor="middle"
              fill="#1a1a1a"
              fontSize="13"
              fontFamily="Space Mono"
              fontWeight="700"
            >
              {layout.mcu.label}
            </text>
            <text
              x={layout.mcu.x}
              y={layout.mcu.y + 5}
              textAnchor="middle"
              fill="#525252"
              fontSize="9"
              fontFamily="Space Mono"
              fontWeight="500"
            >
              {result.platform.operatingVoltage}V
            </text>

            {Object.entries(mcuPinPositions).map(([key, pos]) => {
              const [side, ...pinIdParts] = key.split('_');
              const pinId = pinIdParts.join('_');
              
              const xOffset = side === 'left' ? 6 : side === 'right' ? -6 : 0;
              const yOffset = side === 'top' ? 12 : side === 'bottom' ? -6 : 3;

              return (
                <text
                  key={key}
                  x={pos.x + xOffset}
                  y={pos.y + yOffset}
                  textAnchor={side === 'left' ? 'start' : side === 'right' ? 'end' : 'middle'}
                  fill="#1a1a1a"
                  fontSize="8"
                  fontFamily="Space Mono"
                  fontWeight="600"
                >
                  {pinId}
                </text>
              );
            })}
          </g>

          {/* Component Nodes */}
          {userComponents.map(comp => {
            const pos = layout.positions[comp.id];
            if (!pos) return null;
            const symbol = getComponentSymbol(comp.icon || 'zap');
            const size = 48;

            return (
              <g key={comp.id} className="component-body" style={{ cursor: 'pointer' }}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size / 2}
                  fill="#ffffff"
                  stroke="#1a1a1a"
                  strokeWidth="2"
                />

                <g transform={`translate(${pos.x - 10}, ${pos.y - 10}) scale(0.83)`}>
                  <path
                    d={symbol.path}
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                <text
                  x={pos.x}
                  y={pos.y + size / 2 + 14}
                  textAnchor="middle"
                  fill="#1a1a1a"
                  fontSize="10"
                  fontFamily="Space Mono"
                  fontWeight="600"
                >
                  {comp.name.length > 18 ? comp.name.substring(0, 16) + '…' : comp.name}
                </text>

                <text
                  x={pos.x}
                  y={pos.y + size / 2 + 26}
                  textAnchor="middle"
                  fill="#737373"
                  fontSize="8"
                  fontFamily="Space Mono"
                >
                  {comp.category}
                </text>
              </g>
            );
          })}

          {/* Legend removed in favor of LegendOverlay */}
        </svg>
      </div>
    </div>
  );
}
