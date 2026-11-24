# Spec 003 — Controller firmware

Status: Draft — Blocked: needs specs 001 and 002, and decisions D-002 and D-003 in `docs/ARCHITECTURE.md`
Owner: Nicola
Depends on: 001, 002
Last updated: 2026-11-22

## Why

The GHS37 stays in standby after a power cut, so a smart plug cannot restart it. The
legacy Arduino firmware blocks without Wi-Fi, adds an hour to every light cycle and
drives the pump from a boot pin (see ARCHITECTURE, legacy review). The controller needs
firmware that runs the schedule on its own and recovers from power cuts.

## Scope

In: light and pump control, scheduling, power-cut recovery, offline behaviour, local
UI, OTA, optional Home Assistant integration.
Out: hardware changes (future spec), enclosure, sensors beyond those in the GHS37.

## Requirements

| ID | Requirement | Acceptance criterion |
|---|---|---|
| RQ-003-01 | The controller shall offer light modes 14/10, 12/12 and 16/8 with the GHS37's intensity differences, plus manual ON and OFF. | Each mode keeps lights on for exactly its duration (±1 min) from the configured start time; 12/12 visibly dimmer and 16/8 brighter than 14/10 (if the panel is dimmable, per spec 002). |
| RQ-003-02 | The light start time shall be configurable. | Changing it from the UI moves the next on/off transition accordingly. Default: [NEEDS CLARIFICATION: default start time]. |
| RQ-003-03 | The controller shall offer pump modes AUTO, ON and OFF. | AUTO follows the configured on/off interval: [NEEDS CLARIFICATION: interval; legacy is 30 min on / 30 min off]. |
| RQ-003-04 | After a power cut, the controller shall resume the last selected modes without any user action. | Power-cycle test (TEST_PLAN T8): lights and pump return to the correct state for the current time within 60 s of Wi-Fi/NTP availability. |
| RQ-003-05 | If the time is unknown after boot, the controller shall apply a defined fallback. | [NEEDS CLARIFICATION: proposed — lights on at boot and cycle counted from boot, like the original unit; pump in AUTO counted from boot]. Verified with Wi-Fi off (TEST_PLAN T9). |
| RQ-003-06 | Losing Wi-Fi, NTP or Home Assistant shall not change any load state nor cause reboots. | 24 h with the access point off: schedule continues, no reboot in logs. |
| RQ-003-07 | Settings (modes, start time, pump interval) shall persist across power cycles. | Values unchanged after a power cycle. |
| RQ-003-08 | All outputs shall be OFF during boot and reset. | Oscilloscope or LED probe on each gate during reset shows no pulse (TEST_PLAN T2–T3). |
| RQ-003-09 | A local web UI shall show and change all states without internet access. | UI works with the router disconnected from the internet; no external resources loaded. |
| RQ-003-10 | Firmware updates shall be possible over the air, password-protected. | OTA update succeeds; an update without the password is refused. |
| RQ-003-11 | Wi-Fi credentials shall be configurable without reflashing. | Fallback access point appears when the configured network is unreachable. |
| RQ-003-12 | If a water-level signal is available (spec 002), low water shall stop the pump and raise an alert. | Simulated low level: pump off within 5 s, alert visible in UI. |
| RQ-003-13 | Home Assistant integration: [NEEDS CLARIFICATION: Nicola has a plan to install Home Assistant (personal notes, 2026-08-30); is it running, and should integration be in scope now?]. | Entities for light mode, pump mode, states and water level appear in HA. |

## Known facts

- CONFIRMED (manual): GHS37 modes and behaviour, see spec 002.
- CONFIRMED (code review): legacy firmware defects, see ARCHITECTURE.
- HYPOTHESIS: the LED panel can be dimmed by PWM through a low-side MOSFET. Depends on RQ-002-03.

## Open questions

All `[NEEDS CLARIFICATION]` above, plus decisions D-002 (firmware stack) and D-003
(H1 vs H2) in ARCHITECTURE.

## Constitution check

I (safe by default), III (local autonomy) and VII (configuration over code) shape this
spec directly. RQ-003-05 is the main design point of principle III.
