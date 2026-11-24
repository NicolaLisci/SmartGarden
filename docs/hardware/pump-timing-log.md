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

## Analysis

Not enough clean data. Need at least three clean on/off pairs. Open questions: on time,
off time, whether it runs only while the lights are on, whether power-up always starts it.
