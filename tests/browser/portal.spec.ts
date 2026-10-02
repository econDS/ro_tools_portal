import { test, expect } from '@playwright/test';
import { tools, approvedUrl, matches } from '../../src/catalog';
import { parseState, PORTAL_KEY, PREFS_KEY } from '../../src/preferences';

test('catalog URL rejection and preference input validation', () => {
  for (const value of ['javascript:alert(1)', 'https://econds.github.io/unknown/', 'https://econds.github.io/a/../ro-leveling-map/', 'https://econds.github.io/ro-leveling-map/?payload=x', 'https://econds.github.io:443/ro-leveling-map/', 'https://evil.example/', null]) expect(approvedUrl(value)).toBe(false);
  expect(() => parseState('{', new Set())).toThrow();
  expect(() => parseState(JSON.stringify({ version: 2 }), new Set())).toThrow();
  expect(() => parseState(' '.repeat(20_000), new Set())).toThrow();
  expect(parseState(JSON.stringify({version: 1, favorites: ['x', 'leveling-map', 'leveling-map'], recent: ['x']}), new Set(['leveling-map']))).toEqual({favorites: ['leveling-map'], recent: []});
  expect(matches(tools[0], 'เก็บเวล', 'all')).toBe(true);
  expect(matches(tools[2], 'GLACIER enchant', 'equipment')).toBe(true);
});

test('static anchors remain without JavaScript and show evidence accurately', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL!);
  for (const tool of tools.filter(t => t.listingStatus === 'listed')) await expect(page.locator(`[data-tool="${tool.id}"] a.launch`)).toHaveAttribute('href', tool.canonicalUrl!);
  await expect(page.locator('[data-tool="grade-refine"] a.launch')).toHaveCount(0);
  await expect(page.locator('[data-tool="ocean-week-guide"]')).toContainText('คู่มือกิจกรรมรอบที่ผ่านมา');
  await page.locator('[data-tool="ocean-week-guide"] summary').click();
  await expect(page.locator('[data-tool="ocean-week-guide"]')).toContainText('เปิดเว็บได้ ณ เวลาที่ตรวจ');
  await expect(page.locator('[data-tool="ocean-week-guide"]')).toContainText('ยังไม่ได้ยืนยัน');
  await expect(page.locator('#search-controls')).toBeHidden();
  await context.close();
});

test('Thai and English search, filters, no results, URL and keyboard reset', async ({ page }) => {
  await page.goto('./?keep=1#tools');
  const search = page.getByRole('searchbox');
  await search.fill('เก็บเวล');
  await expect(page.locator('[data-tool]:visible')).toHaveCount(1);
  await search.fill('GLACIER');
  await expect(page.locator('[data-tool="dim-glacier"]')).toBeVisible();
  await page.getByRole('button', { name: 'กิจกรรมและคู่มือ', exact: true }).click();
  await expect(page.getByText('ไม่พบเครื่องมือที่ตรงกัน', { exact: true })).toBeVisible();
  await page.getByRole('button', {name: 'ล้างการค้นหาและตัวกรอง'}).focus();
  await page.keyboard.press('Enter');
  await expect(search).toBeFocused();
  await expect(page.locator('[data-tool]:visible')).toHaveCount(6);
  expect(page.url()).toContain('?keep=1#tools');
  await page.goto('./?q=รีฟอร์ม&category=equipment');
  await expect(page.locator('[data-tool]:visible')).toHaveCount(1);
});

test('favorites, recent launches, theme, reset preserve unrelated storage bytes', async ({ page, context }) => {
  // Same-origin legacy-key fixture: intentionally no child calculator code is loaded.
  await page.addInitScript(() => { for (const key of ['reform-workshop.v1', 'reform-migration-fixture', 'leveling-fixture', 'dim-fixture', 'ocean-fixture']) if (!localStorage.getItem(key)) localStorage.setItem(key, '{"price":123,"inventory":[7]}'); });
  await context.route('https://econds.github.io/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Destination fixture</title><p>Fixture only</p>' }));
  await page.goto('./');
  const pin = page.getByRole('button', {name: 'ปักหมุด แผนที่เก็บเลเวล', exact: true});
  await pin.focus(); await page.keyboard.press('Space');
  await expect(page.locator('#favorites')).toContainText('แผนที่เก็บเลเวล');
  await page.reload();
  await expect(page.getByRole('button', {name: 'เลิกปักหมุด แผนที่เก็บเลเวล'})).toHaveAttribute('aria-pressed', 'true');
  const destination = page.waitForURL('https://econds.github.io/ro-leveling-map/');
  await page.locator('[data-tool="leveling-map"] a.launch').click();
  await destination; await page.goBack();
  await expect(page.locator('#recent')).toContainText('แผนที่เก็บเลเวล');
  await page.locator('#theme-toggle').click();
  const before = await page.evaluate(() => ({...localStorage}));
  await page.getByRole('button', { name: 'ล้างหมุดและประวัติของพอร์ทัล' }).click();
  const after = await page.evaluate(() => ({...localStorage}));
  expect(after[PORTAL_KEY]).toBeUndefined();
  expect(after[PREFS_KEY]).toBe(before[PREFS_KEY]);
  for (const key of Object.keys(before).filter(key => !key.startsWith('ro-suite:'))) expect(after[key]).toBe(before[key]);
  await expect(page.locator('#favorites')).toContainText('กด ☆');
});

for (const mode of ['blocked', 'quota', 'corrupt']) test(`storage ${mode} does not disable launch or controls`, async ({ page }) => {
  await page.addInitScript(mode => {
    if (mode === 'blocked') Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
    else if (mode === 'quota') Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
    else localStorage.setItem('ro-suite:portal:v1', '{bad json');
  }, mode);
  await page.goto('./');
  await page.getByRole('button', {name: 'ปักหมุด แผนที่เก็บเลเวล', exact: true}).click();
  await expect(page.locator('#storage-status')).toContainText('ยังเปิดเครื่องมือได้');
  await expect(page.locator('[data-tool="leveling-map"] a.launch')).toHaveAttribute('href', tools[0].canonicalUrl!);
  await page.getByRole('searchbox').fill('ocean');
  await expect(page.locator('[data-tool="ocean-week-guide"]')).toBeVisible();
});

test('runtime network failure and script blocking preserve static navigation', async ({ page }) => {
  await page.route('**/*.js', route => route.abort());
  await page.goto('./');
  await expect(page.locator('.tool-card a.launch')).toHaveCount(5);
  await expect(page.locator('.tool-card').first()).toBeVisible();
});

for (const width of [360, 390, 768, 1440]) test(`layout, focus, reduced motion and subpath assets at ${width}px`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const failed: string[] = [];
  page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
  await page.setViewportSize({ width, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.goto('./');
  await expect(page.getByRole('searchbox')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', {name: 'ข้ามไปเนื้อหา'})).toBeFocused();
  await page.keyboard.press('Enter');
  for (const button of await page.locator('button:visible').all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await page.locator('script[src]').evaluateAll(nodes => nodes.every(n => (n as HTMLScriptElement).src.includes('/ro_tools_portal/assets/')))).toBe(true);
  expect(errors).toEqual([]); expect(failed).toEqual([]);
  await page.screenshot({ path: `test-results/portal-${width}.png`, fullPage: true });
});

test('public catalog has only navigation fields and no capabilities or private state', async ({ request }) => {
  const response = await request.get('catalog/v1/tools.json');
  expect(response.ok()).toBe(true);
  const catalog = await response.json();
  expect(catalog.schemaVersion).toBe(1);
  expect(catalog.tools).toHaveLength(6);
  expect(Object.keys(catalog.tools[0]).sort()).toEqual(['canonicalUrl', 'id', 'identity', 'listingStatus', 'title']);
});

test('each tool card and destination carries its catalog accent and icon', async ({ page }) => {
  await page.goto('./');
  for (const tool of tools) {
    for (const selector of [`[data-tool="${tool.id}"]`, `.dest[data-launch="${tool.id}"]`]) {
      if (selector.startsWith('.dest') && tool.listingStatus !== 'listed') continue;
      const element = page.locator(selector);
      expect(await element.evaluate(el => getComputedStyle(el).getPropertyValue('--tool-accent').trim())).toBe(tool.identity.accent);
      await expect(element.locator('.tool-icon svg, .dest-icon svg')).toHaveCount(1);
    }
  }
});

test('Best Status supports Thai/English search, crafting filter, pinning and ordinary launch', async ({ page, context }) => {
  const url = 'https://econds.github.io/ro-best-status/';
  await context.route(url, route => route.fulfill({ contentType: 'text/html', body: '<title>Best Status destination fixture</title>' }));
  await page.goto('./');
  const search = page.getByRole('searchbox');
  for (const query of ['Best Status', 'STAT FORGE', 'สเตตัส', 'รูน', 'ยาแอส', 'ปรุงยา', 'Prepare Potion']) {
    await search.fill(query);
    await expect(page.locator('[data-tool]:visible')).toHaveCount(1);
    await expect(page.locator('[data-tool="best-status"]')).toBeVisible();
  }
  await search.fill('');
  await page.getByRole('button', { name: 'คราฟต์และค่าสเตตัส', exact: true }).click();
  await expect(page.locator('[data-tool]:visible')).toHaveCount(1);
  const card = page.locator('[data-tool="best-status"]');
  await card.getByRole('button', { name: 'ปักหมุด Best Status — STAT FORGE', exact: true }).click();
  await expect(page.locator('#favorites')).toContainText('Best Status');
  await page.reload();
  await expect(page.locator('#favorites')).toContainText('Best Status');
  await expect(card.locator('a.launch')).toHaveAttribute('href', url);
  await card.locator('a.launch').click(); await page.waitForURL(url);
  await page.goBack();
  await expect(page.locator('#recent')).toContainText('Best Status');
});

for (const width of [390, 1440]) test(`Best Status branding is discoverable and readable at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('./');
  for (const query of ['Best Status', 'STAT FORGE', 'สเตตัส', 'rune', 'poison', 'potion', 'dex', 'luk', 'int']) {
    await page.getByRole('searchbox').fill(query);
    const card = page.locator('[data-tool="best-status"]');
    await expect(card).toBeVisible();
    await expect(card.locator('h3')).toHaveText('Best Status — STAT FORGE');
    await expect(card.locator('a.launch')).toHaveAttribute('href', 'https://econds.github.io/ro-best-status/');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('[data-tool="best-status"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `test-results/brand-consistency-portal-${width}.png`, fullPage: true });
});

test('Ocean status dimensions stay separate and event metadata remains historical', async ({ page }, info) => {
  const ocean = tools.find(tool => tool.id === 'ocean-week-guide')!;
  expect(ocean.contentType).toBe('guide');
  expect(ocean.contentLifecycle).toBe('archived-period');
  expect(ocean.listingStatus).toBe('listed');
  expect(ocean.event).toMatchObject({ editionId: 'sessrumnir-ocean-week-2026', startsOn: '2026-05-06', endsOn: '2026-06-04', timeZone: 'Asia/Bangkok', endBoundary: 'before-maintenance', exactEndAt: null, stateAsOfReview: 'past-stated-period' });
  expect(ocean.suiteCapabilitiesConfirmed).toContain('navigation.v1');
  expect(ocean.plannedSuiteCapabilities).not.toContain('navigation.v1');
  expect(ocean.gameDataVerifiedOn).toBeNull();
  await page.goto('./');
  const card = page.locator('[data-tool="ocean-week-guide"]');
  await expect(card.getByRole('link', { name: /อ่านคู่มือย้อนหลัง/ })).toHaveAttribute('href', 'https://econds.github.io/sessrumnir-ocean-week-guide/');
  await card.locator('summary').click();
  await expect(card).toContainText('ทบทวน metadata ล่าสุด');
  await expect(card).toContainText('ติดตั้งและทดสอบแล้ว');
  await expect(card).toContainText('ยังไม่ได้ยืนยัน');
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await card.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`ocean-status-${width}.png`), fullPage: true });
  }
});
