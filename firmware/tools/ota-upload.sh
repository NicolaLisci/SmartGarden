#!/usr/bin/env bash
# The only supported way to update the SmartGarden NodeMCU over Wi-Fi.
# It refuses any build that could leave the board without ArduinoOTA:
#   1. the sketch's OTA password must match the canonical one (firmware/ota-base/secrets.h);
#   2. the compiled ELF must link ArduinoOTA begin(), setPassword() and handle()
#      (the linker drops functions nobody calls, so a missing symbol means a missing call);
#   3. after the upload the board must answer mDNS again, which only happens while
#      loop() keeps calling ArduinoOTA.handle().
# Usage: firmware/tools/ota-upload.sh <sketch-dir> [hostname]   (default hostname: smartgarden)
set -euo pipefail

SKETCH="${1:?usage: $0 <sketch-dir> [hostname]}"
SKETCH="$(cd "$SKETCH" && pwd)"
HOST="${2:-smartgarden}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FQBN="esp8266:esp8266:nodemcuv2"
CLI="${ARDUINO_CLI:-/Applications/Arduino IDE.app/Contents/Resources/app/lib/backend/resources/arduino-cli}"
NM="$(find "$HOME/Library/Arduino15/packages/esp8266/tools/xtensa-lx106-elf-gcc" -name xtensa-lx106-elf-nm | head -1)"

fail() { echo "BLOCKED: $*" >&2; exit 1; }
ota_password() { sed -n 's/^#define OTA_PASSWORD "\(.*\)"/\1/p' "$1"; }

# Answers only while the sketch runs ArduinoOTA.handle() (it drives MDNS.update()).
# Queries the multicast group directly, so the Mac's mDNS cache cannot fake an answer.
resolve() { dig +short +time=2 +tries=1 -p 5353 @224.0.0.251 "$HOST.local" A 2>/dev/null | grep -E '^[0-9.]+$' | head -1 || true; }

# 1. Password
[[ -f "$SKETCH/secrets.h" ]] || fail "$SKETCH/secrets.h missing (copy firmware/ota-base/secrets.h)"
CANON="$ROOT/firmware/ota-base/secrets.h"
PASS="$(ota_password "$SKETCH/secrets.h")"
[[ -n "$PASS" ]] || fail "OTA_PASSWORD not defined in $SKETCH/secrets.h"
[[ "$PASS" == "$(ota_password "$CANON")" ]] || fail "OTA_PASSWORD differs from $CANON"

# 2. Compile and inspect the binary
OUT="$(mktemp -d)"; trap 'rm -rf "$OUT"' EXIT
"$CLI" compile --fqbn "$FQBN" --output-dir "$OUT" "$SKETCH" >/dev/null
ELF="$(ls "$OUT"/*.elf)"
SYMS="$("$NM" -C "$ELF")"
for f in 'ArduinoOTAClass::begin(' 'ArduinoOTAClass::setPassword(' 'ArduinoOTAClass::handle()'; do
  grep -qF "$f" <<<"$SYMS" || fail "the build never calls $f: it would lose OTA"
done
echo "Build OK: ArduinoOTA begin/setPassword/handle are linked."

# 3. Upload
IP="$(resolve)"; [[ -n "$IP" ]] || fail "$HOST.local does not answer: is the board on and running an OTA sketch?"
echo "Uploading to $HOST ($IP)..."
"$CLI" upload -p "$IP" --protocol network --fqbn "$FQBN" --upload-field "password=$PASS" --input-dir "$OUT" "$SKETCH"

# 4. The new firmware must come back with OTA alive
echo "Waiting for the board to come back..."
sleep 8
for _ in $(seq 1 30); do
  if [[ -n "$(resolve)" ]]; then echo "OK: new firmware is running and OTA answers."; exit 0; fi
  sleep 3
done
fail "upload done but the board does not answer after 100 s: OTA may be lost, check the board"
