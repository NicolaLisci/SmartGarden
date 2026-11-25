// node js/storage.test.mjs — settings persistence with a fake localStorage.
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) };
const { loadSettings, saveSettings } = await import('./schedule.js');
const { loadPods, savePods, hasLocalPods } = await import('./plants.js');

// Defaults when nothing is stored, round trip, invalid data rejected.
assert.deepEqual(loadSettings(), { cycle: '14/10', start: 7 });
saveSettings({ cycle: '16/8', start: 6 });
assert.deepEqual(loadSettings(), { cycle: '16/8', start: 6 });
store.set('sg.photoperiod', JSON.stringify({ cycle: '99/1', start: 6 }));
assert.deepEqual(loadSettings(), { cycle: '14/10', start: 7 });
store.set('sg.photoperiod', '{not json');
assert.deepEqual(loadSettings(), { cycle: '14/10', start: 7 });

assert.equal(hasLocalPods(), false);
assert.equal(loadPods()[0].name, 'Basilico porpora');
const pods = loadPods(); pods[2] = null; pods[0] = { name: 'Menta', sown: '2026-11-01' };
savePods(pods);
assert.equal(hasLocalPods(), true);
assert.equal(loadPods()[0].name, 'Menta');
assert.equal(loadPods()[2], null);
store.set('sg.pods', '{bad');
assert.equal(loadPods().length, 7);

// Storage that throws (private mode) never breaks the app.
globalThis.localStorage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
assert.deepEqual(loadSettings(), { cycle: '14/10', start: 7 });
assert.doesNotThrow(() => saveSettings({ cycle: '12/12', start: 7 }));
assert.doesNotThrow(() => savePods(pods));
assert.equal(loadPods().length, 7);
assert.equal(hasLocalPods(), false);
console.log('storage: ok');
