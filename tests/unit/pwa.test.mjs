import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const root = new URL('../../', import.meta.url);
const origin = 'https://econds.github.io';
const base = '/ro_tools_portal/';
const script = await readFile(new URL('dist/sw.js', root), 'utf8');
const files = JSON.parse(script.match(/const FILES = (\[.*\]);/)[1]);
const current = script.match(/const CACHE_NAME = `\$\{CACHE_PREFIX\}([^`]+)`;/)[1];
const contents = new Map(await Promise.all(files.map(async path => [new URL(path, origin).href, await readFile(new URL(`dist/${path.slice(base.length)}`, root))])));
function worker() {
  const listeners = new Map(), stores = new Map(), requests = [], matches = [];
  let network = async request => new Response(contents.get(request.url));
  const key = value => new URL(typeof value === 'string' ? value : value.url, origin).href;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const map = stores.get(name);
      return { async put(url, response) { map.set(key(url), response.clone()); }, async match(url) { matches.push(url); return map.get(key(url))?.clone(); } };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  vm.runInNewContext(script, {
    self: { location: new URL(`${origin}${base}sw.js`), addEventListener: (name, callback) => listeners.set(name, callback) },
    caches, URL, Response, AbortController, setTimeout, clearTimeout, crypto: webcrypto, Uint8Array,
    Request: class extends Request { constructor(url, options) { super(new URL(url, origin), options); } },
    fetch: async (request, options) => { requests.push({ request, options }); return network(request, options); },
  });
  return {
    stores, requests, caches, matches,
    network: value => { network = value; },
    async lifecycle(name) { let promise; listeners.get(name)({ waitUntil: value => { promise = value; } }); await promise; },
    fetch(url, options = {}) { let response; listeners.get('fetch')({ request: { url: new URL(url, origin).href, method: 'GET', mode: 'cors', ...options }, respondWith: value => { response = value; } }); return response; },
  };
}

test('manifest, shell and PNG icons are complete and scoped to the deployed subpath', async () => {
  const manifest = JSON.parse(await readFile(new URL('dist/manifest.webmanifest', root), 'utf8'));
  for (const field of ['id', 'scope', 'start_url']) assert.equal(manifest[field], base);
  assert.equal(manifest.name, 'RO Tools Portal'); assert.equal(manifest.display, 'standalone');
  assert.match(manifest.background_color, /^#[0-9a-f]{6}$/i); assert.match(manifest.theme_color, /^#[0-9a-f]{6}$/i);
  for (const icon of [...manifest.icons, { src: './icons/apple-touch-icon.png', sizes: '180x180' }]) {
    const png = await readFile(new URL(`dist/${icon.src}`, root));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
    assert(files.includes(`${base}${icon.src.slice(2)}`));
  }
  assert(manifest.icons.some(icon => icon.purpose === 'maskable'));
  for (const path of files) {
    assert.match(path, /^\/ro_tools_portal\/(index\.html|favicon\.svg|manifest\.webmanifest|assets\/index-[\w-]+\.(js|css)|icons\/[\w-]+\.png)$/);
    await readFile(new URL(`dist/${path.slice(base.length)}`, root));
  }
  const html = await readFile(new URL('dist/index.html', root), 'utf8');
  assert(html.includes('rel="manifest"')); assert(html.includes('rel="apple-touch-icon"'));
});

test('installation caches only exact public shell URLs without credentials', async () => {
  const w = worker(); await w.lifecycle('install');
  assert.equal(w.stores.size, 1);
  assert.deepEqual([...w.stores.values()][0].size, files.length);
  for (const { request } of w.requests) {
    assert.equal(request.credentials, 'omit'); assert.equal(request.redirect, 'error'); assert.equal(request.cache, 'reload');
    assert.equal(new URL(request.url).search, '');
  }
});

test('a partial deployment leaves the previous cache intact and cannot install', async () => {
  const w = worker(); await (await w.caches.open('ro-tools-portal:pwa:old')).put(`${base}index.html`, new Response('old'));
  w.network(async request => new Response('missing', { status: request.url.endsWith('index.html') ? 200 : 404 }));
  await assert.rejects(w.lifecycle('install'), /(Incomplete|Mismatched) portal shell/);
  assert.deepEqual(await w.caches.keys(), ['ro-tools-portal:pwa:old']);
});

test('activation removes only previous portal PWA caches', async () => {
  const w = worker(); await w.lifecycle('install');
  await w.caches.open('ro-tools-portal:pwa:old'); await w.caches.open('other-calculator-cache');
  await w.lifecycle('activate');
  assert.deepEqual(await w.caches.keys(), [`ro-tools-portal:pwa:${current}`, 'other-calculator-cache']);
  assert(!/self\.(skipWaiting|clients\.claim)\(/.test(script));
});

test('never handles siblings, cross-origin, catalog, nav releases, non-GET or query assets', () => {
  const w = worker();
  for (const url of ['/dim_glacier_planner/', '/ro-leveling-map/', '/ro-reform-preparation/', '/sessrumnir-ocean-week-guide/', `${base}catalog/v1/tools.json`, `${base}integrations/nav/releases/1.2.0/nav.js`, `${base}unknown/`, 'https://example.com/api', `${base}icons/icon-192.png?private=1`, '/ro_tools_portal_evil/']) {
    assert.equal(w.fetch(url), undefined); assert.equal(w.fetch(url, { mode: 'navigate' }), undefined);
  }
  assert.equal(w.fetch(`${base}icons/icon-192.png`, { method: 'POST' }), undefined);
});

test('offline shell handles both entry URLs and queries without retaining query data', async () => {
  const w = worker(); await w.lifecycle('install');
  const before = [...w.stores.values()][0].size;
  w.network(async () => { throw new TypeError('offline'); });
  for (const url of [base, `${base}index.html`, `${base}?q=glacier&private=value`]) {
    const response = await w.fetch(url, { mode: 'navigate' });
    assert.equal(response.status, 200); assert.match(await response.text(), /data-offline-snapshot="true"/);
  }
  assert.equal([...w.stores.values()][0].size, before);
  assert([...w.stores.values()][0].keys().every(url => !url.includes('?')));
});

test('online navigation bypasses old shell and does not contaminate its cache', async () => {
  const w = worker(); await w.lifecycle('install');
  w.network(async () => new Response('new online shell'));
  assert.equal(await (await w.fetch(base, { mode: 'navigate' })).text(), 'new online shell');
  assert.equal(w.requests.at(-1).options.cache, 'no-cache');
  w.network(async () => { throw new TypeError('offline'); });
  assert.match(await (await w.fetch(base, { mode: 'navigate' })).text(), /วางแผนให้พร้อม/);
});

test('temporary server errors get the shell; real not-found remains not-found', async () => {
  const w = worker(); await w.lifecycle('install');
  w.network(async () => new Response('down', { status: 503 }));
  assert.equal((await w.fetch(base, { mode: 'navigate' })).status, 200);
  w.network(async () => new Response('not found', { status: 404 }));
  assert.equal((await w.fetch(base, { mode: 'navigate' })).status, 404);
});

test('a stalled navigation is bounded and falls back to the stored shell', async () => {
  const w = worker(); await w.lifecycle('install');
  w.network((_request, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')))));
  assert.match(await (await w.fetch(base, { mode: 'navigate' })).text(), /วางแผนให้พร้อม/);
});


test('CDN/deploy skew with HTTP 200 cannot install HTML from a different build', async () => {
  const w = worker();
  await w.caches.open('ro-tools-portal:pwa:old');
  w.network(async request => new Response(request.url.endsWith('index.html') ? '<html><script src="assets/index-wrong.js"></script></html>' : contents.get(request.url)));
  await assert.rejects(w.lifecycle('install'), /Mismatched portal shell/);
  assert.deepEqual(await w.caches.keys(), ['ro-tools-portal:pwa:old']);
});


test('verified public assets use canonical cache keys independent of Vary request headers', async () => {
  const w = worker(); await w.lifecycle('install');
  w.network(async () => { throw new TypeError('offline'); });
  const asset = files.find(path => path.endsWith('.js'));
  const response = await w.fetch(asset, { headers: { Origin: origin } });
  assert.equal(response.status, 200);
  assert.equal(w.matches.at(-1), `${origin}${asset}`);
});
