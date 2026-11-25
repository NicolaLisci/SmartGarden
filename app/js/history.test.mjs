// node app/js/history.test.mjs
import assert from 'node:assert/strict';
import { placeTimes, lightIntervals, dailyHours, mergeEvents } from './history.js';

process.env.TZ = 'Europe/Rome';
const H = 36e5;
const T0 = Date.UTC(2026, 10, 24, 6, 0, 0); // 07:00 Rome
const ev = (seq, boot, up, e, extra = {}) => ({ seq, boot, up, t: 0, e, src: '', ch: '', v: -1, ...extra });

// placeTimes: the NTP 'time' event anchors earlier events of the same boot; other boots stay null.
{
  const placed = placeTimes([
    ev(1, 1, 1000, 'boot'),
    ev(2, 1, 61_000, 'time', { t: (T0 + 60_000) / 1000 }),
    ev(3, 2, 500, 'boot'),
  ]);
  assert.equal(placed[0].ts, T0);
  assert.equal(placed[1].ts, T0 + 60_000);
  assert.equal(placed[2].ts, null);
}

// lightIntervals: app forcing and lamp line both count; overlap is one interval.
{
  const events = placeTimes([
    ev(1, 1, 0, 'boot', { t: T0 / 1000 }),
    ev(2, 1, 1 * H, 'set', { t: (T0 + H) / 1000, ch: 'w', v: 1 }),
    ev(3, 1, 2 * H, 'lamp', { t: (T0 + 2 * H) / 1000, ch: 'b', v: 1 }),
    ev(4, 1, 3 * H, 'set', { t: (T0 + 3 * H) / 1000, ch: 'w', v: 0 }), // lamp still on
    ev(5, 1, 5 * H, 'lamp', { t: (T0 + 5 * H) / 1000, ch: 'b', v: 0 }),
  ]);
  assert.deepEqual(lightIntervals(events, T0 + 10 * H), [[T0 + H, T0 + 5 * H]]);
}

// Release and PWM duty: a duty value counts as on, release turns forced channels off.
{
  const events = placeTimes([
    ev(1, 1, 0, 'set', { t: T0 / 1000, ch: 'w', v: 50 }),
    ev(2, 1, H, 'release', { t: (T0 + H) / 1000 }),
  ]);
  assert.deepEqual(lightIntervals(events, T0 + 2 * H), [[T0, T0 + H]]);
}

// A reboot closes an open interval at the last known moment of the old boot.
{
  const events = placeTimes([
    ev(1, 1, 0, 'set', { t: T0 / 1000, ch: 'b', v: 1 }),
    ev(2, 1, H, 'wifi_up', { t: (T0 + H) / 1000 }),
    ev(3, 2, 0, 'boot', { t: (T0 + 3 * H) / 1000 }),
  ]);
  assert.deepEqual(lightIntervals(events, T0 + 4 * H), [[T0, T0 + H]]);
}

// Still on at the end: the interval runs to now. Events without time keep state only.
{
  const events = [
    { ...ev(1, 1, 0, 'set', { ch: 'w', v: 1 }), ts: null },
    { ...ev(2, 1, 0, 'wifi_up'), ts: T0 },
    { ...ev(3, 1, 0, 'lamp', { ch: 'w', v: 1 }), ts: T0 + H },
  ];
  // Forced at an unknown time, so the edge is placed at the first event with a time.
  assert.deepEqual(lightIntervals(events, T0 + 2 * H), [[T0, T0 + 2 * H]]);
}

// The board's own cycle counts as light.
{
  const events = placeTimes([
    ev(1, 1, 0, 'sched', { t: T0 / 1000, v: 1 }),
    ev(2, 1, 14 * H, 'sched', { t: (T0 + 14 * H) / 1000, v: 0 }),
  ]);
  assert.deepEqual(lightIntervals(events, T0 + 20 * H), [[T0, T0 + 14 * H]]);
}

// Non-light channels are ignored.
assert.deepEqual(lightIntervals(placeTimes([ev(1, 1, 0, 'set', { t: T0 / 1000, ch: 'p', v: 1 })]), T0 + H), []);

// dailyHours: split across midnight, rounded to 0.1 h, oldest day first.
{
  const lateEvening = Date.UTC(2026, 10, 23, 21, 0, 0); // 22:00 Rome on the 23rd
  const days = dailyHours([[lateEvening, lateEvening + 4 * H]], 3, T0);
  assert.deepEqual(days, [
    { day: '2026-11-22', hours: 0 },
    { day: '2026-11-23', hours: 2 },
    { day: '2026-11-24', hours: 2 },
  ]);
}

// mergeEvents keeps order and drops repeats.
assert.deepEqual(mergeEvents([{ seq: 1 }, { seq: 2 }], [{ seq: 2 }, { seq: 3 }]).map(e => e.seq), [1, 2, 3]);
assert.deepEqual(mergeEvents([], [{ seq: 5 }]).map(e => e.seq), [5]);
console.log('history: ok');
