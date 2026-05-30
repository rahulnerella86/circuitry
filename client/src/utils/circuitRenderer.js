/**
 * Circuit Renderer — SVG rendering utilities for circuit diagrams.
 * Handles component positioning, symbol drawing, and wire routing.
 */

// Component icon SVG paths (simplified schematic symbols)
const COMPONENT_SYMBOLS = {
  // Sensors
  thermometer: { 
    path: 'M12 2a3 3 0 0 0-3 3v7.07A5 5 0 1 0 15 17a5 5 0 0 0-3-4.58V5a3 3 0 0 0-3-3z',
    color: '#f59e0b',
  },
  sun: { 
    path: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
    color: '#fbbf24', 
  },
  wind: { path: 'M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2', color: '#a78bfa' },
  radio: { path: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', color: '#60a5fa' },
  activity: { path: 'M22 12h-4l-3 9L9 3l-3 9H2', color: '#34d399' },
  droplet: { path: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z', color: '#38bdf8' },
  eye: { path: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', color: '#c084fc' },
  zap: { path: 'M13 2L3 14h9l-1 10 10-12h-9l1-10z', color: '#fde047' },
  flame: { path: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3.5-7.5C14 4 14.5 6 14.5 7.5c.73-.84 1.5-1.5 1.5-1.5C17 8 18 10 18 12.5a5.5 5.5 0 0 1-11 0z', color: '#f97316' },
  cloud: { path: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z', color: '#93c5fd' },
  
  // Actuators
  lightbulb: { path: 'M9 21h6M12 3a6 6 0 0 0-4 10.47V17h8v-3.53A6 6 0 0 0 12 3z', color: '#fbbf24' },
  palette: { path: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.39-.15-.74-.39-1.02-.23-.27-.38-.62-.38-1.02C12.73 17.1 13.78 16 15 16h1.77C19.65 16 22 13.65 22 10.77 22 5.82 17.5 2 12 2z', color: '#ec4899' },
  'toggle-right': { path: 'M16 5v14l6-7zm-8 0v14l6-7z', color: '#818cf8' },
  settings: { path: 'M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', color: '#a78bfa' },
  'rotate-cw': { path: 'M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10', color: '#f472b6' },
  'volume-2': { path: 'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07', color: '#fb923c' },
  disc: { path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', color: '#6ee7b7' },

  // Displays
  monitor: { path: 'M20 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8 21h8M12 17v4', color: '#67e8f9' },
  smartphone: { path: 'M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM12 18h0', color: '#a5b4fc' },
  hash: { path: 'M4 9h16M4 15h16M10 3v18M14 3v18', color: '#86efac' },

  // Communication
  bluetooth: { path: 'M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11', color: '#60a5fa' },
  wifi: { path: 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h0', color: '#34d399' },
  'hard-drive': { path: 'M22 12H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11zM6 16h0M10 16h0', color: '#fca5a5' },
};

// MCU board layouts
const MCU_LAYOUTS = {
  arduino_uno: {
    width: 180,
    height: 240,
    color: '#2a8bff',
    label: 'Arduino Uno',
    pinLayout: 'dual-row',
  },
  esp32: {
    width: 160,
    height: 280,
    color: '#14b89a',
    label: 'ESP32',
    pinLayout: 'dual-row',
  },
  esp8266: {
    width: 150,
    height: 220,
    color: '#f59e0b',
    label: 'ESP8266',
    pinLayout: 'dual-row',
  },
};

/**
 * Calculate positions for components around the MCU.
 */
export function calculateLayout(platformId, components, pinAssignments) {
  const mcu = MCU_LAYOUTS[platformId] || MCU_LAYOUTS.arduino_uno;
  const centerX = 500;
  const centerY = 350;
  
  const sensors = components.filter(c => c.category === 'sensor');
  const actuators = components.filter(c => c.category === 'actuator');
  const displays = components.filter(c => c.category === 'display');
  const comms = components.filter(c => c.category === 'communication');
  
  const positions = {};
  
  // MCU in center
  positions.mcu = { x: centerX, y: centerY, width: mcu.width, height: mcu.height };
  
  // Sensors on the left
  sensors.forEach((comp, i) => {
    const spacing = Math.min(120, (mcu.height + 100) / Math.max(sensors.length, 1));
    positions[comp.id] = {
      x: centerX - mcu.width / 2 - 200,
      y: centerY - (sensors.length - 1) * spacing / 2 + i * spacing,
      side: 'left',
    };
  });
  
  // Actuators on the right
  actuators.forEach((comp, i) => {
    const spacing = Math.min(120, (mcu.height + 100) / Math.max(actuators.length, 1));
    positions[comp.id] = {
      x: centerX + mcu.width / 2 + 200,
      y: centerY - (actuators.length - 1) * spacing / 2 + i * spacing,
      side: 'right',
    };
  });
  
  // Displays on top
  displays.forEach((comp, i) => {
    const spacing = 160;
    positions[comp.id] = {
      x: centerX - (displays.length - 1) * spacing / 2 + i * spacing,
      y: centerY - mcu.height / 2 - 140,
      side: 'top',
    };
  });
  
  // Communication modules at bottom
  comms.forEach((comp, i) => {
    const spacing = 160;
    positions[comp.id] = {
      x: centerX - (comms.length - 1) * spacing / 2 + i * spacing,
      y: centerY + mcu.height / 2 + 140,
      side: 'bottom',
    };
  });
  
  return { positions, mcu: { ...mcu, x: centerX, y: centerY } };
}

/**
 * Get the symbol info for a component icon.
 */
export function getComponentSymbol(iconName) {
  return COMPONENT_SYMBOLS[iconName] || { path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', color: '#9ca3af' };
}

/**
 * Get wire path between two points with right-angle routing.
 */
export function getWirePath(from, to, side) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  
  if (side === 'left' || side === 'right') {
    return `M ${from.x} ${from.y} H ${midX} V ${to.y} H ${to.x}`;
  } else {
    return `M ${from.x} ${from.y} V ${midY} H ${to.x} V ${to.y}`;
  }
}

/**
 * Get protocol-based wire color.
 */
export function getWireColor(type, protocol) {
  if (type === 'power') return '#ef4444';
  if (type === 'ground') return '#6b7280';
  
  const colors = {
    i2c: '#8b5cf6',
    spi: '#f59e0b',
    uart: '#10b981',
    analog: '#3b82f6',
    pwm: '#ec4899',
    oneWire: '#06b6d4',
    digital: '#6366f1',
  };
  return colors[protocol] || '#9ca3af';
}

export { COMPONENT_SYMBOLS, MCU_LAYOUTS };
