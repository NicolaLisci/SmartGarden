# Spec 005 — Controller board inside the lamp head (Rev B)

Status: Approved — Nicola, 2026-11-23 ("progettami la scheda da mettere lì in alto")
Owner: Nicola
Depends on: 002 (lamp board and power module measurements)
Supersedes: 004 (three-channel MOSFET board)
Last updated: 2026-11-23

## Why

Spec 002 showed that the lamp head already holds every power stage: one transistor per
LED channel and the pump command line, all driven at logic level. The LED panel has no
resistors, so it cannot be driven straight from 24 V, and the rod carries only three
conductors. The controller therefore goes inside the lamp head and commands the stages
that are already there.

## Scope

In: the controller board (NodeMCU + LM2596 on the trimmed 2023 perfboard), its three
outputs, bench tests, the five connections to the lamp board, mounting in the lamp head.
Out: firmware (spec 003), water-level input (later).

## Requirements

| ID | Requirement | Acceptance criterion |
|---|---|---|
| RQ-005-01 | The board shall power the NodeMCU from the lamp's 24 V. | LM2596 output 4.9–5.2 V set before the NodeMCU is connected; 3V3 pin 3.2–3.4 V. |
| RQ-005-02 | The board shall command the W and B LED channels through the lamp board's own transistors. | With the output on, less than 0.3 V between the LED connector's − pin and GND; LEDs off when the output is low or released. |
| RQ-005-03 | The board shall command the pump through J3 pin C with a drive at least as strong as the original. | Output P at 4.5–5 V when on (bench, 10 kΩ load); pump runs on command. |
| RQ-005-04 | Nothing shall switch on while the ESP8266 powers up, resets or is unprogrammed. | Ten power cycles on the bench and in the lamp: no output rises before the firmware drives it. |
| RQ-005-05 | No boot strap pin shall be used. | Outputs on GPIO5, GPIO14, GPIO13. |
| RQ-005-06 | The lamp's own keys and schedule shall keep working when the controller releases its outputs. | With the three GPIOs as inputs, the lamp behaves as before the modification. |
| RQ-005-07 | The five connection points on the lamp board shall be confirmed by measurement before soldering. | Guide step 17 filled in: J3 +, −, C identified; each LED tap reads 10 kΩ to GND; W/B transistor identified. |
| RQ-005-08 | The board shall fit in the lamp head without touching the LED panel or the touch-key area. | Inner height and free area measured; board (about 74 × 70 × 18 mm, or split in two) fixed and lamp closed. |
| RQ-005-09 | The build shall use parts on hand only and be simple to solder and verify. | Bill of materials all on hand; a multimeter check after each step of the guide. |
| RQ-005-10 | The electronics shall stay within a safe temperature inside the lamp head. | After 30 min with LEDs on, NodeMCU and LM2596 warm at most. |

## Known facts

See spec 002 for the measurements and photos this design relies on.

## Open questions

- Inner height and free area of the lamp head (about 20 mm measured, inside or outside
  not yet stated).
- Which of Q4/Q5 is the W channel.
- Whether 3.3 V through 330 Ω turns the LED transistors fully on (RQ-005-02 decides;
  fallback: a PC817C per LED line switching 5 V).

## Constitution check

I: GPIOs float at boot and the lamp board's 10 kΩ pull-downs keep every stage off.
II: taps are measured before soldering (RQ-005-07); LEDs are never fed above 24 V.
III: belongs to spec 003. IV: no purchase. V: power only at the marked steps.
