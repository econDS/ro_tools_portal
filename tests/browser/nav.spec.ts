import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import { snapshot, validateNavCatalog, CATALOG_URL } from '../../integrations/nav/src/catalog';

const script = await readFile('integrations/nav/releases/1.2.0/nav.js', 'utf8');
const toolPaths = ['/ro-leveling-map/', '/ro-reform-preparation/', '/dim_glacier_planner/', '/sessrumnir-ocean-week-guide/'];
async function fixture(page: Page, { id = 'reform-workshop', remote = false, blocked = false, path = '/ro-reform-preparation/', theme = '' } = {}) {
  const html = `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Nav fixture only</title><style>body{margin:8px;font:16px Tahoma}button{background:rgb(255,0,0)}h1{font-size:28px}table{border:3px solid blue}td{padding:10px}</style><ro-suite-nav tool-id="${id}" ${theme ? `theme="${theme}"` : ''} portal-url="https://econds.github.io/ro_tools_portal/" ${remote ? `catalog-url="${CATALOG_URL}"` : ''}><nav aria-label="เมนูสำรอง"><a href="https://econds.github.io/ro_tools_portal/">กลับ RO Tools Portal</a></nav></ro-suite-nav><h1>เครื่องคิดเลขจำลองสำหรับทดสอบเมนู</h1><label>จำนวน <input id="quantity" type="number" value="2"></label><button id="calculate">คำนวณ fixture</button><output id="total">20</output><table><tr><td>ตารางเดิม</td></tr></table><dialog id="dialog">หน้าต่างเดิม<button id="close">ปิด</button></dialog><button id="open">เปิดหน้าต่าง</button><script>document.querySelector('#calculate').onclick=()=>document.querySelector('#total').textContent=Number(document.querySelector('#quantity').value)*10;document.querySelector('#open').onclick=()=>document.querySelector('#dialog').showModal();document.querySelector('#close').onclick=()=>document.querySelector('#dialog').close()</script><script type="module" src="./assets/ro-suite/1.2.0/nav.js"></script></html>`;
  await page.route(`**${path}`, route => route.fulfill({ contentType: 'text/html', body: html }));
  await page.route('**/assets/ro-suite/1.2.0/nav.js', route => blocked ? route.abort() : route.fulfill({ contentType: 'text/javascript', body: script }));
  await page.goto(new URL(path, test.info().project.use.baseURL!).href);
  if (!blocked) await page.waitForFunction(() => !!document.querySelector('ro-suite-nav')?.shadowRoot);
}

test('nav validation rejects unsafe catalogs and strips unused fields', () => {
  expect(validateNavCatalog(snapshot)).toEqual(snapshot);
  for (const mutate of [
    (data: any) => { data.schemaVersion = 2; },
    (data: any) => { data.tools[0].canonicalUrl = 'javascript:alert(1)'; },
    (data: any) => { data.tools[0].title = '<img src=x onerror=alert(1)>'; },
    (data: any) => { data.tools.push(data.tools[0]); },
    (data: any) => { data.tools.at(-1).canonicalUrl = 'https://econds.github.io/ro-leveling-map/'; },
    (data: any) => { data.tools[0].title = 'x'.repeat(161); },
    (data: any) => { data.tools[0].identity.accent = 'red;background:url(x)'; },
    (data: any) => { data.tools[0].identity.accent = '#ffffff'; },
    (data: any) => { data.tools[0].identity.icon = '__proto__'; },
  ]) { const data = structuredClone(snapshot); mutate(data); expect(() => validateNavCatalog(data)).toThrow(); }
  expect(validateNavCatalog({ ...snapshot, payload: '<script>bad</script>' })).toEqual(snapshot);
});

test('release checksums match actual files and source hashes', async () => {
  const lock = JSON.parse(await readFile('integrations/nav/releases/1.2.0/nav.lock.json', 'utf8'));
  for (const [path, value] of Object.entries(lock.files) as [string, {sha256: string}][]) expect(createHash('sha256').update(await readFile(`integrations/nav/releases/1.2.0/${path}`)).digest('hex')).toBe(value.sha256);
  for (const [path, hash] of Object.entries(lock.sourceHashes)) expect(createHash('sha256').update(await readFile(path)).digest('hex')).toBe(hash);
});

test('keyboard toggle, Escape focus return, current page, CSS and calculator isolation', async ({ page }) => {
  await fixture(page);
  const toggle = page.getByRole('button', {name: 'เครื่องมืออื่น'});
  await toggle.focus(); await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', {name: 'แผนที่เก็บเลเวล', exact: true})).toBeFocused();
  await expect(page.locator('[aria-current="page"]')).toHaveAttribute('href', 'https://econds.github.io/ro-reform-preparation/');
  await expect(page.getByRole('link', {name: /Grade & Refine/})).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused(); await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(await page.locator('#calculate').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 0, 0)');
  expect(await toggle.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
  expect(await page.locator('table').evaluate(el => getComputedStyle(el).borderTopWidth)).toBe('3px');
  await page.locator('#quantity').fill('7'); await page.locator('#calculate').click(); await expect(page.locator('#total')).toHaveText('70');
  await page.locator('#open').click(); await expect(page.locator('dialog')).toBeVisible(); await page.locator('#close').click();
  await page.evaluate(() => { const node = document.querySelector('ro-suite-nav')!; node.remove(); document.body.prepend(node); });
  await expect(page.getByRole('link', {name: 'กลับ RO Tools Portal'})).toHaveCount(1);
});

for (const path of toolPaths) test(`local fixture uses correct asset and destination paths at ${path}`, async ({ page }) => {
  const id = snapshot.tools.find(t => t.canonicalUrl?.endsWith(path))!.id;
  await fixture(page, { id, path });
  await page.getByRole('button', {name: 'เครื่องมืออื่น'}).click();
  await expect(page.locator('[aria-current="page"]')).toHaveAttribute('href', `https://econds.github.io${path}`);
  await expect(page.getByRole('link', {name: 'Sessrumnir Ocean Week', exact: true})).toHaveAttribute('href', 'https://econds.github.io/sessrumnir-ocean-week-guide/');
  expect(await page.locator('script[type="module"]').getAttribute('src')).toBe('./assets/ro-suite/1.2.0/nav.js');
});

test('blocked script retains visible light-DOM fallback', async ({ page }) => {
  await fixture(page, { blocked: true });
  await expect(page.getByRole('navigation', {name: 'เมนูสำรอง'})).toBeVisible();
  await expect(page.getByRole('link', {name: 'กลับ RO Tools Portal'})).toBeVisible();
  await page.locator('#quantity').fill('8'); await page.locator('#calculate').click(); await expect(page.locator('#total')).toHaveText('80');
});

test('unknown tool gets generic safe return without invented current identity', async ({ page }) => {
  await fixture(page, { id: 'unknown' });
  await expect(page.getByRole('link', {name: 'กลับ RO Tools Portal'})).toHaveCount(1);
  await expect(page.getByRole('button', {name: 'เครื่องมืออื่น'})).toHaveCount(0);
});

for (const mode of ['blocked', 'malformed', 'major', 'unsafe', 'identity', 'oversized', 'timeout', 'redirect']) test(`remote catalog ${mode} falls back without blocking fixture`, async ({ page }) => {
  let requests = 0;
  await page.route(CATALOG_URL, async route => {
    requests++;
    if (mode === 'blocked') return route.abort();
    if (mode === 'timeout') { await new Promise(resolve => setTimeout(resolve, 1800)); return route.abort().catch(() => {}); }
    if (mode === 'redirect') return route.fulfill({ status: 302, headers: {location: 'https://evil.example/'} });
    const data = structuredClone(snapshot);
    if (mode === 'major') (data as any).schemaVersion = 99;
    if (mode === 'unsafe') data.tools[0].canonicalUrl = 'https://evil.example/';
    if (mode === 'identity') (data.tools[0] as any).identity = { accent: '#ffffff', icon: 'map' };
    await route.fulfill({ contentType: 'application/json', body: mode === 'oversized' ? ' '.repeat(40_000) : mode === 'malformed' ? '{' : JSON.stringify(data) });
  });
  await fixture(page, { remote: true });
  expect(requests).toBe(0);
  await page.getByRole('button', {name: 'เครื่องมืออื่น'}).click();
  await expect(page.getByRole('link', {name: 'แผนที่เก็บเลเวล', exact: true})).toBeVisible();
  await expect(page.locator('ro-suite-nav').getByRole('status')).toHaveText('อัปเดตรายการไม่ได้ ใช้รายการที่ติดตั้งไว้');
  await page.getByRole('button', {name: 'เครื่องมืออื่น'}).click(); await page.getByRole('button', {name: 'เครื่องมืออื่น'}).click();
  expect(requests).toBe(1);
  await page.locator('#quantity').fill('9'); await page.locator('#calculate').click(); await expect(page.locator('#total')).toHaveText('90');
});

test('validated remote update stays navigation-only and preserves keyboard focus', async ({ page }) => {
  const data = structuredClone(snapshot); data.catalogVersion = 'test-fixture'; data.tools[0].title = 'แผนที่เก็บเลเวล ฉบับ fixture';
  let deliver: () => void = () => {};
  const pending = new Promise<void>(resolve => { deliver = resolve; });
  await page.route(CATALOG_URL, async route => { await pending; await route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) }); });
  await fixture(page, {remote: true});
  await page.getByRole('button', {name: 'เครื่องมืออื่น'}).click();
  await page.keyboard.press('Tab'); deliver();
  await expect(page.getByRole('link', {name: 'แผนที่เก็บเลเวล ฉบับ fixture', exact: true})).toBeFocused();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});

for (const width of [360, 390, 768, 1440]) test(`nav layout and targets at ${width}px`, async ({page}) => {
  await page.setViewportSize({width, height: 900}); await fixture(page);
  await page.getByRole('button', {name: 'เครื่องมืออื่น'}).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const el of await page.locator('ro-suite-nav').locator('a:visible, button:visible').all()) expect((await el.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});

test('current tool shows its catalog accent line and icon; switcher keeps icons when remote catalog omits identity', async ({ page }) => {
  const plain = structuredClone(snapshot); for (const tool of plain.tools) delete tool.identity; plain.tools[0].title = 'แผนที่เก็บเลเวล ฉบับ fixture';
  await page.route(CATALOG_URL, route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(plain) }));
  await fixture(page, { remote: true });
  const reform = snapshot.tools.find(tool => tool.id === 'reform-workshop')!;
  const nav = page.getByRole('navigation', {name: 'เครื่องมือ RO'});
  expect(await nav.evaluate(el => getComputedStyle(el).borderBottomColor)).toBe(await page.evaluate(hex => { const d = document.createElement('div'); d.style.color = hex; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; }, reform.identity!.accent));
  await expect(page.locator('ro-suite-nav .current .chip svg')).toHaveCount(1);
  await page.getByRole('button', {name: 'เครื่องมืออื่น'}).click();
  await expect(page.getByRole('link', {name: 'แผนที่เก็บเลเวล ฉบับ fixture', exact: true})).toBeVisible();
  await expect(page.locator('ro-suite-nav li .chip')).toHaveCount(snapshot.tools.length);
  await expect(page.getByRole('link', {name: reform.title, exact: true})).toHaveAttribute('aria-current', 'page');
});

const LIGHT_BG = 'rgb(241, 245, 237)', DARK_BG = 'rgb(22, 33, 27)';
for (const [scheme, theme, expected] of [['light', '', LIGHT_BG], ['dark', '', DARK_BG], ['light', 'dark', DARK_BG], ['dark', 'light', LIGHT_BG], ['dark', 'bogus', DARK_BG]] as const) test(`nav theme="${theme}" under ${scheme} system scheme`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: scheme });
  await fixture(page, { theme });
  const nav = page.getByRole('navigation', {name: 'เครื่องมือ RO'});
  expect(await nav.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(expected);
  // The host app keeps its own styles: the fixture's red buttons and white body are untouched.
  expect(await page.locator('#calculate').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 0, 0)');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  await page.getByRole('button', {name: 'เครื่องมืออื่น'}).click();
  const results = await new AxeBuilder({ page }).include('ro-suite-nav').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});
