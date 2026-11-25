// Turns a firmware log event into Italian text. Pure, tested by activity.test.mjs.
const CH = { w: 'luce bianca (W)', b: 'luce blu (B)', p: 'pompa' };
const SRC = { app: 'dall’app', page: 'dalla pagina di test', other: 'da origine sconosciuta' };

const pad = n => String(n).padStart(2, '0');
// Same order as CYCLES in firmware/web-test/schedule.h (config events store cycle × 24 + start).
const CYCLE_NAMES = ['12/12', '14/10', '16/8'];
export function eventTime(e, data) {
  // ts (ms) comes from history.placeTimes; otherwise t (s) from NTP; otherwise, for the
  // current boot only, uptime relative to the board's clock now.
  const sameBoot = e.boot === undefined || e.boot === data.boot;
  const t = e.ts ? e.ts / 1000 : e.t || (sameBoot && data.now ? data.now - Math.round((data.up - e.up) / 1000) : 0);
  if (t) { const d = new Date(t * 1000); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }
  const s = Math.floor(e.up / 1000);
  return `+${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

export function eventDay(e) {
  if (!e.ts) return '';
  return new Date(e.ts).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function describe(e, data) {
  const time = eventTime(e, data);
  const ch = CH[e.ch] || e.ch;
  switch (e.e) {
    case 'boot': return { time, text: 'Scheda avviata', who: 'uscite rilasciate' };
    case 'wifi_up': return { time, text: 'Wi-Fi collegato' };
    case 'wifi_down': return { time, text: 'Wi-Fi perso' };
    case 'set': return { time, text: `${e.v ? 'Accesa' : 'Rilasciata'} ${ch}${e.v > 1 && e.v < 100 ? ` al ${e.v} %` : ''}`, who: SRC[e.src] || '' };
    case 'time': return { time, text: 'Orologio sincronizzato' };
    case 'sched': return { time, text: e.v ? 'Luce accesa dal ciclo' : 'Luce spenta dal ciclo', who: 'programma della lampada' };
    case 'config': return { time, text: e.v < 0 ? 'Ciclo disattivato' : `Ciclo impostato: ${CYCLE_NAMES[Math.floor(e.v / 24)] || '?'} dalle ${pad(e.v % 24)}:00`, who: SRC[e.src] || '' };
    case 'release': return { time, text: 'Rilasciate tutte le uscite', who: SRC[e.src] || '' };
    case 'auto_off': return { time, text: 'Pompa rilasciata', who: 'spegnimento automatico dopo 10 s' };
    case 'ota': return { time, text: 'Aggiornamento firmware avviato' };
    case 'lamp': return { time, text: `Lampada: linea ${e.ch === 'w' ? 'W' : 'B'} ${e.v ? 'alta' : 'bassa'}`, who: 'letta dalla scheda, non verificata' };
    default: return { time, text: e.e };
  }
}
