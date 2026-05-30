const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { generateCircuit, componentLibrary } = require('../engine/ruleEngine');
const { generateBooleanCircuit } = require('../engine/booleanBuilder');
const { generateAnalogFilterCircuit } = require('../engine/analogFilterBuilder');
const { generateDigitalFilterCircuit } = require('../engine/digitalFilterBuilder');
const { generateElectricCircuit } = require('../engine/electricBuilder');
const { generatePassiveCircuit } = require('../engine/passiveBuilder');
const { generateAnalogCircuit } = require('../engine/analogBuilder');
const { generatePowerCircuit } = require('../engine/powerBuilder');
const { generateProtectionCircuit } = require('../engine/protectionBuilder');
const { generateCommCircuit } = require('../engine/commBuilder');
const { generateTimingCircuit } = require('../engine/timingBuilder');
const { generateNLMCircuit } = require('../engine/nlmEngine');

// Load data for reference endpoints
const componentsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'components.json'), 'utf-8'));
const platformsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'platforms.json'), 'utf-8'));

/**
 * POST /api/generate — Generate a complete circuit.
 */
router.post('/generate', (req, res) => {
  try {
    const config = req.body;
    const domain = config.domain || 'microcontroller';
    
    let result;

    if (domain === 'microcontroller') {
      if (!config.platform) return res.status(400).json({ error: 'Platform is required' });
      if ((!config.sensors || config.sensors.length === 0) && 
          (!config.actuators || config.actuators.length === 0) &&
          (!config.displays || config.displays.length === 0) &&
          (!config.communication || config.communication.length === 0) &&
          (!config.discretes || config.discretes.length === 0) &&
          (!config.power || config.power.length === 0)) {
        return res.status(400).json({ error: 'At least one component must be selected' });
      }
      result = generateCircuit({
        platform: config.platform,
        circuitType: config.circuitType,
        sensors: config.sensors || [],
        actuators: config.actuators || [],
        displays: config.displays || [],
        communication: config.communication || [],
        discretes: config.discretes || [],
        power: config.power || [],
        features: config.features || [],
      });
    } else if (domain === 'boolean_logic') {
      if (!config.equation && !config.logicTopology) return res.status(400).json({ error: 'Equation or Circuit Type is required' });
      result = generateBooleanCircuit(config);
    } else if (domain === 'analog_filter') {
      if (!config.filterType || !config.frequency) return res.status(400).json({ error: 'Filter type and frequency required' });
      result = generateAnalogFilterCircuit(config);
    } else if (domain === 'digital_filter') {
      if (!config.filterType || !config.frequency) return res.status(400).json({ error: 'Filter type and frequency required' });
      result = generateDigitalFilterCircuit(config);
    } else if (domain === 'electric') {
      if (!config.topology) return res.status(400).json({ error: 'Topology is required' });
      result = generateElectricCircuit(config);
    } else if (domain === 'passive') {
      result = generatePassiveCircuit(config);
    } else if (domain === 'analog') {
      result = generateAnalogCircuit(config);
    } else if (domain === 'power') {
      result = generatePowerCircuit(config);
    } else if (domain === 'protection') {
      result = generateProtectionCircuit(config);
    } else if (domain === 'communication') {
      result = generateCommCircuit(config);
    } else if (domain === 'timing') {
      result = generateTimingCircuit(config);
    } else if (domain === 'nlm') {
      if (!config.query) return res.status(400).json({ error: 'Natural language query is required for NLM' });
      result = generateNLMCircuit(config.query, config.constraints || {});
    } else {
      return res.status(400).json({ error: `Unknown domain: ${domain}` });
    }

    res.json(result);
  } catch (error) {
    console.error('Generation error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/validate — Validate a circuit configuration without full generation.
 */
router.post('/validate', (req, res) => {
  try {
    const domain = req.body.domain || 'microcontroller';
    if (domain === 'microcontroller') {
      const result = generateCircuit(req.body);
      res.json({
        valid: result.validation.valid,
        validation: result.validation,
      });
    } else {
      res.json({ valid: true, validation: { valid: true } });
    }
  } catch (error) {
    res.status(400).json({
      valid: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/components — List all available components.
 */
router.get('/components', (req, res) => {
  const { category } = req.query;
  let components = componentsData.components;

  if (category) {
    components = components.filter(c => c.category === category);
  }

  res.json({
    components: components.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      type: c.type,
      description: c.description,
      protocol: c.protocol,
      voltage: c.voltage,
      current: c.current || null,
      partNumber: c.partNumber || null,
      icon: c.icon,
    })),
  });
});

/**
 * GET /api/platforms — List all supported platforms.
 */
router.get('/platforms', (req, res) => {
  const platforms = Object.values(platformsData.platforms).map(p => ({
    id: p.id,
    name: p.name,
    mcu: p.mcu,
    clockSpeed: p.clockSpeed,
    flashMemory: p.flashMemory,
    sram: p.sram,
    operatingVoltage: p.operatingVoltage,
    hasWifi: p.hasWifi,
    hasBluetooth: p.hasBluetooth,
    pinCount: p.pins.length,
    analogPins: p.pins.filter(pin => pin.capabilities.includes('analog')).length,
    pwmPins: p.pins.filter(pin => pin.capabilities.includes('pwm')).length,
    notes: p.notes || null,
  }));

  res.json({ platforms });
});

module.exports = router;
