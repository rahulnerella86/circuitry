const fs = require('fs');
const path = require('path');

const COMPONENTS_PATH = path.join(__dirname, '../data/components.json');
const PLATFORMS_PATH = path.join(__dirname, '../data/platforms.json');

function validate() {
  console.log('--- SYSTEM DATA VALIDATION ---');
  let errors = 0;

  // 1. Validate Components
  const componentsData = JSON.parse(fs.readFileSync(COMPONENTS_PATH, 'utf8'));
  const components = componentsData.components;
  console.log(`Auditing ${components.length} components...`);

  const componentIds = new Set();
  components.forEach(c => {
    const context = `Component [${c.id}]`;

    // Duplicate IDs
    if (componentIds.has(c.id)) {
      console.error(`ERROR: ${context} has a duplicate ID.`);
      errors++;
    }
    componentIds.add(c.id);

    // Required fields
    const required = ['name', 'category', 'type', 'pins'];
    if (c.category !== 'discrete') required.push('voltage');

    required.forEach(field => {
      if (!c[field]) {
        console.error(`ERROR: ${context} is missing required field "${field}".`);
        errors++;
      }
    });

    // Pin validation
    if (c.pins) {
      c.pins.forEach((p, idx) => {
        if (!p.name || !p.type) {
          console.error(`ERROR: ${context} pin index ${idx} is missing name or type.`);
          errors++;
        }
        if (p.type === 'signal' && !p.protocol) {
          console.error(`ERROR: ${context} signal pin "${p.name}" is missing a protocol.`);
          errors++;
        }
      });
    }

    // Voltage validation
    if (c.voltage && (c.voltage.min === undefined || c.voltage.max === undefined)) {
      console.error(`ERROR: ${context} voltage range is incomplete.`);
      errors++;
    }
  });

  // 2. Validate Platforms
  const platformsData = JSON.parse(fs.readFileSync(PLATFORMS_PATH, 'utf8'));
  const platformsMap = platformsData.platforms;
  const platformIds = Object.keys(platformsMap);
  console.log(`Auditing ${platformIds.length} platforms...`);

  platformIds.forEach(id => {
    const p = platformsMap[id];
    const context = `Platform [${p.id}]`;
    if (!p.pins || !p.operatingVoltage) {
      console.error(`ERROR: ${context} is missing pin definitions or operating voltage.`);
      errors++;
    }
    // Check pin definitions
    const pinNames = new Set();
    p.pins.forEach(pin => {
      if (pinNames.has(pin.id)) {
        console.error(`ERROR: ${context} has duplicate pin ID "${pin.id}".`);
        errors++;
      }
      pinNames.add(pin.id);
    });
  });

  if (errors === 0) {
    console.log('SUCCESS: All data integrity checks passed.');
  } else {
    console.error(`FAILURE: Found ${errors} error(s) in system data.`);
    process.exit(1);
  }
}

validate();
