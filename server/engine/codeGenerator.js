/**
 * Code Generator — Generates Arduino/ESP code from templates.
 * Uses parameterized code blocks based on selected components and pin assignments.
 */

/**
 * Generate complete Arduino/ESP code.
 *
 * @param {Object} platform - Platform definition
 * @param {Array} components - Selected components
 * @param {Array} pinAssignments - Pin allocations
 * @param {Array} features - Selected features
 * @returns {string} - Complete .ino code
 */
function generateCode(platform, components, pinAssignments, features = []) {
  const sections = {
    includes: new Set(),
    defines: [],
    globals: [],
    setupLines: [],
    loopLines: [],
  };

  // Always include Serial
  sections.setupLines.push('  Serial.begin(115200);');
  sections.setupLines.push('  Serial.println("=== Circuit Generator - System Starting ===");');
  sections.setupLines.push('');

  // Process each component
  for (const component of components) {
    const assignment = pinAssignments.find(a => a.componentId === component.id);
    if (!assignment) continue;

    generateComponentCode(component, assignment, sections, platform);
  }

  // Add WiFi code for IoT feature on ESP platforms
  if (features.includes('iot') && platform.hasWifi) {
    generateWiFiCode(sections, platform);
  }

  // Assemble the full code
  return assembleCode(sections, platform);
}

/**
 * Generate code sections for a specific component.
 */
function generateComponentCode(component, assignment, sections, platform) {
  switch (component.id) {
    case 'dht11':
    case 'dht22':
      return generateDHTCode(component, assignment, sections);
    case 'ldr':
      return generateLDRCode(component, assignment, sections);
    case 'mq2':
      return generateMQ2Code(component, assignment, sections);
    case 'hcsr04':
      return generateHCSR04Code(component, assignment, sections);
    case 'mpu6050':
      return generateMPU6050Code(component, assignment, sections);
    case 'soil_moisture':
      return generateSoilMoistureCode(component, assignment, sections);
    case 'pir':
      return generatePIRCode(component, assignment, sections);
    case 'ir_sensor':
      return generateIRSensorCode(component, assignment, sections);
    case 'flame_sensor':
      return generateFlameSensorCode(component, assignment, sections);
    case 'bmp280':
      return generateBMP280Code(component, assignment, sections);
    case 'led':
      return generateLEDCode(component, assignment, sections);
    case 'rgb_led':
      return generateRGBLEDCode(component, assignment, sections);
    case 'relay':
      return generateRelayCode(component, assignment, sections);
    case 'dc_motor':
      return generateMotorCode(component, assignment, sections);
    case 'servo':
      return generateServoCode(component, assignment, sections);
    case 'buzzer':
      return generateBuzzerCode(component, assignment, sections);
    case 'stepper':
      return generateStepperCode(component, assignment, sections);
    case 'lcd_i2c':
      return generateLCDCode(component, assignment, sections);
    case 'oled_ssd1306':
      return generateOLEDCode(component, assignment, sections);
    case 'seven_segment':
      return generateSevenSegCode(component, assignment, sections);
    case 'hc05':
      return generateBluetoothCode(component, assignment, sections);
    case 'nrf24l01':
      return generateNRF24Code(component, assignment, sections);
    case 'sd_card':
      return generateSDCardCode(component, assignment, sections);
    default:
      return generateGenericCode(component, assignment, sections);
  }
}

// ============================================================
// Component-specific code generators
// ============================================================

function generateDHTCode(component, assignment, sections) {
  const dhtType = component.id === 'dht22' ? 'DHT22' : 'DHT11';
  const dataPin = assignment.pins.DATA;
  if (!dataPin) return;

  sections.includes.add('#include <DHT.h>');
  sections.defines.push(`#define DHT_PIN ${dataPin.pinId.replace('GPIO', '')}  // ${dataPin.pinName}`);
  sections.defines.push(`#define DHT_TYPE ${dhtType}`);
  sections.globals.push(`DHT dht(DHT_PIN, DHT_TYPE);`);
  sections.setupLines.push('  dht.begin();');
  sections.setupLines.push(`  Serial.println("${component.name} initialized");`);
  sections.loopLines.push(`  // --- ${component.name} Reading ---`);
  sections.loopLines.push('  float humidity = dht.readHumidity();');
  sections.loopLines.push('  float temperature = dht.readTemperature();');
  sections.loopLines.push('  if (!isnan(humidity) && !isnan(temperature)) {');
  sections.loopLines.push('    Serial.print("Temperature: "); Serial.print(temperature); Serial.print("°C  ");');
  sections.loopLines.push('    Serial.print("Humidity: "); Serial.print(humidity); Serial.println("%");');
  sections.loopLines.push('  } else {');
  sections.loopLines.push(`    Serial.println("Error reading ${component.name}!");`);
  sections.loopLines.push('  }');
  sections.loopLines.push('');
}

function generateLDRCode(component, assignment, sections) {
  const pin = assignment.pins.PIN1;
  if (!pin) return;

  const pinRef = pin.pinId;
  sections.defines.push(`#define LDR_PIN ${pinRef}  // ${pin.pinName}`);
  sections.setupLines.push(`  pinMode(LDR_PIN, INPUT);`);
  sections.setupLines.push(`  Serial.println("LDR initialized");`);
  sections.loopLines.push('  // --- LDR Light Reading ---');
  sections.loopLines.push('  int lightValue = analogRead(LDR_PIN);');
  sections.loopLines.push('  int lightPercent = map(lightValue, 0, 1023, 0, 100);');
  sections.loopLines.push('  Serial.print("Light Level: "); Serial.print(lightPercent); Serial.println("%");');
  sections.loopLines.push('');
}

function generateMQ2Code(component, assignment, sections) {
  const aPin = assignment.pins.AOUT;
  if (!aPin) return;

  sections.defines.push(`#define MQ2_ANALOG_PIN ${aPin.pinId}  // ${aPin.pinName}`);
  if (assignment.pins.DOUT) {
    sections.defines.push(`#define MQ2_DIGITAL_PIN ${assignment.pins.DOUT.pinId}  // ${assignment.pins.DOUT.pinName}`);
  }
  sections.setupLines.push(`  pinMode(MQ2_ANALOG_PIN, INPUT);`);
  if (assignment.pins.DOUT) {
    sections.setupLines.push(`  pinMode(MQ2_DIGITAL_PIN, INPUT);`);
  }
  sections.setupLines.push(`  Serial.println("MQ-2 Gas Sensor initialized (allow 20s warm-up)");`);
  sections.loopLines.push('  // --- MQ-2 Gas Reading ---');
  sections.loopLines.push('  int gasValue = analogRead(MQ2_ANALOG_PIN);');
  sections.loopLines.push('  Serial.print("Gas Level (raw): "); Serial.println(gasValue);');
  if (assignment.pins.DOUT) {
    sections.loopLines.push('  bool gasAlert = !digitalRead(MQ2_DIGITAL_PIN);');
    sections.loopLines.push('  if (gasAlert) Serial.println("⚠ GAS ALERT!");');
  }
  sections.loopLines.push('');
}

function generateHCSR04Code(component, assignment, sections) {
  const trigPin = assignment.pins.TRIG;
  const echoPin = assignment.pins.ECHO;
  if (!trigPin || !echoPin) return;

  sections.defines.push(`#define TRIG_PIN ${trigPin.pinId.replace('GPIO', '')}  // ${trigPin.pinName}`);
  sections.defines.push(`#define ECHO_PIN ${echoPin.pinId.replace('GPIO', '')}  // ${echoPin.pinName}`);
  sections.setupLines.push('  pinMode(TRIG_PIN, OUTPUT);');
  sections.setupLines.push('  pinMode(ECHO_PIN, INPUT);');
  sections.setupLines.push(`  Serial.println("HC-SR04 Ultrasonic initialized");`);
  sections.loopLines.push('  // --- HC-SR04 Distance Reading ---');
  sections.loopLines.push('  digitalWrite(TRIG_PIN, LOW);');
  sections.loopLines.push('  delayMicroseconds(2);');
  sections.loopLines.push('  digitalWrite(TRIG_PIN, HIGH);');
  sections.loopLines.push('  delayMicroseconds(10);');
  sections.loopLines.push('  digitalWrite(TRIG_PIN, LOW);');
  sections.loopLines.push('  long duration = pulseIn(ECHO_PIN, HIGH);');
  sections.loopLines.push('  float distance = duration * 0.034 / 2;');
  sections.loopLines.push('  Serial.print("Distance: "); Serial.print(distance); Serial.println(" cm");');
  sections.loopLines.push('');
}

function generateMPU6050Code(component, assignment, sections) {
  sections.includes.add('#include <Wire.h>');
  sections.includes.add('#include <MPU6050.h>');
  sections.globals.push('MPU6050 mpu;');
  sections.setupLines.push('  Wire.begin();');
  sections.setupLines.push('  mpu.initialize();');
  sections.setupLines.push('  Serial.println(mpu.testConnection() ? "MPU6050 connected" : "MPU6050 connection failed");');
  sections.loopLines.push('  // --- MPU6050 Motion Reading ---');
  sections.loopLines.push('  int16_t ax, ay, az, gx, gy, gz;');
  sections.loopLines.push('  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);');
  sections.loopLines.push('  Serial.print("Accel: "); Serial.print(ax); Serial.print(", "); Serial.print(ay); Serial.print(", "); Serial.println(az);');
  sections.loopLines.push('  Serial.print("Gyro: "); Serial.print(gx); Serial.print(", "); Serial.print(gy); Serial.print(", "); Serial.println(gz);');
  sections.loopLines.push('');
}

function generateSoilMoistureCode(component, assignment, sections) {
  const pin = assignment.pins.AOUT;
  if (!pin) return;

  sections.defines.push(`#define SOIL_PIN ${pin.pinId}  // ${pin.pinName}`);
  sections.setupLines.push(`  pinMode(SOIL_PIN, INPUT);`);
  sections.setupLines.push(`  Serial.println("Soil moisture sensor initialized");`);
  sections.loopLines.push('  // --- Soil Moisture Reading ---');
  sections.loopLines.push('  int soilValue = analogRead(SOIL_PIN);');
  sections.loopLines.push('  int moisturePercent = map(soilValue, 1023, 0, 0, 100);');
  sections.loopLines.push('  Serial.print("Soil Moisture: "); Serial.print(moisturePercent); Serial.println("%");');
  sections.loopLines.push('');
}

function generatePIRCode(component, assignment, sections) {
  const pin = assignment.pins.OUT;
  if (!pin) return;

  sections.defines.push(`#define PIR_PIN ${pin.pinId.replace('GPIO', '')}  // ${pin.pinName}`);
  sections.setupLines.push('  pinMode(PIR_PIN, INPUT);');
  sections.setupLines.push(`  Serial.println("PIR Motion Sensor initialized (allow 30s calibration)");`);
  sections.loopLines.push('  // --- PIR Motion Detection ---');
  sections.loopLines.push('  if (digitalRead(PIR_PIN) == HIGH) {');
  sections.loopLines.push('    Serial.println("🚨 Motion Detected!");');
  sections.loopLines.push('  }');
  sections.loopLines.push('');
}

function generateIRSensorCode(component, assignment, sections) {
  const pin = assignment.pins.OUT;
  if (!pin) return;

  sections.defines.push(`#define IR_PIN ${pin.pinId.replace('GPIO', '')}  // ${pin.pinName}`);
  sections.setupLines.push('  pinMode(IR_PIN, INPUT);');
  sections.setupLines.push(`  Serial.println("IR Obstacle Sensor initialized");`);
  sections.loopLines.push('  // --- IR Obstacle Detection ---');
  sections.loopLines.push('  if (digitalRead(IR_PIN) == LOW) {');
  sections.loopLines.push('    Serial.println("Obstacle Detected!");');
  sections.loopLines.push('  }');
  sections.loopLines.push('');
}

function generateFlameSensorCode(component, assignment, sections) {
  const pin = assignment.pins.AOUT || assignment.pins.DOUT;
  if (!pin) return;

  const isAnalog = assignment.pins.AOUT !== undefined;
  const pinRef = pin.pinId;
  sections.defines.push(`#define FLAME_PIN ${pinRef}  // ${pin.pinName}`);
  sections.setupLines.push(`  pinMode(FLAME_PIN, INPUT);`);
  sections.setupLines.push(`  Serial.println("Flame Sensor initialized");`);
  sections.loopLines.push('  // --- Flame Detection ---');
  if (isAnalog) {
    sections.loopLines.push('  int flameValue = analogRead(FLAME_PIN);');
    sections.loopLines.push('  if (flameValue < 500) {');
    sections.loopLines.push('    Serial.println("🔥 FIRE DETECTED!");');
    sections.loopLines.push('  }');
  } else {
    sections.loopLines.push('  if (digitalRead(FLAME_PIN) == LOW) {');
    sections.loopLines.push('    Serial.println("🔥 FIRE DETECTED!");');
    sections.loopLines.push('  }');
  }
  sections.loopLines.push('');
}

function generateBMP280Code(component, assignment, sections) {
  sections.includes.add('#include <Wire.h>');
  sections.includes.add('#include <Adafruit_BMP280.h>');
  sections.globals.push('Adafruit_BMP280 bmp;');
  sections.setupLines.push('  if (!bmp.begin(0x76)) {');
  sections.setupLines.push('    Serial.println("BMP280 not found!");');
  sections.setupLines.push('    while (1);');
  sections.setupLines.push('  }');
  sections.setupLines.push('  Serial.println("BMP280 initialized");');
  sections.loopLines.push('  // --- BMP280 Pressure/Temperature ---');
  sections.loopLines.push('  Serial.print("Temp: "); Serial.print(bmp.readTemperature()); Serial.print("°C  ");');
  sections.loopLines.push('  Serial.print("Pressure: "); Serial.print(bmp.readPressure() / 100.0); Serial.println(" hPa");');
  sections.loopLines.push('');
}

function generateLEDCode(component, assignment, sections) {
  const pin = assignment.pins.ANODE;
  if (!pin) return;

  sections.defines.push(`#define LED_PIN ${pin.pinId.replace('GPIO', '')}  // ${pin.pinName}`);
  sections.setupLines.push('  pinMode(LED_PIN, OUTPUT);');
  sections.setupLines.push(`  Serial.println("LED initialized");`);
  sections.loopLines.push('  // --- LED Control ---');
  sections.loopLines.push('  digitalWrite(LED_PIN, HIGH);  // LED ON');
  sections.loopLines.push('');
}

function generateRGBLEDCode(component, assignment, sections) {
  const rPin = assignment.pins.RED;
  const gPin = assignment.pins.GREEN;
  const bPin = assignment.pins.BLUE;

  if (rPin) sections.defines.push(`#define RGB_RED_PIN ${rPin.pinId.replace('GPIO', '')}  // ${rPin.pinName}`);
  if (gPin) sections.defines.push(`#define RGB_GREEN_PIN ${gPin.pinId.replace('GPIO', '')}  // ${gPin.pinName}`);
  if (bPin) sections.defines.push(`#define RGB_BLUE_PIN ${bPin.pinId.replace('GPIO', '')}  // ${bPin.pinName}`);

  sections.globals.push('void setRGBColor(int r, int g, int b) {');
  sections.globals.push('  analogWrite(RGB_RED_PIN, r);');
  sections.globals.push('  analogWrite(RGB_GREEN_PIN, g);');
  sections.globals.push('  analogWrite(RGB_BLUE_PIN, b);');
  sections.globals.push('}');

  sections.setupLines.push('  pinMode(RGB_RED_PIN, OUTPUT);');
  sections.setupLines.push('  pinMode(RGB_GREEN_PIN, OUTPUT);');
  sections.setupLines.push('  pinMode(RGB_BLUE_PIN, OUTPUT);');
  sections.setupLines.push(`  Serial.println("RGB LED initialized");`);
  sections.loopLines.push('  // --- RGB LED Demo ---');
  sections.loopLines.push('  setRGBColor(255, 0, 0);   // Red');
  sections.loopLines.push('');
}

function generateRelayCode(component, assignment, sections) {
  const pin = assignment.pins.IN;
  if (!pin) return;

  sections.defines.push(`#define RELAY_PIN ${pin.pinId.replace('GPIO', '')}  // ${pin.pinName}`);
  sections.globals.push('bool relayState = false;');
  sections.setupLines.push('  pinMode(RELAY_PIN, OUTPUT);');
  sections.setupLines.push('  digitalWrite(RELAY_PIN, LOW);  // Relay OFF initially');
  sections.setupLines.push(`  Serial.println("Relay initialized (OFF)");`);
  sections.loopLines.push('  // --- Relay Control ---');
  sections.loopLines.push('  // Toggle relay based on sensor conditions');
  sections.loopLines.push('  // digitalWrite(RELAY_PIN, HIGH);  // Activate relay');
  sections.loopLines.push('');
}

function generateMotorCode(component, assignment, sections) {
  // Motor uses L293D driver — simplified pin control
  sections.defines.push('// DC Motor via L293D H-Bridge Driver');
  sections.defines.push('// Connect L293D ENA to PWM pin, IN1/IN2 to digital pins');
  sections.loopLines.push('  // --- DC Motor Control ---');
  sections.loopLines.push('  // Use L293D motor driver for direction and speed control');
  sections.loopLines.push('  // analogWrite(MOTOR_ENA_PIN, 200);  // Speed (0-255)');
  sections.loopLines.push('');
}

function generateServoCode(component, assignment, sections) {
  const pin = assignment.pins.SIGNAL;
  if (!pin) return;

  sections.includes.add('#include <Servo.h>');
  sections.defines.push(`#define SERVO_PIN ${pin.pinId.replace('GPIO', '')}  // ${pin.pinName}`);
  sections.globals.push('Servo myServo;');
  sections.setupLines.push('  myServo.attach(SERVO_PIN);');
  sections.setupLines.push('  myServo.write(90);  // Center position');
  sections.setupLines.push(`  Serial.println("Servo initialized at 90°");`);
  sections.loopLines.push('  // --- Servo Control ---');
  sections.loopLines.push('  myServo.write(0);    // Move to 0°');
  sections.loopLines.push('  delay(500);');
  sections.loopLines.push('  myServo.write(90);   // Move to 90°');
  sections.loopLines.push('  delay(500);');
  sections.loopLines.push('  myServo.write(180);  // Move to 180°');
  sections.loopLines.push('  delay(500);');
  sections.loopLines.push('');
}

function generateBuzzerCode(component, assignment, sections) {
  const pin = assignment.pins.POSITIVE;
  if (!pin) return;

  sections.defines.push(`#define BUZZER_PIN ${pin.pinId.replace('GPIO', '')}  // ${pin.pinName}`);
  sections.setupLines.push('  pinMode(BUZZER_PIN, OUTPUT);');
  sections.setupLines.push(`  Serial.println("Buzzer initialized");`);
  sections.loopLines.push('  // --- Buzzer Alert ---');
  sections.loopLines.push('  // tone(BUZZER_PIN, 1000, 200);  // 1kHz tone for 200ms');
  sections.loopLines.push('');
}

function generateStepperCode(component, assignment, sections) {
  sections.includes.add('#include <Stepper.h>');
  const pins = ['IN1', 'IN2', 'IN3', 'IN4'];
  const pinIds = [];

  for (const pName of pins) {
    const p = assignment.pins[pName];
    if (p) {
      sections.defines.push(`#define STEPPER_${pName} ${p.pinId.replace('GPIO', '')}  // ${p.pinName}`);
      pinIds.push(`STEPPER_${pName}`);
    }
  }

  if (pinIds.length === 4) {
    sections.defines.push('#define STEPS_PER_REV 2048');
    sections.globals.push(`Stepper stepper(STEPS_PER_REV, ${pinIds.join(', ')});`);
    sections.setupLines.push('  stepper.setSpeed(10);  // 10 RPM');
    sections.setupLines.push(`  Serial.println("Stepper motor initialized");`);
    sections.loopLines.push('  // --- Stepper Motor Control ---');
    sections.loopLines.push('  stepper.step(512);   // Quarter turn CW');
    sections.loopLines.push('  delay(500);');
    sections.loopLines.push('  stepper.step(-512);  // Quarter turn CCW');
    sections.loopLines.push('  delay(500);');
    sections.loopLines.push('');
  }
}

function generateLCDCode(component, assignment, sections) {
  sections.includes.add('#include <Wire.h>');
  sections.includes.add('#include <LiquidCrystal_I2C.h>');
  sections.globals.push('LiquidCrystal_I2C lcd(0x27, 16, 2);');
  sections.setupLines.push('  lcd.init();');
  sections.setupLines.push('  lcd.backlight();');
  sections.setupLines.push('  lcd.setCursor(0, 0);');
  sections.setupLines.push('  lcd.print("Circuit Ready!");');
  sections.setupLines.push(`  Serial.println("LCD 16x2 initialized");`);
  sections.loopLines.push('  // --- LCD Display Update ---');
  sections.loopLines.push('  lcd.setCursor(0, 0);');
  sections.loopLines.push('  lcd.print("Sensor Data:    ");');
  sections.loopLines.push('');
}

function generateOLEDCode(component, assignment, sections) {
  sections.includes.add('#include <Wire.h>');
  sections.includes.add('#include <Adafruit_GFX.h>');
  sections.includes.add('#include <Adafruit_SSD1306.h>');
  sections.defines.push('#define SCREEN_WIDTH 128');
  sections.defines.push('#define SCREEN_HEIGHT 64');
  sections.defines.push('#define OLED_RESET -1');
  sections.globals.push('Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);');
  sections.setupLines.push('  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {');
  sections.setupLines.push('    Serial.println("SSD1306 OLED failed!");');
  sections.setupLines.push('    while (1);');
  sections.setupLines.push('  }');
  sections.setupLines.push('  display.clearDisplay();');
  sections.setupLines.push('  display.setTextSize(1);');
  sections.setupLines.push('  display.setTextColor(SSD1306_WHITE);');
  sections.setupLines.push('  display.setCursor(0, 0);');
  sections.setupLines.push('  display.println("System Ready");');
  sections.setupLines.push('  display.display();');
  sections.setupLines.push('  Serial.println("OLED display initialized");');
  sections.loopLines.push('  // --- OLED Display Update ---');
  sections.loopLines.push('  display.clearDisplay();');
  sections.loopLines.push('  display.setCursor(0, 0);');
  sections.loopLines.push('  display.println("Sensor Readings:");');
  sections.loopLines.push('  display.display();');
  sections.loopLines.push('');
}

function generateSevenSegCode(component, assignment, sections) {
  const segmentPins = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  sections.defines.push('// 7-Segment Display Pin Definitions');

  for (const seg of segmentPins) {
    const p = assignment.pins[seg];
    if (p) {
      sections.defines.push(`#define SEG_${seg} ${p.pinId.replace('GPIO', '')}  // ${p.pinName}`);
      sections.setupLines.push(`  pinMode(SEG_${seg}, OUTPUT);`);
    }
  }

  sections.globals.push('// 7-segment digit patterns (0-9)');
  sections.globals.push('const byte digits[10][7] = {');
  sections.globals.push('  {1,1,1,1,1,1,0}, // 0');
  sections.globals.push('  {0,1,1,0,0,0,0}, // 1');
  sections.globals.push('  {1,1,0,1,1,0,1}, // 2');
  sections.globals.push('  {1,1,1,1,0,0,1}, // 3');
  sections.globals.push('  {0,1,1,0,0,1,1}, // 4');
  sections.globals.push('  {1,0,1,1,0,1,1}, // 5');
  sections.globals.push('  {1,0,1,1,1,1,1}, // 6');
  sections.globals.push('  {1,1,1,0,0,0,0}, // 7');
  sections.globals.push('  {1,1,1,1,1,1,1}, // 8');
  sections.globals.push('  {1,1,1,1,0,1,1}, // 9');
  sections.globals.push('};');

  sections.setupLines.push(`  Serial.println("7-Segment display initialized");`);
  sections.loopLines.push('  // --- 7-Segment Display ---');
  sections.loopLines.push('  // displayDigit(0-9) to show a number');
  sections.loopLines.push('');
}

function generateBluetoothCode(component, assignment, sections) {
  sections.includes.add('#include <SoftwareSerial.h>');
  const rxPin = assignment.pins.RXD;
  const txPin = assignment.pins.TXD;
  if (!rxPin || !txPin) return;

  sections.defines.push(`#define BT_RX ${rxPin.pinId.replace('GPIO', '')}  // ${rxPin.pinName}`);
  sections.defines.push(`#define BT_TX ${txPin.pinId.replace('GPIO', '')}  // ${txPin.pinName}`);
  sections.globals.push('SoftwareSerial btSerial(BT_RX, BT_TX);');
  sections.setupLines.push('  btSerial.begin(9600);');
  sections.setupLines.push('  Serial.println("Bluetooth HC-05 initialized");');
  sections.loopLines.push('  // --- Bluetooth Communication ---');
  sections.loopLines.push('  if (btSerial.available()) {');
  sections.loopLines.push('    String btData = btSerial.readStringUntil(\'\\n\');');
  sections.loopLines.push('    Serial.print("BT Received: "); Serial.println(btData);');
  sections.loopLines.push('  }');
  sections.loopLines.push('');
}

function generateNRF24Code(component, assignment, sections) {
  sections.includes.add('#include <SPI.h>');
  sections.includes.add('#include <RF24.h>');
  const cePin = assignment.pins.CE;
  const csnPin = assignment.pins.CSN;
  if (!cePin || !csnPin) return;

  sections.defines.push(`#define NRF_CE ${cePin.pinId.replace('GPIO', '')}  // ${cePin.pinName}`);
  sections.defines.push(`#define NRF_CSN ${csnPin.pinId.replace('GPIO', '')}  // ${csnPin.pinName}`);
  sections.globals.push('RF24 radio(NRF_CE, NRF_CSN);');
  sections.setupLines.push('  if (!radio.begin()) {');
  sections.setupLines.push('    Serial.println("NRF24L01 failed!");');
  sections.setupLines.push('  } else {');
  sections.setupLines.push('    Serial.println("NRF24L01 initialized");');
  sections.setupLines.push('  }');
  sections.loopLines.push('  // --- NRF24L01 Radio ---');
  sections.loopLines.push('  // radio.write(&data, sizeof(data));');
  sections.loopLines.push('');
}

function generateSDCardCode(component, assignment, sections) {
  sections.includes.add('#include <SPI.h>');
  sections.includes.add('#include <SD.h>');
  const csPin = assignment.pins.CS;
  if (!csPin) return;

  sections.defines.push(`#define SD_CS ${csPin.pinId.replace('GPIO', '')}  // ${csPin.pinName}`);
  sections.setupLines.push('  if (!SD.begin(SD_CS)) {');
  sections.setupLines.push('    Serial.println("SD card init failed!");');
  sections.setupLines.push('  } else {');
  sections.setupLines.push('    Serial.println("SD card initialized");');
  sections.setupLines.push('  }');
  sections.loopLines.push('  // --- SD Card Logging ---');
  sections.loopLines.push('  // File f = SD.open("log.txt", FILE_WRITE);');
  sections.loopLines.push('  // f.println(sensorData); f.close();');
  sections.loopLines.push('');
}

function generateGenericCode(component, assignment, sections) {
  sections.loopLines.push(`  // --- ${component.name} ---`);
  sections.loopLines.push(`  // TODO: Add custom code for ${component.name}`);
  sections.loopLines.push('');
}

/**
 * Generate WiFi code for ESP platforms.
 */
function generateWiFiCode(sections, platform) {
  if (platform.id === 'esp32') {
    sections.includes.add('#include <WiFi.h>');
  } else if (platform.id === 'esp8266') {
    sections.includes.add('#include <ESP8266WiFi.h>');
  }

  sections.defines.push('');
  sections.defines.push('// WiFi Configuration');
  sections.defines.push('const char* WIFI_SSID = "YOUR_WIFI_SSID";');
  sections.defines.push('const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";');

  sections.setupLines.push('');
  sections.setupLines.push('  // --- WiFi Setup ---');
  sections.setupLines.push('  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);');
  sections.setupLines.push('  Serial.print("Connecting to WiFi");');
  sections.setupLines.push('  int wifiTimeout = 0;');
  sections.setupLines.push('  while (WiFi.status() != WL_CONNECTED && wifiTimeout < 20) {');
  sections.setupLines.push('    delay(500);');
  sections.setupLines.push('    Serial.print(".");');
  sections.setupLines.push('    wifiTimeout++;');
  sections.setupLines.push('  }');
  sections.setupLines.push('  if (WiFi.status() == WL_CONNECTED) {');
  sections.setupLines.push('    Serial.println("\\nWiFi Connected!");');
  sections.setupLines.push('    Serial.print("IP: "); Serial.println(WiFi.localIP());');
  sections.setupLines.push('  } else {');
  sections.setupLines.push('    Serial.println("\\nWiFi Failed - continuing offline");');
  sections.setupLines.push('  }');
}

/**
 * Assemble all code sections into a complete .ino file.
 */
function assembleCode(sections, platform) {
  let code = '';

  // Header comment
  code += '/*\n';
  code += ' * Auto-Generated Circuit Code\n';
  code += ` * Platform: ${platform.name}\n`;
  code += ` * Generated by circuitry - Rule-Based Circuit Generator\n`;
  code += ` * Date: ${new Date().toISOString().split('T')[0]}\n`;
  code += ' */\n\n';

  // Includes
  if (sections.includes.size > 0) {
    const sortedIncludes = [...sections.includes].sort();
    code += sortedIncludes.join('\n') + '\n\n';
  }

  // Defines
  if (sections.defines.length > 0) {
    code += '// === Pin Definitions & Constants ===\n';
    code += sections.defines.join('\n') + '\n\n';
  }

  // Globals
  if (sections.globals.length > 0) {
    code += '// === Global Variables & Objects ===\n';
    code += sections.globals.join('\n') + '\n\n';
  }

  // Setup
  code += 'void setup() {\n';
  code += sections.setupLines.join('\n') + '\n';
  code += '  Serial.println("\\n=== All Systems Initialized ===\\n");\n';
  code += '}\n\n';

  // Loop
  code += 'void loop() {\n';
  code += sections.loopLines.join('\n') + '\n';
  code += '  delay(1000);  // Main loop delay\n';
  code += '}\n';

  return code;
}

module.exports = { generateCode };
