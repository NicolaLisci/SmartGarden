// node app/js/activity.test.mjs
import assert from 'node:assert/strict';
import { describe, eventTime, eventDay } from './activity.js';

process.env.TZ = 'Europe/Rome';
const now = Date.UTC(2026, 10, 24, 20, 40, 0) / 1000; // 21:40:00 Rome
const data = { now, up: 600_000 };

assert.deepEqual(describe({ e: 'set', src: 'page', ch: 'p', v: 1, t: now - 60, up: 0 }, data),
  { time: '21:39:00', text: 'Accesa pompa', who: 'dalla pagina di test' });
// Before NTP sync (t = 0): placed from uptime, 10 min of uptime ago → 21:30:00.
assert.equal(eventTime({ t: 0, up: 0 }, data), '21:30:00');
// No clock at all: show uptime.
assert.equal(eventTime({ t: 0, up: 3_725_000 }, { now: 0, up: 4_000_000 }), '+1:02:05');
assert.equal(describe({ e: 'release', src: 'app', t: now, up: 0 }, data).who, 'dall’app');
// ts from placeTimes wins; other boots without a clock fall back to uptime.
assert.equal(eventTime({ ts: (now - 120) * 1000, t: 0, up: 0, boot: 1 }, { ...data, boot: 2 }), '21:38:00');
assert.equal(eventTime({ t: 0, up: 5_000, boot: 1 }, { ...data, boot: 2 }), '+0:00:05');
assert.equal(describe({ e: 'set', src: 'app', ch: 'w', v: 50, t: now, up: 0 }, data).text, 'Accesa luce bianca (W) al 50 %');
assert.equal(describe({ e: 'time', t: now, up: 0 }, data).text, 'Orologio sincronizzato');
assert.equal(describe({ e: 'weird', t: now, up: 0 }, data).text, 'weird');
for (const e of ['boot', 'wifi_up', 'wifi_down', 'auto_off', 'ota', 'lamp']) assert.ok(describe({ e, ch: 'w', v: 1, t: now, up: 0 }, data).text);
assert.equal(eventDay({}), '');
assert.match(eventDay({ ts: now * 1000 }), /24/);
assert.equal(describe({ e: 'sched', v: 1, t: now, up: 0 }, data).text, 'Luce accesa dal ciclo');
assert.equal(describe({ e: 'sched', v: 0, t: now, up: 0 }, data).text, 'Luce spenta dal ciclo');
assert.equal(describe({ e: 'config', src: 'app', v: 31, t: now, up: 0 }, data).text, 'Ciclo impostato: 14/10 dalle 07:00');
assert.equal(describe({ e: 'config', v: 72, t: now, up: 0 }, data).text, 'Ciclo impostato: ? dalle 00:00');
assert.equal(describe({ e: 'config', v: -1, t: now, up: 0 }, data).text, 'Ciclo disattivato');
console.log('activity: ok');
// Remaining branches: unknown source, lamp line B low, channel name passthrough.
assert.equal(describe({ e: 'set', src: 'x', ch: 'b', v: 0, t: now, up: 0 }, data).text, 'Rilasciata luce blu (B)');
assert.equal(describe({ e: 'set', src: 'x', ch: 'b', v: 0, t: now, up: 0 }, data).who, '');
assert.equal(describe({ e: 'release', src: 'x', t: now, up: 0 }, data).who, '');
assert.equal(describe({ e: 'lamp', ch: 'b', v: 0, t: now, up: 0 }, data).text, 'Lampada: linea B bassa');
assert.equal(describe({ e: 'set', ch: 'z', v: 1, t: now, up: 0 }, data).text, 'Accesa z');
