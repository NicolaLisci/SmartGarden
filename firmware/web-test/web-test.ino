// SmartGarden web test: ota-base plus a test page at http://smartgarden.local/
// Each channel is either "forced on" (OUTPUT HIGH) or "free" (INPUT: the lamp's own MCU
// decides). Our board can only add "on", never force "off".
// The pump switches itself off after PUMP_MAX_MS so it can never run dry for long.
// Activity log: commands with their source, auto-off, boot, Wi-Fi, OTA, NTP sync and
// changes on the lamp's own light lines, kept in LittleFS across reboots (GET /log).
// The lamp's own pump runs cannot be seen: D7 cannot read back.
// The app (app/ in the repository) is served from LittleFS /www at http://smartgarden.local/;
// this test page moves to /test.
#include <ESP8266WiFi.h>
#include <time.h>
#include <LittleFS.h>
#include <ESP8266mDNS.h>
#include <ESP8266WebServer.h>
#include <ArduinoOTA.h>
#include "secrets.h"

const uint8_t PINS[] = { 5, 14, 13 };  // D1 (W), D5 (B), D7 (pump)
const char *const NAMES[] = { "w", "b", "p" };
const uint8_t PIN_LED = 2;
const uint32_t PUMP_MAX_MS = 10000;

ESP8266WebServer server(80);
bool forced[3] = { false, false, false };
uint8_t duty[3] = { 100, 100, 100 };  // % while forced on; < 100 only on the light channels (PWM test)
uint32_t pumpUntil = 0;

// ---------- activity log, persisted in LittleFS ----------
// Each event is a fixed 20-byte record appended to /log/a.bin. When that file passes
// LOG_FILE_MAX it becomes /log/b.bin (the older half) and a new a.bin starts, so the
// log keeps between LOG_FILE_MAX and 2 × LOG_FILE_MAX of history across reboots.
// Times: epoch from NTP when known, else 0; uptime and boot number always, and an
// EV_TIME event at NTP sync lets the app place earlier events of the same boot.
enum Ev : uint8_t { EV_BOOT, EV_WIFI_UP, EV_WIFI_DOWN, EV_SET, EV_AUTO_OFF, EV_RELEASE, EV_OTA, EV_LAMP, EV_TIME };
const char *const EV_NAMES[] = { "boot", "wifi_up", "wifi_down", "set", "auto_off", "release", "ota", "lamp", "time" };
enum Src : uint8_t { SRC_NONE, SRC_APP, SRC_PAGE, SRC_OTHER };
const char *const SRC_NAMES[] = { "", "app", "page", "other" };
struct __attribute__((packed)) Event { uint32_t seq, epoch, up; uint16_t boot; uint8_t ev, src; int8_t ch, val; uint16_t pad; };
static_assert(sizeof(Event) == 20, "record size is part of the file format");
const char *const LOG_A = "/log/a.bin";
const char *const LOG_B = "/log/b.bin";
const size_t LOG_FILE_MAX = 64 * 1024;  // ~3270 events per file
const uint16_t LOG_PAGE = 300;          // events per /log response
uint32_t logSeq = 0;
uint16_t bootNo = 0;
bool fsOk = false;

uint32_t epochNow() { const time_t t = time(nullptr); return t > 1700000000 ? (uint32_t)t : 0; }

Event lastRecord(const char *path) {
  Event e{};
  File f = LittleFS.open(path, "r");
  if (f && f.size() >= sizeof(Event)) { f.seek(f.size() - f.size() % sizeof(Event) - sizeof(Event)); f.read((uint8_t *)&e, sizeof e); }
  return e;
}

void logBegin() {
  fsOk = LittleFS.begin();
  if (!fsOk) return;
  Event last = lastRecord(LOG_A);
  if (!last.seq) last = lastRecord(LOG_B);
  logSeq = last.seq;
  bootNo = last.boot + 1;
}

void logEvent(Ev ev, Src src = SRC_NONE, int8_t ch = -1, int8_t val = -1) {
  const Event e = { ++logSeq, epochNow(), millis(), bootNo, ev, src, ch, val, 0 };
  if (!fsOk) return;
  File f = LittleFS.open(LOG_A, "a");
  if (!f) return;
  f.write((const uint8_t *)&e, sizeof e);
  const size_t size = f.size();
  f.close();
  if (size >= LOG_FILE_MAX) { LittleFS.remove(LOG_B); LittleFS.rename(LOG_A, LOG_B); }
}

Src srcArg() {
  const String s = server.arg("src");
  return s == "app" ? SRC_APP : s == "page" ? SRC_PAGE : SRC_OTHER;
}

// GET /log?since=<seq>: up to LOG_PAGE events with seq > since, oldest first, plus "more"
// when the client should ask again. Streamed record by record to keep the heap small.
void sendLog() {
  const uint32_t since = server.arg("since").toInt();
  server.setContentLength(CONTENT_LENGTH_UNKNOWN);
  server.send(200, "application/json", "");
  char line[160];
  snprintf(line, sizeof line, "{\"now\":%lu,\"up\":%lu,\"boot\":%u,\"last\":%lu,\"events\":[",
           (unsigned long)epochNow(), millis(), bootNo, (unsigned long)logSeq);
  server.sendContent(line);
  uint16_t n = 0;
  uint32_t lastSent = since;
  for (const char *path : { LOG_B, LOG_A }) {
    File f = fsOk ? LittleFS.open(path, "r") : File();
    if (!f) continue;
    Event e;
    while (n < LOG_PAGE && f.read((uint8_t *)&e, sizeof e) == sizeof e) {
      if (e.seq <= since) continue;
      snprintf(line, sizeof line, "%s{\"seq\":%lu,\"t\":%lu,\"up\":%lu,\"boot\":%u,\"e\":\"%s\",\"src\":\"%s\",\"ch\":\"%s\",\"v\":%d}",
               n ? "," : "", (unsigned long)e.seq, (unsigned long)e.epoch, (unsigned long)e.up, e.boot,
               e.ev < 9 ? EV_NAMES[e.ev] : "?", e.src < 4 ? SRC_NAMES[e.src] : "", e.ch >= 0 && e.ch < 3 ? NAMES[e.ch] : "", e.val);
      server.sendContent(line);
      lastSent = e.seq; n++;
    }
  }
  snprintf(line, sizeof line, "],\"more\":%s,\"fs\":%s}", lastSent < logSeq ? "true" : "false", fsOk ? "true" : "false");
  server.sendContent(line);
  server.sendContent("");
}

// The lamp's own command lines, read while a light pin is free. Logged after 1 s stable.
int8_t lampLine[2] = { -1, -1 };
int8_t lampSeen[2] = { -1, -1 };
uint32_t lampSince[2] = { 0, 0 };
void watchLampLines() {
  for (uint8_t i = 0; i < 2; i++) {
    if (forced[i]) { lampSeen[i] = -1; continue; }
    const int8_t v = digitalRead(PINS[i]);
    if (v != lampSeen[i]) { lampSeen[i] = v; lampSince[i] = millis(); continue; }
    if (v != lampLine[i] && millis() - lampSince[i] >= 1000) { lampLine[i] = v; logEvent(EV_LAMP, SRC_NONE, i, v); }
  }
}

// PWM test: analogWrite is push-pull, so during the low phase our pin pulls the lamp's
// command line low through 330 Ω (at most ~15 mA if the lamp drives it high at 5 V).
void drive(uint8_t i, bool on, uint8_t pct = 100) {
  forced[i] = on;
  duty[i] = on ? pct : 100;
  analogWrite(PINS[i], 0);  // stops any running PWM waveform before changing mode
  if (on && pct < 100) analogWrite(PINS[i], (uint16_t)pct * 255 / 100);
  else if (on) { pinMode(PINS[i], OUTPUT); digitalWrite(PINS[i], HIGH); }
  else pinMode(PINS[i], INPUT);
  if (i == 2) pumpUntil = on ? millis() + PUMP_MAX_MS : 0;
}
void releaseAll() { for (uint8_t i = 0; i < 3; i++) drive(i, false); }
void releaseAllLogged(Src src) { releaseAll(); logEvent(EV_RELEASE, src); }

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
const l=j['l'+k];
e.querySelector('small').textContent=on?(k=='p'?'acceso · '+Math.ceil(j.pumpLeft/1000)+' s':'acceso'):(l===undefined?'libero':'libero · lampada: '+(l?'accesa':'spenta'))}
document.getElementById('st').textContent='collegato · IP '+location.host}
function go(u){return fetch(u+(u.includes('?')?'&':'?')+'src=page',{method:'POST'}).then(r=>r.json()).then(show).catch(()=>st.textContent='non raggiungibile')}
function t(k){if(navigator.vibrate)navigator.vibrate(10);go('/set?ch='+k+'&on='+(s[k]?0:1))}
function poll(){fetch('/state').then(r=>r.json()).then(show).catch(()=>st.textContent='non raggiungibile')}
poll();setInterval(poll,1000);
</script></body></html>)HTML";

void sendState() {
  const uint32_t left = forced[2] ? pumpUntil - millis() : 0;
  // While a light pin is free (INPUT) it reads the lamp's own command line through 330 Ω.
  // Meaningful only if the lamp's stage keeps that line above ~2.5 V when on (unverified).
  // The pump pin drives the PC817C LED and cannot read anything back.
  const int lw = forced[0] ? -1 : digitalRead(PINS[0]);
  const int lb = forced[1] ? -1 : digitalRead(PINS[1]);
  char json[128];
  snprintf(json, sizeof json, "{\"w\":%s,\"b\":%s,\"p\":%s,\"pumpLeft\":%lu,\"lw\":%d,\"lb\":%d,\"wd\":%u,\"bd\":%u}",
           forced[0] ? "true" : "false", forced[1] ? "true" : "false", forced[2] ? "true" : "false",
           (unsigned long)left, lw, lb, duty[0], duty[1]);
  server.send(200, "application/json", json);
}

void handleSet() {
  const String ch = server.arg("ch");
  for (uint8_t i = 0; i < 3; i++)
    if (ch == NAMES[i]) {
      const bool on = server.arg("on") == "1";
      // duty=1..99 only for W and B; anything else means full on.
      const long d = server.hasArg("duty") ? server.arg("duty").toInt() : 100;
      const uint8_t pct = (i < 2 && d >= 1 && d <= 99) ? (uint8_t)d : 100;
      drive(i, on, pct);
      logEvent(EV_SET, srcArg(), i, on ? (pct < 100 ? pct : 1) : 0);
      return sendState();
    }
  server.send(400, "text/plain", "unknown channel");
}

void setup() {
  releaseAll();
  logBegin();
  logEvent(EV_BOOT);
  pinMode(PIN_LED, OUTPUT);
  Serial.begin(115200);
  Serial.println();
  Serial.println(F("SmartGarden web test"));
  WiFi.mode(WIFI_STA);
  WiFi.hostname(OTA_HOSTNAME);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  ArduinoOTA.setHostname(OTA_HOSTNAME);
  ArduinoOTA.setPassword(OTA_PASSWORD);
  configTime("CET-1CEST,M3.5.0,M10.5.0/3", "pool.ntp.org");
  ArduinoOTA.onStart([]() { releaseAll(); logEvent(EV_OTA); });
  ArduinoOTA.begin();
  server.on("/test", HTTP_GET, []() { server.send_P(200, "text/html", PAGE); });
  // The app: index at "/", every other file under /www (serveStatic also serves name.gz).
  server.on("/", HTTP_GET, []() {
    File f = fsOk ? LittleFS.open("/www/index.html", "r") : File();
    if (!f) { server.sendHeader("Location", "/test"); server.send(302); return; }
    server.sendHeader("Cache-Control", "no-cache");
    server.streamFile(f, "text/html");
  });
  server.on("/state", HTTP_GET, sendState);
  server.on("/set", HTTP_POST, handleSet);
  server.on("/release", HTTP_POST, []() { releaseAllLogged(srcArg()); sendState(); });
  server.on("/log", HTTP_GET, sendLog);
  // Last: a static handler on "/" would otherwise answer every API route.
  server.serveStatic("/", LittleFS, "/www/", "max-age=3600");
  server.begin();
  MDNS.addService("http", "tcp", 80);  // ArduinoOTA already runs mDNS as smartgarden.local
}

void loop() {
  ArduinoOTA.handle();
  server.handleClient();
  if (forced[2] && (int32_t)(millis() - pumpUntil) >= 0) { drive(2, false); logEvent(EV_AUTO_OFF, SRC_NONE, 2, 0); }
  watchLampLines();
  const bool connected = WiFi.status() == WL_CONNECTED;
  static bool timeLogged = false;
  if (!timeLogged && epochNow()) { timeLogged = true; logEvent(EV_TIME); }  // anchors this boot's uptimes to the clock
  static bool wasConnected = false;
  if (connected != wasConnected) { wasConnected = connected; logEvent(connected ? EV_WIFI_UP : EV_WIFI_DOWN); }
  digitalWrite(PIN_LED, (millis() / (connected ? 500 : 100)) % 2 ? HIGH : LOW);
}
