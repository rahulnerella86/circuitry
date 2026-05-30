/**
 * Circuit Validator — Checks for voltage, pin, and wiring issues.
 */

/**
 * Validate the generated circuit.
 *
 * @param {Object} platform - Platform definition
 * @param {Array} allComponents - All components including support
 * @param {Object} pinResult - Pin allocation result
 * @param {Object} circuit - Circuit builder output
 * @returns {{ valid: boolean, errors: Array, warnings: Array, info: Array }}
 */
function validateCircuit(platform, allComponents, pinResult, circuit) {
  const errors = [];
  const warnings = [];
  const info = [];

  // 1. Check voltage compatibility
  validateVoltages(platform, allComponents, warnings, info);

  // 2. Check pin conflicts
  validatePinConflicts(pinResult, errors);

  // 3. Check current draw
  validateCurrentDraw(platform, allComponents, warnings, errors);

  // 4. Check platform capabilities
  validatePlatformCapabilities(platform, allComponents, warnings);

  // 5. Merge warnings from pin allocation
  if (pinResult.warnings && pinResult.warnings.length > 0) {
    warnings.push(...pinResult.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
    summary: errors.length === 0
      ? (warnings.length === 0
        ? '✅ Circuit is valid — no issues detected.'
        : `⚠️ Circuit is valid with ${warnings.length} warning(s).`)
      : `❌ Circuit has ${errors.length} error(s) that must be resolved.`,
  };
}

/**
 * Check voltage compatibility between components and platform.
 */
function validateVoltages(platform, components, warnings, info) {
  const platformV = platform.operatingVoltage;

  for (const comp of components) {
    if (!comp.voltage || comp.category === 'passive') continue;

    const { min, max, typical } = comp.voltage;

    if (platformV < min) {
      warnings.push(
        `${comp.name}: Requires minimum ${min}V but platform operates at ${platformV}V. ` +
        `Power this component from the 5V USB rail or use an external power supply.`
      );
    }

    if (typical && Math.abs(typical - platformV) > 0.5 && typical < platformV) {
      info.push(
        `${comp.name}: Operates at ${typical}V (platform is ${platformV}V). ` +
        `Use the ${typical}V power rail and consider logic level shifting.`
      );
    }
  }
}

/**
 * Check for pin allocation conflicts.
 */
function validatePinConflicts(pinResult, errors) {
  const pinUsage = {};

  for (const assignment of pinResult.assignments) {
    for (const [pinName, pinInfo] of Object.entries(assignment.pins)) {
      if (!pinInfo || !pinInfo.pinId || pinInfo.shared) continue;

      const pinId = pinInfo.pinId;
      if (pinUsage[pinId]) {
        errors.push(
          `Pin conflict: ${pinId} is assigned to both ${pinUsage[pinId]} and ${assignment.componentName} (${pinName})`
        );
      } else {
        pinUsage[pinId] = `${assignment.componentName} (${pinName})`;
      }
    }
  }
}

/**
 * Estimate total current draw and check against platform limits.
 */
function validateCurrentDraw(platform, components, warnings, errors) {
  // Rough current estimates per component type (mA)
  const currentEstimates = {
    sensor: 15,
    actuator: 50,
    display: 25,
    communication: 40,
    passive: 0,
  };

  let totalCurrent = 0;
  for (const comp of components) {
    totalCurrent += currentEstimates[comp.category] || 10;
  }

  if (totalCurrent > platform.maxCurrentTotal) {
    errors.push(
      `Estimated total current draw (~${totalCurrent}mA) exceeds platform limit (${platform.maxCurrentTotal}mA). ` +
      `Use external power supply for high-current components (motors, relays).`
    );
  } else if (totalCurrent > platform.maxCurrentTotal * 0.7) {
    warnings.push(
      `Estimated current draw (~${totalCurrent}mA) is ${Math.round(totalCurrent / platform.maxCurrentTotal * 100)}% of platform capacity. ` +
      `Consider external power for actuators.`
    );
  }
}

/**
 * Check that selected components are compatible with the platform.
 */
function validatePlatformCapabilities(platform, components, warnings) {
  // Check analog pin count
  const analogComponents = components.filter(c => c.protocol === 'analog');
  const analogPins = platform.pins.filter(p => p.capabilities && p.capabilities.includes('analog'));

  if (analogComponents.length > analogPins.length) {
    warnings.push(
      `${analogComponents.length} analog components selected but ${platform.name} only has ${analogPins.length} analog pins.`
    );
  }

  // Check I2C address conflicts
  const i2cAddresses = {};
  for (const comp of components) {
    if (comp.i2cAddress) {
      if (i2cAddresses[comp.i2cAddress]) {
        warnings.push(
          `I2C address conflict: ${comp.name} and ${i2cAddresses[comp.i2cAddress]} both use address ${comp.i2cAddress}`
        );
      } else {
        i2cAddresses[comp.i2cAddress] = comp.name;
      }
    }
  }
}

module.exports = { validateCircuit };
