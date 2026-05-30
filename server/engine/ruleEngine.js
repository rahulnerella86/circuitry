const fs = require('fs');
const path = require('path');
const { allocatePins } = require('./pinAllocator');
const { buildCircuit } = require('./circuitBuilder');
const { generateCode } = require('./codeGenerator');
const { validateCircuit } = require('./validator');

// Load data files
const componentsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'components.json'), 'utf-8'));
const platformsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'platforms.json'), 'utf-8'));
const rulesData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'rules.json'), 'utf-8'));

const componentLibrary = {};
componentsData.components.forEach(c => { componentLibrary[c.id] = c; });

/**
 * Main entry point: generate a complete circuit from user input.
 *
 * @param {Object} input - { platform, circuitType, sensors[], actuators[], features[] }
 * @returns {Object} - { components, pinAssignments, connections, netlist, code, explanation, validation }
 */
function generateCircuit(input) {
  const { 
    platform: platformId, 
    sensors = [], 
    actuators = [], 
    displays = [],
    communication = [],
    discretes = [],
    power = [],
    features = [] 
  } = input;

  // 1. Resolve platform
  const platform = platformsData.platforms[platformId];
  if (!platform) {
    throw new Error(`Unknown platform: ${platformId}. Valid platforms: ${Object.keys(platformsData.platforms).join(', ')}`);
  }

  // 2. Resolve selected components
  const selectedComponents = resolveComponents([
    ...sensors, 
    ...actuators, 
    ...displays, 
    ...communication, 
    ...discretes, 
    ...power
  ]);

  // 3. Apply feature rules to add suggested components
  const featureComponents = applyFeatureRules(features, platform, selectedComponents);
  const allUserComponents = [...selectedComponents, ...featureComponents];

  // Fix: Assign unique IDs to duplicates early so layout maps and node IDs match perfectly
  const instanceCount = {};
  for (const comp of allUserComponents) {
    if (!instanceCount[comp.id]) {
      instanceCount[comp.id] = 1;
    } else {
      instanceCount[comp.id]++;
    }
    
    // If it's the second instance or more, append suffix
    if (instanceCount[comp.id] > 1) {
       // but wait, if there are multiple, even the first one should be named #1?
       // Leaving the first one without a suffix is fine normally, but if there are multiple, doing `id_1`, `id_2` is safer.
    }
  }

  // Actually, a simpler way is just to suffix all duplicates:
  const finalCounts = {};
  for (const comp of allUserComponents) {
      finalCounts[comp.id] = (finalCounts[comp.id] || 0) + 1;
  }
  const currCounts = {};
  for (const comp of allUserComponents) {
      if (finalCounts[comp.id] > 1) {
          currCounts[comp.id] = (currCounts[comp.id] || 0) + 1;
          comp.id = `${comp.id}_${currCounts[comp.id]}`;
          comp.name = `${comp.name} #${currCounts[comp.id]}`;
      }
  }

  // 4. Apply support component rules (resistors, drivers, etc.)
  const supportComponents = applySupportRules(allUserComponents);

  // 5. Combine all components
  const allComponents = [...allUserComponents, ...supportComponents];

  // 6. Allocate pins (pass features for WiFi/ADC2 conflict detection)
  const pinResult = allocatePins(platform, allUserComponents, features);

  // 7. Build circuit (connections, netlist)
  const circuit = buildCircuit(platform, allUserComponents, supportComponents, pinResult.assignments);

  // 8. Generate code
  const code = generateCode(platform, allUserComponents, pinResult.assignments, features);

  // 9. Validate circuit
  const validation = validateCircuit(platform, allComponents, pinResult, circuit);

  // 10. Generate explanation
  const explanation = generateExplanation(platform, allUserComponents, features);

  return {
    platform: {
      id: platform.id,
      name: platform.name,
      operatingVoltage: platform.operatingVoltage,
    },
    components: allComponents.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      type: c.type,
      voltage: c.voltage,
      quantity: c.quantity || 1,
      value: c.value || null,
      purpose: c.purpose || null,
    })),
    pinAssignments: pinResult.assignments,
    connections: circuit.connections,
    netlist: circuit.netlist,
    code,
    explanation,
    validation,
  };
}

/**
 * Resolve component IDs to full component objects.
 */
function resolveComponents(allIds) {
  const resolved = [];

  for (const id of allIds) {
    const component = componentLibrary[id];
    if (!component) {
      throw new Error(`Unknown component: ${id}. Available: ${Object.keys(componentLibrary).join(', ')}`);
    }
    resolved.push({ ...component });
  }

  return resolved;
}

/**
 * Apply feature rules to possibly add components.
 */
function applyFeatureRules(features, platform, existingComponents) {
  const added = [];
  const existingIds = new Set(existingComponents.map(c => c.id));

  for (const feature of features) {
    const rules = rulesData.featureRules.filter(r => r.condition.feature === feature);
    for (const rule of rules) {
      // Check platform capability requirement
      if (rule.requirement && rule.requirement.platformCapability) {
        const cap = rule.requirement.platformCapability;
        if (!platform[cap]) {
          // Platform doesn't support this — skip or add note
          continue;
        }
      }

      // Add suggested components if not already present
      if (rule.suggestedComponents) {
        for (const compId of rule.suggestedComponents) {
          if (!existingIds.has(compId) && componentLibrary[compId]) {
            // Only add the first suggestion to avoid clutter
            added.push({ ...componentLibrary[compId], addedByFeature: feature });
            existingIds.add(compId);
            break;
          }
        }
      }
    }
  }

  return added;
}

/**
 * Apply support component rules (resistors, drivers, diodes).
 */
function applySupportRules(components) {
  const supportComponents = [];

  for (const component of components) {
    // Check rules by component ID
    const idRules = rulesData.supportComponentRules.filter(
      r => r.condition.componentId === component.id
    );
    // Check rules by component type
    const typeRules = rulesData.supportComponentRules.filter(
      r => r.condition.componentType === component.type
    );

    const matchedRules = [...idRules, ...typeRules];

    for (const rule of matchedRules) {
      for (const addComp of rule.addComponents) {
        supportComponents.push({
          id: `${addComp.type}_for_${component.id}`,
          name: `${addComp.value} (${addComp.purpose})`,
          category: 'passive',
          type: addComp.type,
          value: addComp.value,
          purpose: addComp.purpose,
          quantity: addComp.quantity,
          forComponent: component.id,
          voltage: component.voltage,
          pins: [],
        });
      }
    }

    // Also add from component's own supportingComponents list
    if (component.supportingComponents) {
      for (const sc of component.supportingComponents) {
        const alreadyAdded = supportComponents.some(
          s => s.forComponent === component.id && s.type === sc.type && s.value === sc.value
        );
        if (!alreadyAdded) {
          supportComponents.push({
            id: `${sc.type}_for_${component.id}_inline`,
            name: `${sc.value} (${sc.purpose})`,
            category: 'passive',
            type: sc.type,
            value: sc.value,
            purpose: sc.purpose,
            quantity: 1,
            forComponent: component.id,
            connection: sc.connection,
            voltage: component.voltage,
            pins: [],
          });
        }
      }
    }
  }

  return supportComponents;
}

/**
 * Generate a human-readable explanation of the circuit.
 */
function generateExplanation(platform, components, features) {
  const sensors = components.filter(c => c.category === 'sensor');
  const actuators = components.filter(c => c.category === 'actuator');
  const displays = components.filter(c => c.category === 'display');
  const comms = components.filter(c => c.category === 'communication');

  let explanation = `## Circuit Overview\n\n`;
  explanation += `This is a custom hardware circuit built on the **${platform.name}** platform (operating at ${platform.operatingVoltage}V).\n\n`;

  if (sensors.length > 0) {
    explanation += `### Sensors\n`;
    for (const s of sensors) {
      explanation += `- **${s.name}**: ${s.description}. Connected via ${s.protocol.toUpperCase()} protocol.\n`;
    }
    explanation += `\n`;
  }

  if (actuators.length > 0) {
    explanation += `### Actuators\n`;
    for (const a of actuators) {
      explanation += `- **${a.name}**: ${a.description}. Controlled via ${a.protocol.toUpperCase()} signal.\n`;
    }
    explanation += `\n`;
  }

  if (displays.length > 0) {
    explanation += `### Displays\n`;
    for (const d of displays) {
      explanation += `- **${d.name}**: ${d.description}.\n`;
    }
    explanation += `\n`;
  }

  if (comms.length > 0) {
    explanation += `### Communication Modules\n`;
    for (const c of comms) {
      explanation += `- **${c.name}**: ${c.description}.\n`;
    }
    explanation += `\n`;
  }

  explanation += `### How It Works\n`;
  explanation += `The ${platform.name} reads data from ${sensors.length} sensor(s) and controls ${actuators.length} actuator(s). `;

  if (features.includes('iot') && platform.hasWifi) {
    explanation += `WiFi connectivity is enabled for IoT functionality, allowing remote monitoring and control. `;
  }
  if (features.includes('display') && displays.length > 0) {
    explanation += `Sensor readings and status are displayed on the ${displays[0].name}. `;
  }
  if (features.includes('automation')) {
    explanation += `Automation logic processes sensor data and triggers actuators based on predefined thresholds. `;
  }

  explanation += `\n\nAll connections include necessary supporting components (resistors, drivers, etc.) for safe and reliable operation.`;

  return explanation;
}

module.exports = { generateCircuit, componentLibrary };
