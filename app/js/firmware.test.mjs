// The app and the firmware must agree on the light cycles: the app sends cycle names to
// POST /schedule and shows each cycle's light; the board runs them (schedule.h).
// node app/js/firmware.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CYCLES, SCENES, photoperiod, loadSettings } from './schedule.js';

const header = readFileSync(new URL('../../firmware/web-test/schedule.h', import.meta.url), 'utf8');
const fw = [...header.matchAll(/\{\s*"([0-9/]+)",\s*(\d+),\s*\{\s*(\d+),\s*(\d+)\s*\}\s*\}/g)]
  .map(([, name, hours, w, b]) => ({ name, hours: +hours, w: +w, b: +b }));

// Same cycles, same order (config events store the firmware index), same hours.
assert.deepEqual(fw.map(c => c.name), Object.keys(CYCLES), 'cycle names and order');
for (const c of fw) assert.equal(CYCLES[c.name], c.hours, `${c.name} hours`);

// Same light per cycle: the scene the board applies is the one the app shows.
const SPECTRUM = { full: { w: 100, b: 100 }, white: { w: 100, b: 0 }, white50: { w: 50, b: 0 } };
for (const c of fw) assert.deepEqual(SPECTRUM[SCENES[c.name].spectrum], { w: c.w, b: c.b }, `${c.name} scene`);

// activity.js decodes config events with the same index order.
const activity = readFileSync(new URL('./activity.js', import.meta.url), 'utf8');
assert.deepEqual(JSON.parse(activity.match(/const CYCLE_NAMES = (\[[^\]]+\])/)[1].replace(/'/g, '"')), fw.map(c => c.name));

// Same default: 14/10 from 07:00 (defaultConfig() in schedule.h, loadSettings() here).
const def = header.match(/defaultConfig\(\) \{ return \{ CONFIG_MAGIC, (\d+), (\d+), 1 \}/);
assert.deepEqual({ cycle: fw[+def[1]].name, start: +def[2] }, loadSettings());

// Same maths: the app's photoperiod agrees with the firmware's rule (start on, end off)
// for every cycle, start hour and minute.
for (const c of fw) for (let start = 0; start < 24; start++) for (let m = 0; m < 1440; m++) {
  const since = (m + 1440 - start * 60) % 1440;
  assert.equal(photoperiod(start, c.hours, m).on, since < c.hours * 60);
}
console.log('firmware consistency: ok');
