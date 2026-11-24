// node app/js/schedule.test.mjs
import assert from 'node:assert/strict';
import { photoperiod, hhmm, duration } from './schedule.js';

// 14/10 from 07:00: at 14:20 light is on, 6 h 40 min left, off at 21:00.
let p = photoperiod(7, 14, 14 * 60 + 20);
assert.deepEqual(p, { on: true, left: 400, next: { type: 'off', at: 21 * 60 } });
assert.equal(duration(p.left), '6 h 40 min');
assert.equal(hhmm(p.next.at), '21:00');

// At 23:00 it is dark and the next event is the 07:00 start.
p = photoperiod(7, 14, 23 * 60);
assert.deepEqual(p, { on: false, left: 0, next: { type: 'on', at: 7 * 60 } });

// Cycle crossing midnight: 16/8 from 18:00, at 02:00 → on, 8 h left, off 10:00.
p = photoperiod(18, 16, 2 * 60);
assert.deepEqual(p, { on: true, left: 480, next: { type: 'off', at: 600 } });

// Boundaries: start minute is on, end minute is off.
assert.equal(photoperiod(7, 12, 7 * 60).on, true);
assert.equal(photoperiod(7, 12, 19 * 60).on, false);
console.log('schedule: ok');
