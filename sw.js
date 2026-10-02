/* Generated with a content revision and a strict portal-shell allowlist. */
const BASE = '/ro_tools_portal/';
const CACHE_PREFIX = 'ro-tools-portal:pwa:';
const CACHE_NAME = `${CACHE_PREFIX}706bf15803181008e16f`;
const FILES = ["/ro_tools_portal/assets/index-CWvrKt-E.css","/ro_tools_portal/assets/index-D8MK4l4l.js","/ro_tools_portal/favicon.svg","/ro_tools_portal/icons/apple-touch-icon.png","/ro_tools_portal/icons/icon-192.png","/ro_tools_portal/icons/icon-512.png","/ro_tools_portal/icons/maskable-512.png","/ro_tools_portal/index.html","/ro_tools_portal/manifest.webmanifest"];
const INTEGRITY = {"/ro_tools_portal/assets/index-CWvrKt-E.css":"aeabfa4a1b6e920ebef1e9cfa337977cfac0270b3b087936843bd3709f3af5e5","/ro_tools_portal/assets/index-D8MK4l4l.js":"658df310ea9d2b06d1f8ddca08ceb6219e0062a8a59373a3f7af2235348eb6b3","/ro_tools_portal/favicon.svg":"0df6897de6ce6b21d281ed041dadc47db66f22297a2bedcbd418c62566e56c83","/ro_tools_portal/icons/apple-touch-icon.png":"971bf3422e133d44b53a97892ae9cf29cd74c70c802fd1da4987cdf1d76b7e5a","/ro_tools_portal/icons/icon-192.png":"f4d2b284cb43bc215247a07cd44a1234a4a0ebb6aec344e6abe7ecd910f73419","/ro_tools_portal/icons/icon-512.png":"5f08043a5ac606180f658cabf710be278431b17067020d7749ed91e2bd86aed7","/ro_tools_portal/icons/maskable-512.png":"597825cbde8035a11b632e4c37e3b13734696ab7bf3e23f378618a45aed11fec","/ro_tools_portal/index.html":"2868ab1763c40b4052f9f16958b75e21d6a40255f5cd215a7ba0d1451509d422","/ro_tools_portal/manifest.webmanifest":"d6bbde96661c67a28ff6438f23a7ece5c40868b5e2b6a10773b112d4ae05a9e8"};
const ALLOWED = new Set(FILES.map(path => new URL(path, self.location.origin).href));
const HOME = new URL(`${BASE}index.html`, self.location.origin).href;
const NAVIGATION_TIMEOUT_MS = 5000;

self.addEventListener('install', event => {
  // Cache only this build's public shell. Never crawl links, runtime catalog,
  // integration releases, preferences, query strings, or calculator assets.
  event.waitUntil((async () => {
    const responses = await Promise.all(FILES.map(async path => {
      const response = await fetch(new Request(path, { cache: 'reload', credentials: 'omit', redirect: 'error' }));
      if (!response.ok || response.type === 'opaque') throw new Error('Incomplete portal shell');
      // GitHub Pages/CDN rollout may mix versions even when all URLs return 200.
      // Reject a mismatched shell rather than saving HTML with missing bundles.
      const digest = await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer());
      const hex = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
      if (hex !== INTEGRITY[path]) throw new Error('Mismatched portal shell');
      return [path, response];
    }));
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(responses.map(([path, response]) => cache.put(path, response)));
    // The normal waiting lifecycle protects open tabs; do not skipWaiting().
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) await caches.delete(key);
    }
    // Do not claim other pages or reload any existing client.
  })());
});

async function navigation(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NAVIGATION_TIMEOUT_MS);
  try {
    // Always prefer current online HTML and let its hashed assets load normally.
    // Never mix it into this build's offline cache (deployment may be in flight).
    const response = await fetch(request, { cache: 'no-cache', signal: controller.signal });
    if (response.ok) return response;
    if (response.status < 500) return response; // Respect genuine 4xx responses.
    throw new Error('Portal temporarily unavailable');
  } catch {
    const cache = await caches.open(CACHE_NAME);
    const saved = await cache.match(HOME);
    if (!saved) return Response.error();
    const html = (await saved.text()).replace('<html ', '<html data-offline-snapshot="true" ');
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  } finally {
    clearTimeout(timer);
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' && [BASE, `${BASE}index.html`].includes(url.pathname)) {
    event.respondWith(navigation(request));
    return;
  }
  // An exact URL match excludes siblings, query variants, catalog and releases,
  // even when requested by a controlled portal page. No runtime cache writes.
  if (!ALLOWED.has(url.href) || url.href === HOME) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Entries were stored by canonical URL without request headers. Looking up
    // by the full request could miss Vary: Origin responses for module scripts.
    return (await cache.match(url.href)) || fetch(request);
  })());
});
