// SmartGarden OTA base: the smallest firmware that can be replaced over Wi-Fi.
//
// It drives nothing: W (D1), B (D5) and PUMP (D7) stay INPUT (high impedance) at all
// times, so the lamp's own MCU and keys stay in charge (principle I, RQ-005-04).
// It joins the home Wi-Fi and waits for an over-the-air upload (ArduinoOTA, port 8266).
//
// On-board blue LED (GPIO2, active low):
//   fast blink (5 per second)  = not connected to Wi-Fi
//   slow blink (1 per second)  = connected, ready for an OTA upload
//
// Wi-Fi and OTA credentials live in secrets.h (not in git; see secrets.h.example).
// Serial monitor: 115200 baud, prints the IP address.

#include <ESP8266WiFi.h>
#include <ArduinoOTA.h>
#include "secrets.h"

const uint8_t OUTPUT_PINS[] = { 5, 14, 13 };  // D1 (W), D5 (B), D7 (pump)
const uint8_t PIN_LED = 2;                    // on-board LED, active low

void releaseAll() {
  for (uint8_t pin : OUTPUT_PINS) pinMode(pin, INPUT);
}

void setup() {
  releaseAll();  // first thing: every output high impedance
  pinMode(PIN_LED, OUTPUT);
  Serial.begin(115200);
  Serial.println();
  Serial.println(F("SmartGarden OTA base"));

  WiFi.mode(WIFI_STA);
  WiFi.hostname(OTA_HOSTNAME);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);  // the core reconnects by itself

  ArduinoOTA.setHostname(OTA_HOSTNAME);
  ArduinoOTA.setPassword(OTA_PASSWORD);
  ArduinoOTA.onStart(releaseAll);
  ArduinoOTA.begin();
}

void loop() {
  ArduinoOTA.handle();

  const bool connected = WiFi.status() == WL_CONNECTED;
  digitalWrite(PIN_LED, (millis() / (connected ? 500 : 100)) % 2 ? HIGH : LOW);

  static bool announced = false;
  if (connected && !announced) {
    Serial.print(F("Wi-Fi OK, IP: "));
    Serial.println(WiFi.localIP());
  }
  announced = connected;
}
