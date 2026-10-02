import { test, expect, type Page } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = '/ro_tools_portal/';
async function control(page: Page) {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect(page.locator('#pwa-update')).toBeHidden();
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}

test('manifest is installable in Chromium and registration stays inside the portal', async ({ page, context }) => {
  await control(page);
  const cdp = await context.newCDPSession(page);
  const manifest = await cdp.send('Page.getAppManifest');
  expect(manifest.errors).toEqual([]);
  expect(manifest.url).toBe(new URL('manifest.webmanifest', page.url()).href);
  expect(JSON.parse(manifest.data!).scope).toBe(BASE);
  expect((await cdp.send('Page.getInstallabilityErrors')).installabilityErrors).toEqual([]);
  const registrations = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map(r => ({ scope: new URL(r.scope).pathname, script: new URL(r.active!.scriptURL).pathname, cache: r.updateViaCache })));
  expect(registrations).toEqual([{ scope: BASE, script: `${BASE}sw.js`, cache: 'none' }]);
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration('/dim_glacier_planner/'))?.scope)).toBeUndefined();
  await page.getByRole('button', { name: 'โหมดสว่าง', exact: true }).click();
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f5f7f1');
});

test('offline relaunch keeps filters, pins and theme and clearly limits offline support', async ({ page, context }, testInfo) => {
  await control(page);
  await page.getByRole('button', { name: 'ปักหมุด แผนที่เก็บเลเวล', exact: true }).click();
  await page.getByRole('button', { name: 'โหมดสว่าง', exact: true }).click();
  await context.setOffline(true);
  await page.goto('./?q=glacier');
  await expect(page.locator('html')).toHaveAttribute('data-offline-snapshot', 'true');
  await expect(page.locator('#offline-status')).toBeVisible();
  await expect(page.locator('#offline-status')).toContainText('ยังต้องใช้อินเทอร์เน็ต');
  await expect(page.locator('[data-tool]:visible')).toHaveCount(1);
  await expect(page.locator('#favorites')).toContainText('แผนที่เก็บเลเวล');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('searchbox').fill('Best Status');
  await expect(page.locator('[data-tool]:visible')).toHaveCount(1);
  await expect(page.locator('[data-tool="best-status"] a.launch')).toHaveAttribute('href', 'https://econds.github.io/ro-best-status/');
  await page.getByRole('searchbox').fill('');
  await expect(page.locator('[data-tool="grade-refine"] a.launch')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const screenshot = testInfo.outputPath('pwa-offline-mobile.png');
  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach('Offline portal at 390px', { path: screenshot, contentType: 'image/png' });
  await context.setOffline(false);
  await page.reload();
  await expect(page.locator('html')).not.toHaveAttribute('data-offline-snapshot');
  await expect(page.locator('#offline-status')).toBeHidden();
});

test('controlled page passes catalog, releases, sibling and cross-origin requests through', async ({ page, context }) => {
  await control(page);
  const origin = new URL(page.url()).origin;
  const paths = [`${BASE}catalog/v1/tools.json`, `${BASE}integrations/nav/releases/1.2.0/nav.js`, '/dim_glacier_planner/', '/ro-best-status/'];
  for (const pathname of paths) {
    const url = `${origin}${pathname}`;
    await context.route(url, route => route.fulfill({ body: 'uncached fixture' }));
    const response = page.waitForResponse(url);
    await page.evaluate(url => fetch(url).then(r => r.text()), url);
    expect((await response).fromServiceWorker()).toBe(false);
  }
  await context.route('https://example.com/pwa-fixture', route => route.fulfill({ body: 'external', headers: { 'Access-Control-Allow-Origin': '*' } }));
  const external = page.waitForResponse('https://example.com/pwa-fixture');
  await page.evaluate(() => fetch('https://example.com/pwa-fixture').then(r => r.text()));
  expect((await external).fromServiceWorker()).toBe(false);
  const keys = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async name => (await (await caches.open(name)).keys()).map(r => r.url)))).flat());
  expect(keys.every(url => url.startsWith(`${origin}${BASE}`) && !/catalog|integrations|\?/.test(url))).toBe(true);
  await page.goto(`${origin}/dim_glacier_planner/`);
  expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
});

test('unavailable service workers leave the portal fully usable', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await page.getByRole('searchbox').fill('ocean');
  await expect(page.locator('[data-tool="ocean-week-guide"] a.launch')).toBeVisible();
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await context.close();
});

test('new offline version waits for old tabs, then activates without touching other caches', async ({ browser }) => {
  // Isolated, real HTTP server: control the update without changing shared dist/.
  // Only the fixture worker revision changes; shell bytes/digests stay identical.
  const dist = path.resolve('dist');
  let version = 1;
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url!, 'http://localhost').pathname;
      if (!pathname.startsWith(BASE)) { response.writeHead(404).end(); return; }
      const file = pathname.slice(BASE.length) || 'index.html';
      let bytes = await readFile(path.join(dist, file));
      if (file === 'sw.js' && version === 2) bytes = Buffer.from(bytes.toString().replace('const CACHE_NAME = `${CACHE_PREFIX}', 'const CACHE_NAME = `${CACHE_PREFIX}fixture-v2-'));
      const type = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.webmanifest') ? 'application/manifest+json' : file.endsWith('.png') ? 'image/png' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/html';
      response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }).end(bytes);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  const context = await browser.newContext();
  try {
    let page = await context.newPage();
    const url = `http://127.0.0.1:${address.port}${BASE}`;
    await page.goto(url);
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    const initial = await page.evaluate(async () => {
      await caches.open('unrelated-tool-cache');
      return (await caches.keys()).filter(key => key.startsWith('ro-tools-portal:pwa:'));
    });
    version = 2;
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update(); });
    await expect(page.locator('#pwa-update')).toBeVisible();
    expect(await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())?.waiting)).toBe(true);
    const during = await page.evaluate(() => caches.keys());
    expect(during).toContain(initial[0]);
    expect(during).toContain('unrelated-tool-cache');
    await page.close();
    page = await context.newPage();
    await page.goto(url);
    await expect.poll(() => page.evaluate(async () => (await caches.keys()).filter(key => key.startsWith('ro-tools-portal:pwa:')))).toEqual([expect.stringContaining('fixture-v2-')]);
    expect(await page.evaluate(() => caches.keys())).toContain('unrelated-tool-cache');
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#offline-status')).toBeVisible();
    await expect(page.getByRole('searchbox')).toBeVisible();
  } finally {
    await context.close();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
