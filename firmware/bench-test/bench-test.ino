// SmartGarden bench test (spec 005, guide step "Programma di prova").
//
// Proves the three outputs of the lamp-head controller one at a time:
//   W     = D1 / GPIO5  -> 330 ohm -> W-channel transistor control (lamp board point A)
//   B     = D5 / GPIO14 -> 330 ohm -> B-channel transistor control (lamp board point B)
//   PUMP  = D7 / GPIO13 -> 330 ohm -> PC817C LED; PC817C output drives J3 pin C
//
// "Released" means INPUT (high impedance): the lamp's own MCU and keys stay in charge.
// "On" means OUTPUT HIGH: the output forces its load on for 5 s.
// Nothing is driven during boot and for the first 10 s after it (principle I, RQ-005-04).
// No Wi-Fi: this program only exercises the hardware.
//
// Serial monitor: 115200 baud. The on-board blue LED (GPIO2) blinks once per second
// so the board shows it is running even without a serial monitor.

const uint8_t PIN_W = 5;      // D1
const uint8_t PIN_B = 14;     // D5
const uint8_t PIN_PUMP = 13;  // D7
const uint8_t PIN_LED = 2;    // on-board LED, active low

const uint32_t STARTUP_IDLE_MS = 10000;
const uint32_t ON_MS = 5000;
const uint32_t GAP_MS = 3000;

struct Output {
  uint8_t pin;
  const char *name;
};

const Output OUTPUTS[] = {
  { PIN_W, "W (LED bianchi)" },
  { PIN_B, "B (LED canale B)" },
  { PIN_PUMP, "POMPA" },
};

void releaseAll() {
  for (const Output &o : OUTPUTS) pinMode(o.pin, INPUT);
}

// Waits while blinking the on-board LED; keeps the watchdog fed.
void waitBlinking(uint32_t ms) {
  const uint32_t start = millis();
  while (millis() - start < ms) {
    digitalWrite(PIN_LED, ((millis() - start) / 500) % 2 ? HIGH : LOW);
    delay(20);
  }
  digitalWrite(PIN_LED, HIGH);
}

void setup() {
  releaseAll();                 // first thing: every output high impedance
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, HIGH);
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println(F("SmartGarden bench test"));
  Serial.println(F("Uscite libere per 10 secondi: niente deve accendersi."));
  waitBlinking(STARTUP_IDLE_MS);
}

void loop() {
  for (const Output &o : OUTPUTS) {
    Serial.print(F("ACCESO: "));
    Serial.println(o.name);
    pinMode(o.pin, OUTPUT);
    digitalWrite(o.pin, HIGH);
    waitBlinking(ON_MS);

    pinMode(o.pin, INPUT);
    Serial.print(F("spento: "));
    Serial.println(o.name);
    waitBlinking(GAP_MS);
  }
  Serial.println(F("--- ciclo completo, ricomincio ---"));
}
