import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { CATALOG_URL } from '../../integrations/nav/src/catalog';
const remote = await readFile('dist/catalog/v1/tools.json', 'utf8');
const bundle = await readFile('integrations/nav/releases/2.0.0/nav.js', 'utf8');
const target = 'https://econds.github.io/RO-Juno-Fall-Academic-Festival-2026/';
for (const id of ['leveling-map','reform-workshop','dim-glacier','ocean-week-guide','best-status']) {
  test(`${id}: frozen V2 discovers published Juno catalog before menu opens`, async ({page}) => {
    let requests = 0;
    await page.route(CATALOG_URL, route => { requests++; return route.fulfill({contentType:'application/json',body:remote}); });
    await page.route('**/juno-fixture', route => route.fulfill({contentType:'text/html',body:`<ro-suite-nav tool-id="${id}"></ro-suite-nav><script type="module" src="/frozen-nav.js"></script>`}));
    await page.route('**/frozen-nav.js', route => route.fulfill({contentType:'text/javascript',body:bundle}));
    await page.goto('/juno-fixture');
    const nav = page.locator('ro-suite-nav');
    await expect(nav.locator(`a[href="${target}"]`)).toBeAttached();
    expect(requests).toBe(1);
    await expect(nav.locator('button')).toHaveAttribute('aria-expanded','false');
    await nav.locator('button').click();
    await nav.locator('input[type=search]').fill('Juno');
    await expect(nav.locator('li a')).toHaveCount(1);
    await expect(nav.locator('li a')).toHaveAttribute('href',target);
  });
}
test('Juno metadata records dated source evidence without claiming live event verification', async ({page}) => {
  await page.goto('./?q=Juno');
  const card = page.locator('[data-tool="juno-festival-2026"]');
  await expect(card).toContainText('2026-10-14 – 2026-11-11');
  await expect(card.locator('a.launch')).toHaveAttribute('href',target);
  await card.locator('summary').click();
  await expect(card).toContainText('ยังไม่ได้ยืนยัน');
  await expect(card.locator('.archive-badge')).toHaveCount(0);
});
