import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDebug } from './debug.js';

function environment(search) {
  const events = {}, nodes = [];
  const win = { location: { search, hash: '#/home' }, performance: { timeOrigin: 123456, now: () => 7 },
    innerWidth: 390, innerHeight: 844, scrollY: 0, addEventListener: (name, fn) => { events[name] = fn; } };
  const doc = { hidden: false, body: { append: n => nodes.push(n) },
    createElement: () => ({}), addEventListener: (name, fn) => { events[name] = fn; } };
  return { win, doc, events, nodes };
}
test('diagnostics are opt-in and do not install UI or listeners by default', () => {
  const env = environment('');
  createDebug(env)('draw');
  assert.deepEqual(env.nodes, []); assert.deepEqual(env.events, {});
  assert.equal(env.win.__sgDebug, undefined);
});
test('debug mode records draws separately from browser events with a stable page id', () => {
  const env = environment('?debug'); const record = createDebug(env);
  record('draw', { screen: 'home' }); record('draw', { screen: 'ciclo' });
  env.events.hashchange(); env.win.scrollY = 40; env.events.resize();
  const log = env.win.__sgDebug;
  assert.equal(log.page, 123456); assert.equal(log.counts.draw, 2);
  assert.equal(log.counts.hashchange, 1); assert.equal(log.counts.resize, 1);
  assert.equal(log.events.at(-1).scrollY, 40);
  assert.equal(log.events.at(-1).height, 844);
  assert.match(env.nodes[0].textContent, /draw:2/);
  for (let i = 0; i < 100; i++) record('update');
  assert.equal(log.events.length, 80, 'bounded diagnostics retain no device payloads');
});
