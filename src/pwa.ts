const BASE = '/ro_tools_portal/';

export function registerPortalWorker() {
  const offline = document.getElementById('offline-status');
  // The worker annotates a cached navigation, including network failures while
  // navigator.onLine is still true. Do not mistake that older snapshot for live data.
  const cached = document.documentElement.hasAttribute('data-offline-snapshot');
  const showConnection = () => {
    if (!offline) return;
    offline.hidden = navigator.onLine && !cached;
    offline.textContent = cached && navigator.onLine
      ? 'กำลังดูสำเนา Portal ที่บันทึกไว้ ข้อมูลอาจเก่า โหลดหน้าใหม่เมื่อเชื่อมต่อได้ เครื่องมือปลายทางยังต้องใช้อินเทอร์เน็ต'
      : 'ออฟไลน์: ดูและค้นหาหน้ารวมเครื่องมือที่บันทึกไว้ได้ เครื่องมือและคู่มือปลายทางยังต้องใช้อินเทอร์เน็ต';
  };
  showConnection();
  window.addEventListener('online', showConnection);
  window.addEventListener('offline', showConnection);
  // Never register at the origin root or from embedded/shared-nav pages. There
  // is intentionally no Service-Worker-Allowed header or expanded scope.
  if (!('serviceWorker' in navigator) || !window.isSecureContext ||
      ![BASE, `${BASE}index.html`].includes(location.pathname)) return;
  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${BASE}sw.js`, { scope: BASE, updateViaCache: 'none' });
      const showUpdate = () => {
        const notice = document.getElementById('pwa-update');
        if (notice && registration.waiting) notice.hidden = false;
      };
      showUpdate();
      const watchInstalling = () => registration.installing?.addEventListener('statechange', showUpdate);
      watchInstalling(); // Navigation may have started the update before register() resolved.
      registration.addEventListener('updatefound', watchInstalling);
      // No skipWaiting/reload: existing tabs retain a complete matching cache.
    } catch {
      // Storage/private-mode/registration failures must not break the portal.
    }
  };
  if (document.readyState === 'complete') void register();
  else window.addEventListener('load', () => { void register(); }, { once: true });
}
