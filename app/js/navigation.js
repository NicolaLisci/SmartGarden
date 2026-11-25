// Keep bookmarkable hash URLs, but let the app own in-app navigation. A native
// fragment navigation also runs the browser's navigation/scroll lifecycle; that
// path is suspected of repainting the standalone iPhone view after our render.
export function createNavigation({ root, onNavigate, win = window }) {
  let renderedHash;
  const route = () => {
    const hash = win.location.hash;
    if (hash === renderedHash) return; // popstate and hashchange can describe the same traversal
    renderedHash = hash;
    onNavigate();
  };
  const navigate = hash => {
    if (hash === win.location.hash) return;
    win.history.pushState(null, '', hash);
    route(); // pushState deliberately does not dispatch hashchange
  };
  root.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest('a[href]');
    if (!link || !root.contains(link) || link.hasAttribute('download')) return;
    const target = link.getAttribute('target');
    if (target && target !== '_self') return;
    const hash = link.getAttribute('href');
    if (!/^#\/[a-z]+$/.test(hash)) return;
    e.preventDefault();
    navigate(hash);
  });
  win.addEventListener('popstate', route);
  win.addEventListener('hashchange', route); // external hash changes and existing deep links
  route();
  return { navigate };
}
