// SmartGarden web test: ota-base plus a test page at http://smartgarden.local/
// Each channel is either "forced on" (OUTPUT HIGH) or "free" (INPUT: the lamp's own MCU
// decides). Our board can only add "on", never force "off".
// The pump switches itself off after PUMP_MAX_MS so it can never run dry for long.
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoOTA.h>
#include "secrets.h"

const uint8_t PINS[] = { 5, 14, 13 };  // D1 (W), D5 (B), D7 (pump)
const char *const NAMES[] = { "w", "b", "p" };
const uint8_t PIN_LED = 2;
const uint32_t PUMP_MAX_MS = 10000;

ESP8266WebServer server(80);
bool forced[3] = { false, false, false };
uint32_t pumpUntil = 0;

void drive(uint8_t i, bool on) {
  forced[i] = on;
  if (on) { pinMode(PINS[i], OUTPUT); digitalWrite(PINS[i], HIGH); } else pinMode(PINS[i], INPUT);
  if (i == 2) pumpUntil = on ? millis() + PUMP_MAX_MS : 0;
}
void releaseAll() { for (uint8_t i = 0; i < 3; i++) drive(i, false); }

const char PAGE[] PROGMEM = R"HTML(<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>SmartGarden test</title>
<style>
:root{--bg:#0f1411;--fg:#e8efe9;--mut:#93a39a;--on:#d9f99d;--line:#2a332d}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif;padding:20px 16px;max-width:480px;margin:auto}
h1{font-size:20px;margin:0 0 4px}p{color:var(--mut);margin:0 0 20px;font-size:14px}
button{display:flex;justify-content:space-between;align-items:center;width:100%;min-height:64px;margin:0 0 12px;padding:0 18px;border:1px solid var(--line);border-radius:14px;background:#171e19;color:var(--fg);font:600 17px system-ui;cursor:pointer;touch-action:manipulation;transition:background .15s,transform .1s}
button:active{transform:scale(.98)}button:focus-visible{outline:3px solid var(--on);outline-offset:2px}
button.on{background:var(--on);color:#111;border-color:var(--on)}
button small{font-weight:500;font-size:14px}
#rel{justify-content:center;background:none;margin-top:24px}
#st{font-size:13px;color:var(--mut);text-align:center}
</style></head><body>
<h1>SmartGarden · test uscite</h1>
<p>Acceso = forzato dal NodeMCU. Libero = decide la lampada. La pompa si spegne da sola dopo 10 s.</p>
<button id="w" onclick="t('w')">Luce bianca (W)<small>…</small></button>
<button id="b" onclick="t('b')">Luce blu (B)<small>…</small></button>
<button id="p" onclick="t('p')">Pompa<small>…</small></button>
<button id="rel" onclick="go('/release')">Rilascia tutto</button>
<div id="st" aria-live="polite">collegamento…</div>
<script>
let s={};
function show(j){s=j;for(const k of['w','b','p']){const e=document.getElementById(k),on=j[k];e.classList.toggle('on',on);e.setAttribute('aria-pressed',on);
e.querySelector('small').textContent=on?(k=='p'?'acceso · '+Math.ceil(j.pumpLeft/1000)+' s':'acceso'):'libero'}
document.getElementById('st').textContent='collegato · IP '+location.host}
function go(u){return fetch(u,{method:'POST'}).then(r=>r.json()).then(show).catch(()=>st.textContent='non raggiungibile')}
function t(k){if(navigator.vibrate)navigator.vibrate(10);go('/set?ch='+k+'&on='+(s[k]?0:1))}
function poll(){fetch('/state').then(r=>r.json()).then(show).catch(()=>st.textContent='non raggiungibile')}
poll();setInterval(poll,1000);
</script></body></html>)HTML";

void sendState() {
  const uint32_t left = forced[2] ? pumpUntil - millis() : 0;
  char json[64];
  snprintf(json, sizeof json, "{\"w\":%s,\"b\":%s,\"p\":%s,\"pumpLeft\":%lu}",
           forced[0] ? "true" : "false", forced[1] ? "true" : "false", forced[2] ? "true" : "false",
           (unsigned long)left);
  server.send(200, "application/json", json);
}

void handleSet() {
  const String ch = server.arg("ch");
  for (uint8_t i = 0; i < 3; i++)
    if (ch == NAMES[i]) { drive(i, server.arg("on") == "1"); return sendState(); }
  server.send(400, "text/plain", "unknown channel");
}

void setup() {
  releaseAll();
  pinMode(PIN_LED, OUTPUT);
  Serial.begin(115200);
  Serial.println();
  Serial.println(F("SmartGarden web test"));
  WiFi.mode(WIFI_STA);
  WiFi.hostname(OTA_HOSTNAME);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  ArduinoOTA.setHostname(OTA_HOSTNAME);
  ArduinoOTA.setPassword(OTA_PASSWORD);
  ArduinoOTA.onStart(releaseAll);
  ArduinoOTA.begin();
  server.on("/", HTTP_GET, []() { server.send_P(200, "text/html", PAGE); });
  server.on("/state", HTTP_GET, sendState);
  server.on("/set", HTTP_POST, handleSet);
  server.on("/release", HTTP_POST, []() { releaseAll(); sendState(); });
  server.begin();
}

void loop() {
  ArduinoOTA.handle();
  server.handleClient();
  if (forced[2] && (int32_t)(millis() - pumpUntil) >= 0) drive(2, false);
  const bool connected = WiFi.status() == WL_CONNECTED;
  digitalWrite(PIN_LED, (millis() / (connected ? 500 : 100)) % 2 ? HIGH : LOW);
}
