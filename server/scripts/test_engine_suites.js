const { generateCircuit } = require('../engine/ruleEngine');
const { generateBooleanCircuit } = require('../engine/booleanBuilder');
const { generateAnalogFilterCircuit } = require('../engine/analogFilterBuilder');
const { generateDigitalFilterCircuit } = require('../engine/digitalFilterBuilder');
const { generateElectricCircuit } = require('../engine/electricBuilder');

function runTests() {
  console.log('--- ENGINE LOGIC STRESS TEST ---');
  let passed = 0;
  let failed = 0;

  const test = (name, fn, input) => {
    try {
      const result = fn(input);
      if (result && result.components && result.code) {
        console.log(`[PASS] ${name}`);
        passed++;
      } else {
        throw new Error('Result missing components or code');
      }
    } catch (e) {
      console.error(`[FAIL] ${name}: ${e.message}`);
      failed++;
    }
  };

  // 1. Microcontroller Tests
  test('Micro: Arduino Uno + DHT11', generateCircuit, {
    platform: 'arduino_uno',
    sensors: ['dht11'],
    actuators: [],
    features: []
  });

  test('Micro: ESP32 + I2C LCD + 5 LEDs', generateCircuit, {
    platform: 'esp32',
    sensors: [],
    actuators: ['led', 'led', 'led', 'led', 'led'],
    displays: ['lcd_i2c'],
    features: []
  });

  test('Micro: Arduino Nano + Max Servos', generateCircuit, {
    platform: 'arduino_nano',
    sensors: [],
    actuators: ['servo', 'servo', 'servo', 'servo', 'servo', 'servo'],
    features: []
  });

  // 2. Boolean Logic Tests
  test('Boolean: Complex expression A & (B | !C) ^ D', generateBooleanCircuit, {
    equation: 'A & (B | !C) ^ D',
    logicMode: 'custom'
  });

  test('Boolean: Logic Topology (MUX 2:1)', generateBooleanCircuit, {
    logicMode: 'predefined',
    logicTopology: 'mux_2_1'
  });

  test('Boolean: Logic Topology (Half Adder)', generateBooleanCircuit, {
    logicMode: 'predefined',
    logicTopology: 'half_adder'
  });

  // 3. Custom / AI Parser Tests (Returns config, not circuit)
  const { parseProjectDescription } = require('../engine/customParser');
  const testParser = (name, input) => {
    try {
      const config = parseProjectDescription(input);
      if (config && config.domain) {
        console.log(`[PASS] ${name} (Matched: ${config.domain})`);
        passed++;
      } else {
        throw new Error('Parser failed to return domain');
      }
    } catch (e) {
      console.error(`[FAIL] ${name}: ${e.message}`);
      failed++;
    }
  };

  testParser('Custom: IoT Weather Station', 'An IoT weather station with DHT11 and OLED display on ESP32');
  testParser('Custom: Boolean ALU', 'A 4-bit ALU with addition and subtraction logic');
  testParser('Custom: Low Pass Filter', 'A low pass RC filter with cutoff at 500Hz');

  // 4. Filter Tests
  test('Analog Filter: Low Pass RC', generateAnalogFilterCircuit, {
    filterType: 'low_pass',
    frequency: '1000'
  });

  test('Digital Filter: High Pass (Biquad)', generateDigitalFilterCircuit, {
    filterType: 'digital_hpf',
    frequency: '500'
  });

  test('Digital Filter: FIR (Tapped)', generateDigitalFilterCircuit, {
    filterType: 'fir',
    frequency: '2000'
  });

  // 5. Electric Tests
  test('Electric: Voltage Divider', generateElectricCircuit, {
    topology: 'voltage_divider',
    Vin: '5',
    R1: '10000',
    R2: '5000'
  });

  test('Electric: Series RLC', generateElectricCircuit, {
    topology: 'series_rlc',
    Vin: '5',
    R: '100',
    L: '0.01',
    C: '0.0001'
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
