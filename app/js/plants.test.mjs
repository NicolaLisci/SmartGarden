// node app/js/plants.test.mjs
import assert from 'node:assert/strict';
import { imageFor, daysSince, normalize, rowLabel, slotNumber, ORDER } from './plants.js';

assert.equal(imageFor('Basilico porpora'), 'basilico-porpora');
assert.equal(imageFor('basilico lemon'), 'basilico-lemon');
assert.equal(imageFor('Basilico genovese'), 'basilico');
assert.equal(imageFor('Menta'), null);

const today = new Date(2026, 10, 24);
assert.equal(daysSince('2026-11-14', today), 10);
assert.equal(daysSince('2026-11-24', today), 0);
assert.equal(daysSince('2026-12-01', today), null); // future date is not a sowing date
assert.equal(daysSince('', today), null);
assert.equal(daysSince('14/11/2026', today), null);

assert.equal(normalize(null).length, 7);
assert.equal(normalize(null)[0].name, 'Basilico porpora');
assert.equal(normalize([1, 2]).length, 7); // wrong length → defaults
const n = normalize([{ name: '  Menta ', sown: 'x' }, null, { name: '' }, null, null, null, null]);
assert.deepEqual(n[0], { name: 'Menta', sown: '' });
assert.equal(n[2], null);

assert.equal(rowLabel(0), 'Posto 5 · davanti, a sinistra');
assert.equal(rowLabel(3), 'Posto 1 · dietro, a sinistra');
assert.equal(rowLabel(6), 'Posto 4 · dietro, a destra');
assert.deepEqual(ORDER, [3, 4, 5, 6, 0, 1, 2]);
assert.equal(new Set(ORDER.map(slotNumber)).size, 7); // every number used once
// Board ⇄ app.
import('./plants.js').then(({ boardToPods, podsToMigrate, nameFits }) => {
  const board = { edited: false, pods: [
    { name: 'Basilico porpora', sown: '' }, { name: 'Basilico', sown: '2026-11-10' }, { name: '', sown: '' },
    { name: 'Trinidad Scorpion giallo', sown: '' }, { name: 'Timo', sown: 'bad' }, { name: 'Maggiorana', sown: '' }, { name: 'Bonsai di pino', sown: '' }] };
  const pods = boardToPods(board);
  assert.equal(pods[2], null);
  assert.deepEqual(pods[1], { name: 'Basilico', sown: '2026-11-10' });
  assert.deepEqual(pods[4], { name: 'Timo', sown: '' }); // invalid date dropped
  assert.equal(boardToPods({ pods: [] }), null);
  assert.equal(boardToPods(null), null);

  const local = pods.map(p => p && { ...p }); local[2] = { name: 'Menta', sown: '' };
  assert.deepEqual(podsToMigrate(board, local, true), [[2, { name: 'Menta', sown: '' }]]);
  assert.deepEqual(podsToMigrate({ ...board, edited: true }, local, true), []); // board already edited: board wins
  assert.deepEqual(podsToMigrate(board, local, false), []);                    // nothing saved on the phone

  assert.ok(nameFits('Trinidad Scorpion giallo'));        // 24 bytes
  assert.ok(!nameFits('Basilico è già cresciuto'));       // 26 bytes
  console.log('plants board: ok');
});
console.log('plants: ok');
