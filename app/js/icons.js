// Line icons, 24 px grid, stroke inherits currentColor.
const P = {
  home: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
  leaf: '<path d="M12 20c0-6 0-9 6-13-1 6-2.5 9-6 10"/><path d="M12 20c0-5-1-8-6-11 .5 5 2 7.5 6 9"/>',
  bars: '<path d="M5 20V13M9.5 20V9M14 20v-6M18.5 20V6M3.5 20h17"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  list: '<path d="M9 7h11M9 12h11M9 17h11"/><circle cx="4.5" cy="7" r=".8"/><circle cx="4.5" cy="12" r=".8"/><circle cx="4.5" cy="17" r=".8"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  back: '<path d="M15 5 8 12l7 7"/>',
  chevron: '<path d="m9.5 6 6 6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
  sunlow: '<circle cx="12" cy="12" r="4"/><path d="M12 4.5v1.2M12 18.3v1.2M4.5 12h1.2M18.3 12h1.2M6.7 6.7l.8.8M16.5 16.5l.8.8M6.7 17.3l.8-.8M16.5 7.5l.8-.8"/><path d="M12 8a4 4 0 0 0 0 8z" fill="currentColor" stroke="none"/>',
  drop: '<path d="M12 3.5c3.2 4.2 5.5 7.4 5.5 10.2a5.5 5.5 0 0 1-11 0c0-2.8 2.3-6 5.5-10.2z"/>',
  flower: '<circle cx="12" cy="12" r="2.3"/><path d="M12 9.7c-1.2-2.3-.8-5 0-6 .8 1 1.2 3.7 0 6zM12 14.3c-1.2 2.3-.8 5 0 6 .8-1 1.2-3.7 0-6zM9.7 12c-2.3-1.2-5-.8-6 0 1 .8 3.7 1.2 6 0zM14.3 12c2.3-1.2 5-.8 6 0-1 .8-3.7 1.2-6 0zM10.4 10.4C8 9.6 6.6 7.3 6.6 6.6c.7 0 3 1.4 3.8 3.8zM13.6 13.6c2.4.8 3.8 3.1 3.8 3.8-.7 0-3-1.4-3.8-3.8zM13.6 10.4c.8-2.4 3.1-3.8 3.8-3.8 0 .7-1.4 3-3.8 3.8zM10.4 13.6c-.8 2.4-3.1 3.8-3.8 3.8 0-.7 1.4-3 3.8-3.8z"/>',
  logo: '<circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none"/><path d="M12 17c0-4 .3-6.5 4-8.5-.4 4-1.8 6-4 6.5M12 17c0-3-.8-5-3.8-6.5.3 3 1.5 4.6 3.8 5" stroke="var(--c-bg)"/>',
};
export const icon = name =>
  `<svg class="i i-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name]}</svg>`;
