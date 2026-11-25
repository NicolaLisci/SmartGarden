import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createNavigation } from './navigation.js';

function boot(hash = '#/home') {
  const listeners = {}, clicks = {}, draws = [], pushes = [];
  const location = { hash };
  const root = { addEventListener: (type, fn) => { clicks[type] = fn; }, contains: () => true };
  const win = { location, history: { pushState: (_, title, url) => { pushes.push(url); location.hash = url; } },
    addEventListener: (type, fn) => { listeners[type] = fn; } };
  return { listeners, clicks, draws, pushes, location, root, win };
}
function install(env) {
  return createNavigation({ root: env.root, win: env.win, onNavigate: () => env.draws.push(env.location.hash) });
}
function click(env, href, overrides = {}) {
  const a = { getAttribute: key => key === 'href' ? href : null, hasAttribute: () => false };
  const e = { target: { closest: () => a }, button: 0, defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; }, ...overrides };
  env.clicks.click?.(e);
  return e;
}

test('tab clicks cancel native fragment navigation and render once via pushState', async () => {
  const env = boot(); await install(env);
  assert.deepEqual(env.draws, ['#/home']);
  const event = click(env, '#/ciclo');
  assert.equal(event.defaultPrevented, true, 'the browser must not perform fragment navigation');
  assert.deepEqual(env.pushes, ['#/ciclo']);
  assert.deepEqual(env.draws, ['#/home', '#/ciclo']);
  env.listeners.hashchange?.();
  assert.equal(env.draws.length, 2, 'a redundant browser notification must not rebuild the screen');
});

test('popstate plus hashchange for one traversal renders only once', async () => {
  const env = boot('#/ciclo'); await install(env);
  env.location.hash = '#/home';
  env.listeners.popstate?.(); env.listeners.hashchange?.();
  assert.deepEqual(env.draws, ['#/ciclo', '#/home']);
  env.listeners.hashchange?.();
  assert.equal(env.draws.length, 2);
});

test('same tab taps are consumed without replacing its content or history', async () => {
  const env = boot(); await install(env);
  assert.equal(click(env, '#/home').defaultPrevented, true);
  assert.deepEqual(env.pushes, []);
  assert.deepEqual(env.draws, ['#/home']);
});

test('modified clicks and links outside the app keep browser behaviour', async () => {
  const env = boot(); await install(env);
  for (const overrides of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) {
    const e = click(env, '#/ciclo', overrides);
    assert.equal(e.defaultPrevented, !!overrides.defaultPrevented);
  }
  assert.equal(click(env, 'https://example.org/').defaultPrevented, false);
  assert.equal(click(env, '#anchor').defaultPrevented, false);
  assert.deepEqual(env.draws, ['#/home']);
});
