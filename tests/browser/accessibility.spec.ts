import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const theme of ['light', 'dark']) test(`portal automated accessibility (${theme})`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: theme as 'light' | 'dark' });
  await page.goto('./');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.locator('[data-tool="ocean-week-guide"] summary').click();
  const expanded = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(expanded.violations).toEqual([]);
});
