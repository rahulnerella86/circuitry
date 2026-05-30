/**
 * Circuit Builder — Builds the connection graph and generates the JSON netlist.
 */

/**
 * Build the complete circuit representation.
 *
 * @param {Object} platform - Platform definition
 * @param {Array} components - User-selected components
 * @param {Array} supportComponents - Auto-added supporting components
 * @param {Array} pinAssignments - Pin allocation results
 * @returns {{ connections: Array, netlist: Object }}
 */
function buildCircuit(platform, components, supportComponents, pinAssignments) {
  const connections = [];
  const nodes = [];
  let nodeId = 1;
  let connectionId = 1;

  // Create MCU node
  const mcuNode = {
    id: `node_mcu`,
    type: 'mcu',
    name: platform.name,
    x: 400,
    y: 300,
  };
  nodes.push(mcuNode);

  // Create power rail nodes
  const vccNode = { id: `node_vcc`, type: 'power', name: `${platform.operatingVoltage}V`, voltage: platform.operatingVoltage };
  const gndNode = { id: `node_gnd`, type: 'ground', name: 'GND', voltage: 0 };
  nodes.push(vccNode, gndNode);

  // Create component nodes and connections
  for (const assignment of pinAssignments) {
    // Support instance IDs (e.g. 'dht11_2') — strip suffix to find base component
    const baseId = assignment.componentId.replace(/_\d+$/, '');
    const component = components.find(c => c.id === assignment.componentId) || components.find(c => c.id === baseId);
    if (!component) continue;

    const compNode = {
      id: `node_${assignment.componentId}`,
      type: 'component',
      name: assignment.componentName || component.name,
      category: component.category,
      componentId: assignment.componentId,
    };
    nodes.push(compNode);

    // Power connections
    const powerPins = component.pins.filter(p => p.type === 'power');
    const groundPins = component.pins.filter(p => p.type === 'ground');

    if (powerPins.length > 0) {
      // Determine correct power rail
      const powerRail = component.voltage.typical <= 3.3 ? '3.3V' : `${platform.operatingVoltage}V`;
      connections.push({
        id: `conn_${connectionId++}`,
        from: { node: vccNode.id, pin: powerRail },
        to: { node: compNode.id, pin: powerPins[0].name },
        type: 'power',
        color: '#ef4444',
        label: powerRail,
      });
    }

    if (groundPins.length > 0) {
      connections.push({
        id: `conn_${connectionId++}`,
        from: { node: compNode.id, pin: groundPins[0].name },
        to: { node: gndNode.id, pin: 'GND' },
        type: 'ground',
        color: '#1f2937',
        label: 'GND',
      });
    }

    // Signal connections (component pin → MCU pin)
    for (const [pinName, pinInfo] of Object.entries(assignment.pins)) {
      if (!pinInfo || !pinInfo.pinId) continue;

      const signalColor = getSignalColor(component.protocol, component.category);

      connections.push({
        id: `conn_${connectionId++}`,
        from: { node: compNode.id, pin: pinName },
        to: { node: mcuNode.id, pin: pinInfo.pinId },
        type: 'signal',
        protocol: component.protocol,
        color: signalColor,
        label: `${pinName} → ${pinInfo.pinName}`,
        shared: pinInfo.shared || false,
      });
    }
  }

  // Add support component connections
  for (const sc of supportComponents) {
    const scNode = {
      id: `node_${sc.id}`,
      type: 'support',
      name: sc.name,
      value: sc.value,
      forComponent: sc.forComponent,
    };
    nodes.push(scNode);

    // Connect support component inline with its parent
    if (sc.connection) {
      connections.push({
        id: `conn_${connectionId++}`,
        from: { node: scNode.id, pin: 'inline' },
        to: { node: `node_${sc.forComponent}`, pin: 'inline' },
        type: 'support',
        color: '#9ca3af',
        label: sc.connection,
      });
    }
  }

  // Build netlist
  const netlist = buildNetlist(nodes, connections, platform);

  return { connections, netlist, nodes };
}

/**
 * Build JSON netlist format.
 */
function buildNetlist(nodes, connections, platform) {
  const nets = {};
  let netIndex = 1;

  // Group connections by shared nets
  for (const conn of connections) {
    const netName = conn.type === 'power' ? 'VCC'
      : conn.type === 'ground' ? 'GND'
      : `NET_${netIndex++}`;

    if (conn.type === 'power' && nets['VCC']) {
      nets['VCC'].connections.push({
        component: conn.to.node.replace('node_', ''),
        pin: conn.to.pin,
      });
    } else if (conn.type === 'ground' && nets['GND']) {
      nets['GND'].connections.push({
        component: conn.from.node.replace('node_', ''),
        pin: conn.from.pin,
      });
    } else {
      nets[netName] = {
        name: netName,
        type: conn.type,
        protocol: conn.protocol || null,
        connections: [
          {
            component: conn.from.node.replace('node_', ''),
            pin: conn.from.pin,
          },
          {
            component: conn.to.node.replace('node_', ''),
            pin: conn.to.pin,
          },
        ],
      };
    }
  }

  return {
    version: '1.0',
    platform: platform.id,
    generatedAt: new Date().toISOString(),
    nets,
    statistics: {
      totalNets: Object.keys(nets).length,
      totalConnections: connections.length,
      totalNodes: nodes.length,
    },
  };
}

/**
 * Get wire color based on protocol/category.
 */
function getSignalColor(protocol, category) {
  const colorMap = {
    i2c: '#8b5cf6',     // purple
    spi: '#f59e0b',     // amber
    uart: '#10b981',    // emerald
    analog: '#3b82f6',  // blue
    pwm: '#ec4899',     // pink
    oneWire: '#06b6d4', // cyan
    digital: '#6366f1', // indigo
  };
  return colorMap[protocol] || '#6b7280';
}

module.exports = { buildCircuit };
