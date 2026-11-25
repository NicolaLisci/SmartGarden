// Dev server: serves app/ and forwards /state, /set, /release.
//   node dev/server.mjs                         → in-memory device simulator (dev only)
//   DEVICE=http://192.168.1.17 node dev/server.mjs → real lamp
// The simulator mirrors firmware/web-test: forced channels, pump auto-off after 10 s.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT || 5173);
const DEVICE = process.env.DEVICE;
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const API = new Set(['/state', '/set', '/release', '/log', '/schedule']);

const sim = { w: false, b: false, p: false, pumpUntil: 0 };
const simLog = [];
const logEv = (e, src = '', ch = '', v = -1) =>
  simLog.push({ seq: simLog.length + 1, t: Math.floor(Date.now() / 1000), up: Math.round(process.uptime() * 1000), boot: 1, e, src, ch, v });
logEv('boot');
function simState() {
  if (sim.p && Date.now() >= sim.pumpUntil) { sim.p = false; logEv('auto_off', '', 'p', 0); }
  return { w: sim.w, b: sim.b, p: sim.p, pumpLeft: sim.p ? sim.pumpUntil - Date.now() : 0, lw: sim.w ? -1 : 0, lb: sim.b ? -1 : 0 };
}
function simulate(url, res) {
  if (process.env.OFFLINE) { res.writeHead(503); return res.end(); }
  if (url.pathname === '/log') {
    simState();
    res.writeHead(200, { 'content-type': 'application/json' });
    const since = Number(url.searchParams.get('since') || 0), page = simLog.filter(e => e.seq > since).slice(0, 300);
    return res.end(JSON.stringify({ now: Math.floor(Date.now() / 1000), up: Math.round(process.uptime() * 1000), boot: 1, last: simLog.length, events: page, more: (page.at(-1)?.seq || since) < simLog.length, fs: true }));
  }
  if (url.pathname === '/schedule') {
    if (url.searchParams.has('cycle')) sim.cycle = url.searchParams.get('cycle');
    if (url.searchParams.has('start')) sim.start = Number(url.searchParams.get('start'));
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ cycle: sim.cycle || '14/10', start: sim.start ?? 7, enabled: true, clock: true, on: true, next: 60, override: 0 }));
  }
  if (url.pathname === '/set') {
    const ch = url.searchParams.get('ch'), on = url.searchParams.get('on') === '1';
    if (!['w', 'b', 'p'].includes(ch)) { res.writeHead(400); return res.end('unknown channel'); }
    sim[ch] = on;
    logEv('set', url.searchParams.get('src') || 'other', ch, on ? 1 : 0);
    if (ch === 'p') sim.pumpUntil = on ? Date.now() + 10_000 : 0;
  }
  if (url.pathname === '/release') { Object.assign(sim, { w: false, b: false, p: false }); logEv('release', url.searchParams.get('src') || 'other'); }
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(simState()));
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (API.has(url.pathname)) {
    if (!DEVICE) return simulate(url, res);
    try {
      const r = await fetch(DEVICE + url.pathname + url.search, { method: req.method });
      res.writeHead(r.status, { 'content-type': r.headers.get('content-type') || 'text/plain' });
      return res.end(Buffer.from(await r.arrayBuffer()));
    } catch { res.writeHead(502); return res.end('device unreachable'); }
  }
  const path = normalize(join(ROOT, url.pathname === '/' ? 'index.html' : url.pathname));
  if (!path.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(PORT, () => console.log(`SmartGarden app on http://localhost:${PORT} (${DEVICE ? 'device ' + DEVICE : 'simulator'})`));
