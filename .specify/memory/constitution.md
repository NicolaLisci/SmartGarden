# SmartGarden Constitution

Version 1.0 — 2026-11-22. Amended only by Nicola; every amendment bumps the version
and says why.

These principles win over any spec, plan or task. A plan must state which ones apply
and how it satisfies them.

## I. Safe by default

Every load output (LEDs, pump) is OFF from power-up, through boot and reset, until the
firmware drives it on purpose. This is guaranteed in hardware (boot-safe GPIOs,
gate pull-downs), not only in software. A crash, reboot or lost connection never
leaves the pump running unsupervised.

## II. Evidence before wiring

Hardware facts are labelled CONFIRMED, HYPOTHESIS or UNKNOWN, with their source. No
load is connected to an output until its voltage, polarity, current and current
limiting are CONFIRMED. No definitive schematic exists before the data behind it.

## III. Local autonomy

The device runs its light and pump schedule on its own: without Home Assistant,
without internet, and through Wi-Fi loss. Losing connectivity never changes the
state of a load. After a power cut, it resumes a defined behaviour without any
button press.

## IV. Reuse before buying

The 2023 board, the original 24 V adapter, the LED panel and the pump are reused
wherever they are fit for purpose. A purchase needs a spec showing it is necessary
and that nothing on hand works.

## V. Human gates

Nicola approves each spec before its plan, and each plan before implementation. He
gives an explicit go-ahead before any soldering, hardware change, flashing, powering
of a load, commit or push. Approval of one step is not approval of the next.

## VI. Test before trust

Every requirement has an acceptance criterion and a test in `docs/TEST_PLAN.md`.
Tests run incrementally: no load before the outputs are proven with a dummy load.
Every firmware fix leaves a test that was seen failing first, where the behaviour is
testable off-device.

## VII. Configuration over code

Prefer declarative configuration (ESPHome YAML, if adopted) to custom code. Custom
code needs a stated reason in the plan.

## VIII. No secrets in the repository

Credentials, API keys and OTA passwords live in git-ignored files. The repository
stays publishable at any time.
