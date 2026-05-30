/**
 * Pin Allocator — Assigns MCU pins to components based on protocol requirements.
 * Ensures no conflicts, respects reserved pins, and optimizes allocation.
 */

/**
 * Allocate pins for all components on the given platform.
 *
 * @param {Object} platform - Platform definition from platforms.json
 * @param {Array} components - Array of component objects
 * @param {Array} features - Array of feature strings (e.g. ['iot'])
 * @returns {{ assignments: Array, warnings: Array, usedPins: Set }}
 */
function allocatePins(platform, components, features = []) {
  const usedPins = new Set();
  const assignments = [];
  const warnings = [];

  // WiFi active means ESP32 ADC2 pins can't do analog reads
  const wifiActive = features.includes('iot') || platform.hasWifi;

  // Reserve default pins
  const reservedPins = new Set();
  platform.pins.forEach(p => {
    if (p.reserved) {
      reservedPins.add(p.id);
    }
  });

  // Track I2C bus usage — all I2C devices share the same bus
  let i2cAllocated = false;

  // Track SPI bus usage — SPI devices share MOSI/MISO/SCK, need unique CS
  let spiAllocated = false;
  const spiCSPins = []; // track which CS pins are used

  // Track instance counts for duplicate components
  const instanceCount = {};

  // Sort components by protocol priority: i2c/spi first (shared buses), then analog, then pwm, then digital
  const protocolPriority = { i2c: 0, spi: 1, uart: 2, analog: 3, pwm: 4, oneWire: 5, digital: 6 };
  const sorted = [...components].sort((a, b) => {
    return (protocolPriority[a.protocol] || 99) - (protocolPriority[b.protocol] || 99);
  });

  for (const component of sorted) {
    // Handle duplicate components — give each a unique instance id
    instanceCount[component.id] = (instanceCount[component.id] || 0) + 1;
    const instanceId = instanceCount[component.id] > 1
      ? `${component.id}_${instanceCount[component.id]}`
      : component.id;
    const instanceName = instanceCount[component.id] > 1
      ? `${component.name} #${instanceCount[component.id]}`
      : component.name;

    const assignment = allocateComponentPins(
      platform, { ...component, _instanceId: instanceId, _instanceName: instanceName },
      usedPins, reservedPins,
      { i2cAllocated, spiAllocated, spiCSPins, wifiActive },
      warnings
    );

    if (assignment) {
      assignments.push(assignment);

      // Mark pins as used
      for (const pin of Object.values(assignment.pins)) {
        if (pin && pin.pinId) {
          // I2C and SPI bus pins can be shared
          if (pin.shared) continue;
          usedPins.add(pin.pinId);
        }
      }

      if (component.protocol === 'i2c') i2cAllocated = true;
      if (component.protocol === 'spi') spiAllocated = true;
    }
  }

  return { assignments, warnings, usedPins };
}

/**
 * Allocate pins for a single component.
 */
function allocateComponentPins(platform, component, usedPins, reservedPins, busState, warnings) {
  const assignment = {
    componentId: component._instanceId || component.id,
    componentName: component._instanceName || component.name,
    protocol: component.protocol,
    pins: {},
  };

  switch (component.protocol) {
    case 'i2c':
      return allocateI2C(platform, component, assignment, busState, warnings);

    case 'spi':
      return allocateSPI(platform, component, assignment, usedPins, reservedPins, busState, warnings);

    case 'uart':
      return allocateUART(platform, component, assignment, usedPins, reservedPins, warnings);

    case 'analog':
      return allocateAnalog(platform, component, assignment, usedPins, reservedPins, warnings, busState);

    case 'pwm':
      return allocatePWM(platform, component, assignment, usedPins, reservedPins, warnings);

    case 'digital':
      return allocateDigital(platform, component, assignment, usedPins, reservedPins, warnings);

    case 'oneWire':
      return allocateDigital(platform, component, assignment, usedPins, reservedPins, warnings);

    default:
      return allocateDigital(platform, component, assignment, usedPins, reservedPins, warnings);
  }
}

/**
 * Allocate I2C bus pins (shared across all I2C devices).
 */
function allocateI2C(platform, component, assignment, busState, warnings) {
  const i2c = platform.i2c;
  if (!i2c) {
    warnings.push(`Platform ${platform.name} does not have I2C support.`);
    return null;
  }

  assignment.pins.SDA = { pinId: i2c.sda, pinName: i2c.sda, shared: true, bus: 'I2C' };
  assignment.pins.SCL = { pinId: i2c.scl, pinName: i2c.scl, shared: true, bus: 'I2C' };

  if (component.i2cAddress) {
    assignment.i2cAddress = component.i2cAddress;
  }

  return assignment;
}

/**
 * Allocate SPI bus pins (shared bus, unique CS per device).
 */
function allocateSPI(platform, component, assignment, usedPins, reservedPins, busState, warnings) {
  const spi = platform.spi;
  if (!spi) {
    warnings.push(`Platform ${platform.name} does not have SPI support.`);
    return null;
  }

  // Shared bus lines
  assignment.pins.MOSI = { pinId: spi.mosi, pinName: spi.mosi, shared: true, bus: 'SPI' };
  assignment.pins.MISO = { pinId: spi.miso, pinName: spi.miso, shared: true, bus: 'SPI' };
  assignment.pins.SCK = { pinId: spi.sck, pinName: spi.sck, shared: true, bus: 'SPI' };

  // Find a CS pin — first use default SS pin, then find available digital
  let csPin = null;
  const signalPins = component.pins.filter(p => p.name === 'CS' || p.name === 'CSN');

  if (!busState.spiAllocated && !usedPins.has(spi.ss)) {
    csPin = findPlatformPin(platform, spi.ss);
  }

  if (!csPin) {
    csPin = findAvailablePin(platform, 'digital', usedPins, reservedPins);
  }

  if (csPin) {
    const csName = signalPins.length > 0 ? signalPins[0].name : 'CS';
    assignment.pins[csName] = { pinId: csPin.id, pinName: csPin.name };
    usedPins.add(csPin.id);
  } else {
    warnings.push(`No available CS pin for ${component.name}`);
  }

  // Allocate CE pin if needed (e.g., NRF24L01)
  const cePins = component.pins.filter(p => p.name === 'CE');
  if (cePins.length > 0) {
    const cePin = findAvailablePin(platform, 'digital', usedPins, reservedPins);
    if (cePin) {
      assignment.pins.CE = { pinId: cePin.id, pinName: cePin.name };
      usedPins.add(cePin.id);
    }
  }

  return assignment;
}

/**
 * Allocate UART pins.
 */
function allocateUART(platform, component, assignment, usedPins, reservedPins, warnings) {
  // Try secondary UART first (if available), keep primary for Serial debug
  const uart = platform.uart2 || platform.uart;

  if (platform.uart2) {
    const txPin = findPlatformPin(platform, platform.uart2.tx);
    const rxPin = findPlatformPin(platform, platform.uart2.rx);
    if (txPin && rxPin) {
      assignment.pins.RXD = { pinId: txPin.id, pinName: txPin.name, note: 'UART2 TX → component RXD' };
      assignment.pins.TXD = { pinId: rxPin.id, pinName: rxPin.name, note: 'UART2 RX ← component TXD' };
      usedPins.add(txPin.id);
      usedPins.add(rxPin.id);
      assignment.usesSoftwareSerial = false;
      return assignment;
    }
  }

  // Fallback: use SoftwareSerial on two digital pins
  const pin1 = findAvailablePin(platform, 'digital', usedPins, reservedPins);
  if (pin1) {
    usedPins.add(pin1.id);
    const pin2 = findAvailablePin(platform, 'digital', usedPins, reservedPins);
    if (pin2) {
      usedPins.add(pin2.id);
      assignment.pins.RXD = { pinId: pin1.id, pinName: pin1.name, note: 'SoftwareSerial RX' };
      assignment.pins.TXD = { pinId: pin2.id, pinName: pin2.name, note: 'SoftwareSerial TX' };
      assignment.usesSoftwareSerial = true;
      return assignment;
    }
  }

  warnings.push(`Not enough pins for UART device ${component.name}`);
  return assignment;
}

/**
 * Allocate analog input pins.
 */
function allocateAnalog(platform, component, assignment, usedPins, reservedPins, warnings, busState) {
  const signalPins = component.pins.filter(
    p => p.type === 'signal' && p.protocol === 'analog'
  );

  for (const signalPin of signalPins) {
    // On ESP32 with WiFi active: prefer ADC1 pins, avoid ADC2
    let analogPin = null;
    if (busState && busState.wifiActive) {
      analogPin = platform.pins.find(p => {
        if (usedPins.has(p.id) || reservedPins.has(p.id)) return false;
        const hasAnalog = p.capabilities.includes('analog') || p.capabilities.includes('adc1');
        const isADC2 = p.capabilities.includes('adc2');
        return hasAnalog && !isADC2;
      });
      if (!analogPin) {
        // Fallback: use ADC2 pin but warn
        analogPin = findAvailablePin(platform, 'analog', usedPins, reservedPins);
        if (analogPin && analogPin.capabilities && analogPin.capabilities.includes('adc2')) {
          warnings.push(`${component.name}: Using ADC2 pin ${analogPin.name} — may conflict with WiFi. Consider using ADC1 pins.`);
        }
      }
    } else {
      analogPin = findAvailablePin(platform, 'analog', usedPins, reservedPins);
    }

    if (analogPin) {
      assignment.pins[signalPin.name] = {
        pinId: analogPin.id,
        pinName: analogPin.name,
        pinType: 'analog',
        adcChannel: analogPin.analogChannel !== undefined ? `ADC${analogPin.analogChannel}` : null,
      };
      usedPins.add(analogPin.id);
    } else {
      warnings.push(`No available analog pin for ${component.name} / ${signalPin.name}`);
    }
  }

  // Also allocate digital output pins if the component has them (e.g., MQ-2 DOUT)
  const digitalPins = component.pins.filter(
    p => p.type === 'signal' && p.protocol === 'digital'
  );
  for (const dp of digitalPins) {
    const pin = findAvailablePin(platform, 'digital', usedPins, reservedPins);
    if (pin) {
      assignment.pins[dp.name] = { pinId: pin.id, pinName: pin.name, pinType: 'digital' };
      usedPins.add(pin.id);
    }
  }

  return assignment;
}

/**
 * Allocate PWM-capable pins.
 */
function allocatePWM(platform, component, assignment, usedPins, reservedPins, warnings) {
  const signalPins = component.pins.filter(
    p => p.type === 'signal' && (p.protocol === 'pwm' || p.protocol === 'digital')
  );

  for (const signalPin of signalPins) {
    const protocol = signalPin.protocol === 'pwm' ? 'pwm' : 'digital';
    const pin = findAvailablePin(platform, protocol, usedPins, reservedPins);
    if (pin) {
      assignment.pins[signalPin.name] = { pinId: pin.id, pinName: pin.name, pinType: protocol };
      usedPins.add(pin.id);
    } else {
      // Fallback: try any digital pin for PWM (some platforms have software PWM)
      const fallback = findAvailablePin(platform, 'digital', usedPins, reservedPins);
      if (fallback) {
        assignment.pins[signalPin.name] = { pinId: fallback.id, pinName: fallback.name, pinType: 'digital (no PWM)', note: 'No PWM pin available, using digital' };
        usedPins.add(fallback.id);
        warnings.push(`${component.name}: No PWM pin available for ${signalPin.name}, using digital pin ${fallback.name}`);
      } else {
        warnings.push(`No available pin for ${component.name} / ${signalPin.name}`);
      }
    }
  }

  return assignment;
}

/**
 * Allocate digital pins (general purpose).
 */
function allocateDigital(platform, component, assignment, usedPins, reservedPins, warnings) {
  const signalPins = component.pins.filter(p => p.type === 'signal');

  for (const signalPin of signalPins) {
    // For oneWire protocol, prefer interrupt-capable pins for better timing
    let pin = null;
    if (component.protocol === 'oneWire') {
      pin = platform.pins.find(p => {
        if (usedPins.has(p.id) || reservedPins.has(p.id)) return false;
        return p.capabilities.includes('digital') && p.capabilities.includes('interrupt');
      });
    }
    if (!pin) {
      pin = findAvailablePin(platform, 'digital', usedPins, reservedPins);
    }

    if (pin) {
      assignment.pins[signalPin.name] = {
        pinId: pin.id,
        pinName: pin.name,
        pinType: component.protocol === 'oneWire' ? 'digital (oneWire)' : 'digital',
      };
      usedPins.add(pin.id);
    } else {
      warnings.push(`No available digital pin for ${component.name} / ${signalPin.name}`);
    }
  }

  return assignment;
}

/**
 * Find a specific platform pin by ID.
 */
function findPlatformPin(platform, pinId) {
  return platform.pins.find(p => p.id === pinId) || null;
}

/**
 * Find the next available pin with the given capability.
 */
function findAvailablePin(platform, capability, usedPins, reservedPins) {
  return platform.pins.find(p => {
    if (usedPins.has(p.id)) return false;
    if (reservedPins.has(p.id)) return false;
    if (p.inputOnly && capability === 'pwm') return false;
    return p.capabilities.includes(capability);
  }) || null;
}

module.exports = { allocatePins };
