// SmartGarden companion app: hash router, screens, bindings to the device state.
import { device, subscribe, setChannels, startPolling, fetchLog } from './device.js';
import { describe, eventDay } from './activity.js';
import { placeTimes, lightIntervals, dailyHours, mergeEvents } from './history.js';
import { CYCLES, SCENES, photoperiod, hhmm, duration, loadSettings, saveSettings } from './schedule.js';
import { icon } from './icons.js';
import { CATALOG, imageFor, daysSince, rowLabel, slotNumber, slotWhere, ORDER, loadPods, savePods } from './plants.js';

const app = document.getElementById('app');
let settings = loadSettings();
let pods = loadPods();
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- derived device facts ----------
const s = () => device.state || {};
const online = () => device.status === 'online';
const lightForced = () => !!(s().w || s().b);
// Readback of the lamp's own line is unverified in hardware; used only to tint the hero.
const lightLit = () => lightForced() || s().lw === 1 || s().lb === 1;
// Schmidt's scenes only ever use W alone or W + B (legacy controller.ino, turnOnLights).
const spectrum = () => (s().w && s().b ? 'full' : s().w && s().wd < 100 ? 'white50' : s().w ? 'white' : null);
const SPECTRUM_LABEL = { full: 'Bianco + Blu', white: 'Solo bianco', white50: 'Bianco al 50 %' };
const SPECTRUM_CMD = { full: { w: true, b: true }, white: { w: true, b: false }, white50: { w: 50, b: false } };
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

// ---------- shared components ----------
const ConnectionIndicator = () =>
  `<span class="conn" data-slot="conn" role="status" aria-live="polite"><i aria-hidden="true"></i><span data-slot="connText"></span></span>`;

const TABS = [['home', 'home', 'Home'], ['piante', 'leaf', 'Piante'], ['ciclo', 'calendar', 'Ciclo'], ['andamento', 'bars', 'Andamento'], ['attivita', 'list', 'Attività']];
// Detail screens keep their parent tab highlighted.
const PARENT = { luce: 'home', pompa: 'home' };
const BottomNavigation = active => `
  <nav class="nav" aria-label="Navigazione principale">
    ${TABS.map(([r, i, l]) => `<a href="#/${r}" class="nav-btn${r === active ? ' is-active' : ''}"${r === active ? ' aria-current="page"' : ''}><span class="nav-pill">${icon(i)}</span><span class="nav-label">${l}</span></a>`).join('')}
  </nav>`;
const BackButton = () => `<button class="icon-btn on-media" data-nav="back" aria-label="Indietro">${icon('back')}</button>`;

const OfflineNote = () => `<p class="offline-note" data-slot="offline" hidden>Dispositivo non raggiungibile. Riprovo…</p>`;

// ---------- screens ----------
const screens = {
  home: () => `
    <section class="screen home">
      <header class="brand">
        <span class="brand-mark">${icon('logo')}<span>SmartGarden</span></span>
        ${ConnectionIndicator()}
      </header>
      <h1 class="display">Coltivazione<br>in corso</h1>
      <figure class="hero" data-slot="hero">
        <span class="hero-stack">
          <img class="hero-off" src="assets/garden-off.jpg" alt="Orto idroponico con sette piante sotto la lampada" width="1000" height="750">
          <img class="hero-on" src="assets/garden-on.jpg" alt="" aria-hidden="true" width="1000" height="750">
        </span>
        <figcaption class="hero-chip" data-slot="heroChip"></figcaption>
      </figure>
      ${OfflineNote()}
      <a class="today" href="#/ciclo">
        <span class="today-head"><small>Oggi · ciclo <span data-slot="todayCycle"></span></small>${icon('chevron')}</span>
        <b class="today-big num" data-slot="todayBig"></b>
        <span class="today-sub" data-slot="todaySub"></span>
        <svg class="daybar" viewBox="0 0 300 30" aria-hidden="true">
          <rect class="daybar-track" x="0" y="6" width="300" height="8" rx="4"/>
          <g data-slot="dayLit"></g>
          <g data-slot="dayNow" class="daybar-now"><line x1="0" x2="0" y1="1" y2="19"/></g>
          <text x="0" y="29">00</text><text x="75" y="29">06</text><text x="150" y="29">12</text><text x="225" y="29">18</text><text x="300" y="29">24</text>
        </svg>
      </a>
      <div class="bento">
        <a class="tile" href="#/luce">
          <span class="tile-icon">${icon('sun')}</span>
          <small>Luce</small><b data-slot="lightVal"></b><span class="tile-sub" data-slot="lightSub"></span>
        </a>
        <a class="tile" href="#/pompa">
          <span class="tile-icon">${icon('drop')}</span>
          <small>Pompa</small><b data-slot="pumpVal"></b><span class="tile-sub">Gestita dalla lampada</span>
        </a>
        <a class="tile" href="#/piante">
          <span class="tile-icon">${icon('leaf')}</span>
          <small>Piante</small><b class="num">${pods.filter(Boolean).length} <span class="of">di 7</span></b>
          <span class="avatars">${pods.filter(Boolean).slice(0, 5).map(p => Thumb(p)).join('')}</span>
        </a>
        <a class="tile" href="#/attivita">
          <span class="tile-icon">${icon('list')}</span>
          <small>Ultima attività</small><b class="tile-event" data-slot="lastEvent">—</b><span class="tile-sub num" data-slot="lastEventTime"></span>
        </a>
      </div>
    </section>`,

  ciclo: () => `
    <section class="screen ciclo">
      <header class="page-head"><h1 class="title">Ciclo di luce</h1></header>
      <div class="dial-wrap">${PhotoperiodDial()}</div>
      <p class="remaining"><span data-slot="remLabel"></span><b data-slot="remValue" class="num"></b></p>
      <div class="segmented cycles" role="radiogroup" aria-label="Ciclo">
        ${Object.keys(CYCLES).map(c => `<button role="radio" data-action="cycle" data-value="${c}" class="seg">${c.replace('/', ' / ')}</button>`).join('')}
      </div>
      <div class="row">
        ${icon('flower')}
        <span class="row-text"><small>Luce del ciclo</small><span data-slot="sceneLight"></span></span>
        <span class="tag tag-soon" data-slot="sceneNote" hidden>Non ancora</span>
      </div>
      <div class="row">
        ${icon('clock')}
        <span class="row-text"><small>Prossimo evento</small><span data-slot="nextEvent"></span></span>
      </div>
      <label class="row row-tap">
        ${icon('sun')}
        <span class="row-text"><small>Ora di accensione</small><span data-slot="startTime" class="num"></span></span>
        <span class="row-action">Cambia ${icon('chevron')}</span>
        <select data-action="start" aria-label="Ora di accensione">
          ${Array.from({ length: 24 }, (_, h) => `<option value="${h}">Accensione alle ${hhmm(h * 60)}</option>`).join('')}
        </select>
      </label>
      <p class="footnote">Programma salvato su questo telefono. Il firmware attuale non lo esegue ancora.</p>
    </section>`,

  piante: () => `
    <section class="screen piante">
      <header class="page-head"><h1 class="title">Le tue piante</h1><span class="badge">${pods.filter(Boolean).length} di 7</span></header>
      ${Deck()}
      <p class="hint deck-hint">Vista dall’alto. Tocca un posto per cambiare pianta.</p>
      <ul class="plant-list">
        ${ORDER.map(i => [pods[i], i]).map(([p, i]) => `
          <li><button class="plant" data-pod="${i}">
            <span class="thumb-wrap">${Thumb(p)}<span class="pod-num">${slotNumber(i)}</span></span>
            <span><b>${p ? esc(p.name) : 'Posto libero'}</b><small>Posto ${slotNumber(i)} · ${slotWhere(i)}${p && daysSince(p.sown) !== null ? ` · giorno ${daysSince(p.sown)}` : ''}</small></span>
            ${icon('chevron')}
          </button></li>`).join('')}
      </ul>
      ${PodEditor()}
    </section>`,

  luce: () => `
    <section class="screen detail luce">
      <figure class="media media-led" data-slot="media">
        <img src="assets/led.png" alt="Pannello LED della lampada" width="325" height="188">
        <span class="hero-glow" aria-hidden="true"></span>
      </figure>
      ${BackButton()}
      <div class="sheet">
        <span class="grabber" aria-hidden="true"></span>
        <div class="sheet-head"><h1 class="title">Illuminazione</h1><span class="badge" data-slot="lightBadge"></span></div>
        <p class="hint" data-slot="lightHint"></p>
        <a class="row row-tap program" href="#/ciclo">
          ${icon('calendar')}
          <span class="row-text"><small>Programma</small><span data-slot="programText"></span></span>
          <span class="row-action">Ciclo ${icon('chevron')}</span>
        </a>
        <h2 class="label">Comando manuale</h2>
        <div class="choices" role="group" aria-label="Spettro">
          <button class="choice" data-action="spectrum" data-value="white">${icon('sun')}<span>Solo bianco<small>(W)</small><em class="tag" data-scene="white">del ciclo</em></span></button>
          <button class="choice" data-action="spectrum" data-value="white50">${icon('sunlow')}<span>Bianco tenue<small>(W al 50 %)</small><em class="tag" data-scene="white50">del ciclo</em></span></button>
          <button class="choice" data-action="spectrum" data-value="full">${icon('flower')}<span>Completo<small>(Bianco + Blu)</small><em class="tag" data-scene="full">del ciclo</em></span></button>
        </div>
        ${OfflineNote()}
      </div>
    </section>`,

  pompa: () => `
    <section class="screen detail pompa">
      <figure class="media media-water" data-slot="media">
        <img src="assets/water.png" alt="Acqua del serbatoio" width="325" height="188">
        <span class="bubbles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
      </figure>
      ${BackButton()}
      <div class="sheet">
        <span class="grabber" aria-hidden="true"></span>
        <div class="sheet-head"><h1 class="title">Pompa</h1><span class="badge">Automatica</span></div>
        <p class="hint">Sola lettura: la pompa segue il programma della lampada.</p>
        <div class="row">
          ${icon('drop')}
          <span class="row-text"><small>Modalità</small><span>Automatica, gestita dalla lampada</span></span>
        </div>
        <div class="row">
          ${icon('clock')}
          <span class="row-text"><small>Ciclo osservato</small><span>Circa 5 min accesa, 30 min ferma · da confermare</span></span>
        </div>
        <div class="row" data-slot="pumpManual" hidden>
          ${icon('clock')}
          <span class="row-text"><small>Accensione manuale in corso</small><span data-slot="pumpRow"></span></span>
        </div>
        ${OfflineNote()}
      </div>
    </section>`,

  attivita: () => `
    <section class="screen attivita">
      <header class="page-head"><h1 class="title">Attività</h1></header>
      <p class="hint">Eventi salvati sulla scheda: restano anche dopo un riavvio. Qui gli ultimi 200. Le accensioni della pompa decise dalla lampada non sono visibili.</p>
      <ul class="log" data-slot="log" aria-live="polite"><li class="log-empty">Caricamento…</li></ul>
    </section>`,

  andamento: () => `
    <section class="screen andamento">
      <header class="page-head"><h1 class="title">Andamento</h1></header>
      <div class="segmented period" role="radiogroup" aria-label="Periodo">
        ${[7, 14, 30].map(d => `<button class="seg" role="radio" data-action="period" data-value="${d}">${d} giorni</button>`).join('')}
      </div>
      <section class="card chart-card">
        <div class="chart-head"><small>Ore di luce al giorno</small><b class="num" data-slot="avgHours">—</b></div>
        <div class="bars" data-slot="bars" role="img" aria-label="Ore di luce al giorno"></div>
        <p class="hint" data-slot="chartNote">Dalla lettura della linea della lampada (non verificata) e dai comandi dell’app, salvati sulla scheda.</p>
      </section>
    </section>`,
};

// ---------- plants: deck and editor ----------
const Thumb = p => {
  const img = p && imageFor(p.name);
  return img ? `<img class="thumb" src="assets/plants/${img}.png" alt="" width="56" height="56">`
    : `<span class="thumb thumb-empty${p ? ' has-plant' : ''}" aria-hidden="true">${p ? icon('leaf') : ''}</span>`;
};
// Top view of the GHS37 deck, from docs/hardware/photos/duronic-overview-lamp.jpg.
const POS = [[72, 124], [152, 124], [232, 124], [46, 54], [122, 54], [218, 54], [294, 54]];
function Deck() {
  return `
    <div class="deck">
      <svg viewBox="0 0 340 178" aria-hidden="true">
        <defs>
          <linearGradient id="deckTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfaf7"/><stop offset="1" stop-color="#ebe7e0"/></linearGradient>
          <radialGradient id="pole" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#e4e4e2"/><stop offset="1" stop-color="#9c9b97"/></radialGradient>
        </defs>
        <rect x="4" y="8" width="332" height="166" rx="28" fill="#d8d3ca"/>
        <rect x="4" y="4" width="332" height="164" rx="28" fill="url(#deckTop)" stroke="#e2ddd4"/>
        <rect x="14" y="14" width="312" height="144" rx="20" fill="none" stroke="#e6e2da"/>
        ${POS.map(([x, y]) => `<rect x="${x - 23}" y="${y - 23}" width="46" height="46" rx="11" fill="#f1eee8" stroke="#dcd7ce"/>`).join('')}
        <circle cx="296" cy="124" r="13" fill="#d6d2cb" stroke="#c9c4bb"/>
        <circle cx="170" cy="54" r="8" fill="url(#pole)" stroke="#8d8c88" stroke-width=".6"/>
      </svg>
      ${pods.map((p, i) => `
        <button class="pod${p ? ' is-planted' : ''}" data-pod="${i}" style="left:${(POS[i][0] / 340) * 100}%;top:${(POS[i][1] / 178) * 100}%"
          aria-label="${rowLabel(i)}: ${p ? esc(p.name) : 'libero'}">${p ? Thumb(p) : '<span class="sponge"></span>'}<span class="pod-num">${slotNumber(i)}</span></button>`).join('')}
      <span class="deck-back">Dietro</span><span class="deck-front">Davanti</span>
      <span class="deck-tag" style="left:${(296 / 340) * 100}%;top:${(150 / 178) * 100}%">acqua</span>
    </div>`;
}
function PodEditor() {
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  return `
    <dialog class="editor" aria-labelledby="edTitle">
      <form method="dialog">
        <span class="grabber" aria-hidden="true"></span>
        <div class="sheet-head"><h2 class="title" id="edTitle"></h2><button class="icon-btn" value="cancel" aria-label="Chiudi">${icon('close')}</button></div>
        <label class="field" for="edName">Pianta</label>
        <input class="input" id="edName" type="text" maxlength="32" autocomplete="off" enterkeyhint="done">
        <div class="chips" role="group" aria-label="Suggerimenti">
          ${CATALOG.map(c => `<button type="button" class="chip" data-chip="${esc(c.name)}">${esc(c.name)}</button>`).join('')}
        </div>
        <label class="field" for="edSown">Data di semina <small>facoltativa</small></label>
        <input class="input" id="edSown" type="date" max="${today}">
        <div class="ed-actions">
          <button class="btn btn-quiet" value="clear" data-slot="edClear">Svuota posto</button>
          <button class="btn btn-primary" value="save">Salva</button>
        </div>
      </form>
    </dialog>`;
}
let editing = -1;
function openEditor(i) {
  const dlg = app.querySelector('dialog.editor');
  editing = i;
  const p = pods[i];
  dlg.querySelector('#edTitle').textContent = rowLabel(i);
  dlg.querySelector('#edName').value = p ? p.name : '';
  dlg.querySelector('#edSown').value = p ? p.sown : '';
  dlg.querySelector('[data-slot="edClear"]').hidden = !p;
  dlg.showModal();
}
function closeEditor(dlg) {
  const name = dlg.querySelector('#edName').value.trim();
  const sown = dlg.querySelector('#edSown').value;
  if (dlg.returnValue === 'save') pods[editing] = name ? { name, sown: daysSince(sown) === null ? '' : sown } : null;
  else if (dlg.returnValue === 'clear') {
    if (!confirm(`Svuotare ${rowLabel(editing).toLowerCase()}?`)) return;
    pods[editing] = null;
  } else return;
  savePods(pods);
  render();
  toast(dlg.returnValue === 'save' && name ? 'Pianta salvata' : 'Posto svuotato');
}
function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('p'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = msg; t.classList.add('is-on');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('is-on'), 2500);
}

// ---------- photoperiod dial ----------
const R = 96, C = 2 * Math.PI * R;
function PhotoperiodDial() {
  return `
    <svg class="dial" viewBox="0 0 260 260" role="img" aria-label="Fotoperiodo sulle 24 ore">
      <circle class="dial-track" cx="130" cy="130" r="${R}"/>
      <circle class="dial-arc" data-slot="arc" cx="130" cy="130" r="${R}" stroke-dasharray="0 ${C}"/>
      <g data-slot="now" class="dial-now"><circle cx="130" cy="${130 - R}" r="9"/><circle cx="130" cy="${130 - R}" r="6"/></g>
      <text x="130" y="16" class="dial-h">00</text>
      <text x="252" y="134" class="dial-h">06</text>
      <text x="130" y="256" class="dial-h">12</text>
      <text x="8" y="134" class="dial-h">18</text>
    </svg>
    <div class="dial-center">
      ${icon('sun')}
      <b class="num big" data-slot="cycleLabel"></b>
      <small data-slot="sceneName"></small>
    </div>`;
}

// ---------- state → DOM ----------
const $ = sel => app.querySelectorAll(`[data-slot="${sel}"]`);
const set = (sel, fn) => $(sel).forEach(fn);
const text = (sel, v) => set(sel, el => { el.textContent = v; });

function update() {
  const st = s(), ok = online(), pending = device.pending;
  set('conn', el => {
    el.dataset.status = device.status;
    el.title = { online: 'L’app riceve lo stato della lampada', offline: 'La lampada non risponde: i comandi sono sospesi', connecting: 'Ricerca della lampada' }[device.status];
  });
  text('connText', { online: 'Collegata', offline: 'Non raggiungibile', connecting: 'Collegamento…' }[device.status]);
  set('offline', el => { el.hidden = device.status !== 'offline'; });
  app.querySelectorAll('[data-action]').forEach(el => {
    if (['cycle', 'start', 'period'].includes(el.dataset.action)) return; // local, not device commands
    el.disabled = !ok || pending;
  });

  const sp0 = spectrum();
  text('lightVal', !ok ? '—' : lightForced() ? 'Accesa' : 'Auto');
  text('lightSub', !ok ? 'Lampada non raggiungibile' : sp0 ? `${SPECTRUM_LABEL[sp0]}, a mano` : lightForced() ? 'Accesa a mano' : 'Decide il programma');
  text('pumpVal', !ok ? '—' : st.p ? 'Manuale' : 'Auto');
  text('heroChip', !ok ? 'Non collegata' : !lightForced() ? 'Luce automatica' : sp0 ? `Luce accesa · ${SPECTRUM_LABEL[sp0]}` : 'Luce accesa');
  set('hero', el => el.classList.toggle('is-lit', ok && lightLit()));
  app.querySelector('.media-led')?.classList.toggle('is-lit', ok && lightLit());

  text('lightBadge', !ok ? '—' : lightForced() ? 'Accesa' : 'Auto');
  text('lightHint', lightForced() ? 'Accesa a mano: vale finché non tocchi di nuovo lo spettro attivo.' : 'Decide il programma della lampada. Tocca uno spettro per accenderla a mano.');
  const sc = SCENES[settings.cycle];
  text('programText', `${settings.cycle} · ${sc.light}`);
  app.querySelectorAll('[data-scene]').forEach(el => { el.hidden = el.dataset.scene !== sc.spectrum; });
  const sp = spectrum();
  app.querySelectorAll('[data-action="spectrum"]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.value === sp)));

  // The app never drives the pump; a forced run can still come from the test page.
  set('pumpManual', el => { el.hidden = !(ok && st.p); });
  text('pumpRow', `Rilascio automatico tra ${Math.ceil((st.pumpLeft || 0) / 1000)} s`);
  app.querySelector('.media-water')?.classList.toggle('is-running', ok && !!st.p);

  updateDial();
}

function updateToday() {
  if (!app.querySelector('.today')) return;
  const hours = CYCLES[settings.cycle], now = nowMin();
  const p = photoperiod(settings.start, hours, now);
  text('todayCycle', `${settings.cycle} · ${SCENES[settings.cycle].name.toLowerCase()}`);
  text('todayBig', p.on ? duration(p.left) : hhmm(p.next.at));
  text('todaySub', p.on ? `di luce secondo il ciclo · spegnimento alle ${hhmm(p.next.at)}` : 'prossima accensione secondo il ciclo');
  const x = m => (m / 1440) * 300, a = settings.start * 60, b = a + hours * 60;
  const seg = (from, to) => `<rect class="daybar-lit" x="${x(from)}" y="6" width="${x(to) - x(from)}" height="8" rx="4"/>`;
  set('dayLit', el => { el.innerHTML = b <= 1440 ? seg(a, b) : seg(a, 1440) + seg(0, b - 1440); });
  set('dayNow', el => { el.setAttribute('transform', `translate(${x(now)} 0)`); });
}

function updateDial() {
  updateToday();
  if (!app.querySelector('.dial')) return;
  const hours = CYCLES[settings.cycle];
  const p = photoperiod(settings.start, hours, nowMin());
  set('arc', el => {
    el.setAttribute('stroke-dasharray', `${(hours / 24) * C} ${C}`);
    el.style.transform = `rotate(${(settings.start / 24) * 360 - 90}deg)`;
  });
  set('now', el => { el.style.transform = `rotate(${(nowMin() / 1440) * 360}deg)`; });
  text('cycleLabel', settings.cycle.replace('/', ' / '));
  const scene = SCENES[settings.cycle];
  text('sceneName', `Ciclo ${scene.name.toLowerCase()}`);
  text('sceneLight', scene.light);
  // Short tag in the card; the reason stays available to screen readers and on long-press.
  set('sceneNote', el => { el.hidden = !scene.note; el.title = scene.note || ''; el.setAttribute('aria-label', scene.note || ''); });
  text('remLabel', p.on ? 'Luce accesa ancora per' : 'Luce spenta fino alle');
  text('remValue', p.on ? duration(p.left) : hhmm(p.next.at));
  text('startTime', hhmm(settings.start * 60));
  text('nextEvent', `${p.next.type === 'off' ? 'Spegnimento' : 'Accensione'} luce · ${hhmm(p.next.at)}`);
  app.querySelectorAll('[data-action="cycle"]').forEach(el => el.setAttribute('aria-checked', String(el.dataset.value === settings.cycle)));
  const sel = app.querySelector('select[data-action="start"]');
  if (sel) sel.value = String(settings.start);
}

// ---------- actions ----------
app.addEventListener('click', e => {
  const pod = e.target.closest('[data-pod]');
  if (pod) return openEditor(Number(pod.dataset.pod));
  const chip = e.target.closest('[data-chip]');
  if (chip) { app.querySelector('#edName').value = chip.dataset.chip; return; }
  if (e.target.closest('[data-nav="back"]')) {
    // Back returns where the user came from; a deep link has no history, so go home.
    return navDepth > 0 ? history.back() : (location.hash = '#/home');
  }
  const el = e.target.closest('button[data-action]');
  if (!el || el.disabled) return;
  const { action, value } = el.dataset;
  if (action === 'spectrum') {
    // Each card is a toggle: tapping the lit one switches the light back off.
    if (spectrum() === value) return setChannels({ w: false, b: false });
    setChannels(SPECTRUM_CMD[value]);
  }
  else if (action === 'period') { period = Number(value); renderLogViews(); }
  else if (action === 'cycle') { settings = { ...settings, cycle: value }; saveSettings(settings); updateDial(); }
});
app.addEventListener('close', e => { if (e.target.matches('dialog.editor')) closeEditor(e.target); }, true);
app.addEventListener('change', e => {
  if (e.target.dataset.action !== 'start') return;
  settings = { ...settings, start: Number(e.target.value) };
  saveSettings(settings);
  updateDial();
});

// ---------- activity log and history (persisted on the board) ----------
let logTimer = null, logCache = [], logMeta = null, logOk = null, period = 7;
async function pullLog() {
  // Pages of 300 events; a fresh app reads the whole file once, then only what is new.
  for (let i = 0; i < 40; i++) {
    const data = await fetchLog(logCache.length ? logCache.at(-1).seq : 0);
    if (!data) { logOk = false; return; }
    logOk = true; logMeta = data;
    // A board whose log restarted (seq lower than ours) invalidates the cache.
    if (data.last < (logCache.at(-1)?.seq || 0)) logCache = [];
    logCache = mergeEvents(logCache, data.events);
    if (!data.more) return;
  }
}
async function refreshLog() {
  if (!app.querySelector('[data-slot="log"], [data-slot="lastEvent"], [data-slot="bars"]')) { clearInterval(logTimer); logTimer = null; return; }
  await pullLog();
  renderLogViews();
}
function renderLogViews() {
  const placed = placeTimes(logCache);
  const last = placed.at(-1);
  const d = last && describe(last, logMeta);
  text('lastEvent', d ? d.text : logOk ? 'Nessun evento' : 'Registro non disponibile');
  text('lastEventTime', d ? [eventDay(last), d.time].filter(Boolean).join(' · ') : '');
  const list = app.querySelector('[data-slot="log"]');
  if (list) list.replaceChildren(...(logOk === false && !placed.length ? [emptyItem('Registro non disponibile: la scheda non lo espone o non è raggiungibile.')] : renderLog(placed.slice(-200).reverse())));
  const bars = app.querySelector('[data-slot="bars"]');
  if (bars) renderBars(bars, placed);
}
function emptyItem(t) { const li = document.createElement('li'); li.className = 'log-empty'; li.textContent = t; return li; }
function renderLog(events) {
  if (!events.length) return [emptyItem('Nessun evento.')];
  let day = null;
  return events.flatMap(e => {
    const out = [];
    const dd = eventDay(e);
    if (dd && dd !== day) { day = dd; const h = document.createElement('li'); h.className = 'log-day'; h.textContent = dd; out.push(h); }
    const { time, text: label, who } = describe(e, logMeta);
    const li = document.createElement('li'); li.className = 'log-item';
    const t = document.createElement('span'); t.className = 'log-time num'; t.textContent = time;
    const b = document.createElement('span'); b.className = 'log-text'; b.textContent = label;
    if (who) { const w = document.createElement('small'); w.textContent = who; b.append(w); }
    li.append(t, b);
    out.push(li);
    return out;
  });
}
let barsKey = '';
function renderBars(el, placed) {
  app.querySelectorAll('[data-action="period"]').forEach(b => b.setAttribute('aria-checked', String(Number(b.dataset.value) === period)));
  const days = dailyHours(lightIntervals(placed, Date.now()), period, Date.now());
  const max = Math.max(16, ...days.map(d => d.hours));
  const any = days.some(d => d.hours > 0);
  const avg = days.reduce((a, d) => a + d.hours, 0) / days.length;
  text('avgHours', any ? `${avg.toFixed(1)} h di media` : '—');
  el.setAttribute('aria-label', days.map(d => `${d.day}: ${d.hours} ore`).join(', '));
  el.style.setProperty('--n', days.length);
  // Bars grow only when what they show changes (first view, new period, new data), not on every poll.
  const key = period + JSON.stringify(days);
  el.classList.toggle('grow', key !== barsKey || !el.children.length);
  if (key === barsKey && el.children.length) return;
  barsKey = key;
  el.replaceChildren(...days.map((d, i) => {
    const col = document.createElement('span'); col.className = 'bar';
    const fill = document.createElement('i'); fill.style.setProperty('--h', `${(d.hours / max) * 100}%`); fill.style.setProperty('--d', `${i * 30}ms`);
    const lab = document.createElement('small');
    const date = new Date(d.day + 'T12:00');
    lab.textContent = period <= 7 ? date.toLocaleDateString('it-IT', { weekday: 'narrow' }) : (i % 5 === 0 ? String(date.getDate()) : '');
    col.title = `${d.hours} h`;
    col.append(fill, lab);
    return col;
  }));
  set('chartNote', n => { n.textContent = logOk === false ? 'Storico non disponibile: la scheda non risponde o non ha ancora il firmware con il registro.' : any ? 'Dalla lettura della linea della lampada (non verificata) e dai comandi dell’app, salvati sulla scheda.' : 'Ancora nessuna ora di luce registrata in questo periodo.'; });
}

// ---------- router ----------
let navDepth = -1, current = null;
// The nav is rendered once and only its active tab changes, so it never blinks.
const view = document.createElement('div');
app.append(view);
app.insertAdjacentHTML('beforeend', BottomNavigation('home'));
function setActiveTab(tab) {
  app.querySelectorAll('.nav-btn').forEach(a => {
    const on = a.getAttribute('href') === `#/${tab}`;
    a.classList.toggle('is-active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}
function route() {
  navDepth++;
  render(true);
}
// Native-like motion: tabs switch instantly; a detail screen slides in from the right.
function render(navigated = false) {
  const hash = location.hash.replace(/^#\/?/, '') || 'home';
  const name = screens[hash] ? hash : 'home';
  const push = navigated && PARENT[name] && current !== name;
  current = name;
  view.innerHTML = screens[name]();
  if (push) view.firstElementChild.classList.add('push');
  setActiveTab(PARENT[name] || name);
  if (navigated) window.scrollTo(0, 0); // every screen opens from the top
  document.title = name === 'home' ? 'SmartGarden' : `${view.querySelector('h1')?.textContent} · SmartGarden`;
  update();
  if (['attivita', 'home', 'andamento'].includes(name)) { renderLogViews(); if (!logTimer) { refreshLog(); logTimer = setInterval(refreshLog, 5000); } }
}
window.addEventListener('hashchange', route);
setInterval(updateDial, 30_000);
route();
subscribe(update);
startPolling();
