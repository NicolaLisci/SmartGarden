// node app/js/device.test.mjs
import assert from 'node:assert/strict';
import { device, refresh, fetchSchedule, schedule, setChannel } from './device.js';

// The board serves one request at a time and drops some while it streams a picture:
// a single failed poll must not blank the app ("Non collegata", "—") until the next one.
let answer;
globalThis.fetch = async () => {
  if (answer instanceof Error) throw answer;
  return { ok: true, json: async () => answer };
};

answer = { w: true, b: true, p: false };
await refresh();
assert.equal(device.status, 'online');

answer = new Error('dropped');
await refresh();
await refresh();
assert.equal(device.status, 'online', 'two dropped polls keep the last known state');
assert.deepEqual(device.state, { w: true, b: true, p: false });

await refresh();
assert.equal(device.status, 'offline', 'three in a row mean the lamp is gone');

answer = { w: false, b: false, p: false };
await refresh();
assert.equal(device.status, 'online');

// Polls never overlap: a slow answer is not stacked behind new requests.
let calls = 0, release;
globalThis.fetch = () => { calls++; return new Promise(r => { release = () => r({ ok: true, json: async () => answer }); }); };
const first = refresh();
await refresh();
assert.equal(calls, 1, 'a poll in flight blocks the next one');
release(); await first;

// A dropped /schedule request keeps the cycle already known.
globalThis.fetch = async () => ({ ok: true, json: async () => ({ cycle: '14/10' }) });
await fetchSchedule();
globalThis.fetch = async () => { throw new Error('dropped'); };
await fetchSchedule();
assert.deepEqual(schedule.value, { cycle: '14/10' });

// A failed command, unlike a poll, shows at once.
globalThis.fetch = async () => { throw new Error('dropped'); };
await setChannel('w', true);
assert.equal(device.status, 'offline');

console.log('device: ok');
