// Temporary, local diagnostics for a real iPhone recording: add ?debug before #/tab.
// No network, storage, or device payloads; a new P number identifies a full reload.
export function createDebug({ win = window, doc = document } = {}) {
  if (!new URLSearchParams(win.location.search).has('debug')) return () => {};
  const log = win.__sgDebug = { page: Math.round(win.performance.timeOrigin), counts: {}, events: [] };
  const panel = doc.createElement('output');
  panel.className = 'navigation-debug';
  doc.body.append(panel);
  const record = (event, detail = {}) => {
    log.counts[event] = (log.counts[event] || 0) + 1;
    log.events.push({ event, at: Math.round(win.performance.now()), hash: win.location.hash,
      width: win.innerWidth, height: win.innerHeight, scrollY: win.scrollY, ...detail });
    if (log.events.length > 80) log.events.shift();
    panel.textContent = `P${log.page}\n${['route', 'draw', 'update', 'hashchange', 'popstate', 'resize'].map(k => `${k}:${log.counts[k] || 0}`).join(' ')}\n${event} ${win.location.hash} ${win.innerWidth}×${win.innerHeight} y:${win.scrollY}`;
  };
  for (const event of ['hashchange', 'popstate', 'pageshow', 'resize']) win.addEventListener(event, () => record(event));
  doc.addEventListener('visibilitychange', () => record('visibility', { hidden: doc.hidden }));
  record('boot');
  return record;
}
