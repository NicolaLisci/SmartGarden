---
name: ota-upload
description: Upload firmware to the SmartGarden NodeMCU over Wi-Fi without ever losing OTA. Use for any firmware update, flash, upload or deploy to the board ("carica", "flasha", "aggiorna il firmware", "OTA"), and before writing any new sketch for the board.
---

# OTA upload for the SmartGarden NodeMCU

The board sits closed inside the lamp head. Losing OTA means opening the lamp, so every
update goes through one script that refuses unsafe builds:

```bash
firmware/tools/ota-upload.sh <sketch-dir> [hostname]
```

Never call `arduino-cli upload --protocol network` or `espota.py` directly, and never
work around a `BLOCKED:` message. Fix the sketch instead.

## What every sketch must contain

Start new sketches from `firmware/ota-base/ota-base.ino` and keep its OTA part:

- `#include "secrets.h"` and a `secrets.h` in the sketch folder, copied from
  `firmware/ota-base/secrets.h` (git-ignored; same OTA password);
- in `setup()`: Wi-Fi connect, `ArduinoOTA.setHostname`, `ArduinoOTA.setPassword`,
  `ArduinoOTA.onStart(releaseAll)`, `ArduinoOTA.begin()`;
- in `loop()`: `ArduinoOTA.handle()` on every pass, with no blocking code. Use `millis()`
  timers; never `while` waits or `delay()` longer than about 50 ms.

## What the script checks

1. The sketch's `OTA_PASSWORD` equals the one in `firmware/ota-base/secrets.h`.
2. The compiled ELF links `ArduinoOTA` `begin`, `setPassword` and `handle`.
3. After the upload, the board answers mDNS again within 100 s (it answers only while
   `loop()` calls `ArduinoOTA.handle()`).

The script cannot prove that `loop()` never blocks at runtime. That is the reason for
rule 3, and the reason to review `loop()` before every upload.
