# Lamp pump timing log

Goal: find the Duronic lamp's own pump cycle (on time, off time, link to the light cycle),
to use as the default pump schedule in firmware spec 003 (RQ-003-03). The manual does not
state it; the 30/30 min in ARCHITECTURE comes from the 2023 project, not from the lamp.

How to use: every agent session that hears a pump start or stop time from Nicola appends
a row here (Europe/Rome time) and refreshes the analysis below. Mark rows where something
else happened at the same moment (power-up, OTA reboot, button press) as not clean.

| Date | Pump on | Pump off | On for | Clean | Notes |
|---|---|---|---|---|---|
| 2026-11-24 | ? (power-up, evening) | ? | ? | no | Starts right after the lamp is powered; times not noted |
| 2026-11-24 | ~20:57 | ~21:02 | ~5 min | no | NodeMCU OTA reboot around 21:02 (no beep, lamp did not reset) |
| 2026-11-24 | ~21:32 | 21:37 | ~5 min | no | Started by the lamp (our pump output was off, `p:false`). W/B forced on and released from the app at 21:32:12–21:32:19, seconds before; ~30 min after the previous stop |
| 2026-11-24 | ~22:06 | ~22:12 | ~6 min | no | Started by the lamp (`p:false`), ~29 min after the 21:37 stop. W forced on by Nicola from the app shortly before; three NodeMCU reboots while running (OTA 22:08, 22:09, file system 22:10); W PWM test 22:11:35–22:12:06 |

## Analysis

Not enough clean data. Need at least three clean on/off pairs. HYPOTHESIS from the three
evening runs (none clean): ~5–6 min on, ~30 min off (21:02 off → 21:32 on, 21:37 off → 22:06 on),
from Nicola's observations. Next expected start ~22:42. Open questions: on time,
off time, whether it runs only while the lights are on, whether power-up always starts it.
