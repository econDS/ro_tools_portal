import { test, expect } from '@playwright/test';
import { tools } from '../../src/catalog';
const active = ['leveling-map', 'reform-workshop', 'dim-glacier', 'best-status'];
test('task-first discovery, lifecycle groups and source names', async ({ page }) => {
  await page.goto('./');
  expect(await page.locator('main > section').evaluateAll(nodes => nodes.map(n => n.id || 'hero'))).toEqual(['hero', 'quick-access', 'journeys', 'tools', 'about']);
  await expect(page.locator('.hero .destinations')).toHaveCount(0);
  await expect(page.locator('.hero a')).toHaveCount(2);
  await expect(page.locator('#quick-access')).toBeHidden();
  await expect(page.locator('#shortcut-hint')).toBeVisible();
  expect(await page.locator('#journeys [data-task]').evaluateAll(nodes => nodes.map(n => (n as HTMLElement).dataset.task))).toEqual(active);
  for (const id of active) {
    await expect(page.locator(`#active-tools [data-tool="${id}"]`)).toHaveCount(1);
    await expect(page.locator(`[data-task="${id}"] a`)).toHaveAttribute('href', tools.find(t => t.id === id)!.canonicalUrl!);
  }
  await expect(page.locator('#archived-tools [data-tool="ocean-week-guide"]')).toHaveCount(1);
  await expect(page.locator('#planned-tools [data-tool="grade-refine"] a.launch')).toHaveCount(0);
  await expect(page.locator('#tools > .section-title')).toContainText('เครื่องคำนวณ 4 ตัว · คู่มือย้อนหลัง 1 ชุด · กำลังพัฒนา 1 ตัว');
  await expect(page.locator('.evidence a').filter({ hasText: /^S\d+$/ })).toHaveCount(0);
  expect(await page.locator('[id]').evaluateAll(nodes => nodes.length === new Set(nodes.map(n => n.id)).size)).toBe(true);
});
for (const [query, id] of [['เก็บเวล','leveling-map'],['Reform','reform-workshop'],['Rune','best-status'],['STAT FORGE','best-status'],['Dim Glacier','dim-glacier'],['Ocean Week','ocean-week-guide']]) test(`task search ${query}`, async ({ page }) => {
  await page.goto('./?keep=1#tools');
  await page.getByRole('searchbox').fill(query);
  await expect(page.locator(`[data-tool="${id}"]`)).toBeVisible();
  expect(new URL(page.url()).searchParams.get('keep')).toBe('1');
  expect(new URL(page.url()).hash).toBe('#tools');
  for (const group of await page.locator('[data-tool-group]:visible').all()) expect(await group.locator('[data-tool]:visible').count()).toBeGreaterThan(0);
});
for (const width of [360,390,768,1440]) for (const theme of ['light','dark']) test(`task-first ${width} ${theme}: initial, returning, keyboard and screenshots`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(theme => localStorage.setItem('ro-suite:prefs:v1', JSON.stringify({ version: 1, theme })), theme);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await page.locator('.hero').boundingBox())!.height).toBeLessThan(900);
  await page.keyboard.press('Tab'); await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('#main')).toBeFocused();
  const task = page.locator('#journeys a').first(); await task.focus(); await expect(task).toBeFocused();
  expect(await task.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
  for (const link of await page.locator('#journeys a').all()) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.evaluate(() => window.scrollTo(0,0));
  await page.screenshot({ path: info.outputPath(`after-initial-${width}-${theme}.png`), fullPage: true });
  await page.evaluate(() => localStorage.setItem('ro-suite:portal:v1', JSON.stringify({version:1,favorites:['best-status'],recent:['leveling-map']})));
  await page.reload();
  await expect(page.locator('#quick-access')).toBeVisible();
  await expect(page.locator('#favorites a')).toHaveAttribute('href','https://econds.github.io/ro-best-status/');
  await expect(page.locator('#recent a')).toHaveAttribute('href','https://econds.github.io/ro-leveling-map/');
  await expect(page.locator('#shortcut-hint')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath(`after-returning-${width}-${theme}.png`), fullPage: true });
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme === 'light'?'dark':'light');
  expect(errors).toEqual([]);
});
