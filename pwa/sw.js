/* Generated with a content revision and a strict portal-shell allowlist. */
const BASE = '/ro_tools_portal/';
const CACHE_PREFIX = 'ro-tools-portal:pwa:';
const CACHE_NAME = `${CACHE_PREFIX}__REVISION__`;
const FILES = __FILES__;
const INTEGRITY = __INTEGRITY__;
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
    return (await cache.match(request)) || fetch(request);
  })());
});
